/**
 * AATAKSH - Third-Person Player Controller
 * Handles movement (walk, sprint, crouch, jump), third-person shoulder camera with ADS zoom,
 * weapon handling, recoil kick, abilities (Adrenaline Rush / Titan Shield), health, and looting.
 */

class PlayerController {
    constructor(scene, camera, characterId = 'akshat') {
        this.scene = scene;
        this.camera = camera;
        this.characterId = characterId;
        this.isPlayer = true;

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxArmor = 100;
        this.armor = 50;
        this.armorLevel = 2; // 1: 30%, 2: 50%, 3: 70% damage reduction
        this.medkits = 2;
        this.isHealing = false;
        this.healTimer = 0;
        this.kills = 0;
        this.damageDealt = 0;
        this.alive = true;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.isMoving = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isJumping = false;
        this.isAiming = false;

        // Camera control
        this.yaw = 0;
        this.pitch = 0;
        this.cameraDistance = 3.2;
        this.cameraShoulderX = 0.8;
        this.cameraHeight = 1.7;
        this.targetFov = 65;
        this.baseFov = 65;
        this.recoilPitch = 0;
        this.recoilYaw = 0;

        // Character 3D Model & Rig
        this.charModel = window.modelFactory.createCharacter(this.characterId);
        this.scene.add(this.charModel.root);

        // Weapon Inventory & Slots
        this.inventory = {
            rifle: { has: true, mag: 30, reserve: 90 },
            sniper: { has: true, mag: 5, reserve: 20 },
            shotgun: { has: false, mag: 8, reserve: 24 },
            pistol: { has: true, mag: 7, reserve: 35 },
            grenade: { has: true, count: 3 }
        };
        this.currentSlot = 1; // 1: rifle, 2: sniper/shotgun, 3: pistol, 4: grenade
        this.activeWeaponKey = 'rifle';
        this.weaponMesh = null;
        this.fireCooldown = 0;
        this.isReloading = false;
        this.reloadTimer = 0;

        // Ability System
        this.abilityActive = false;
        this.abilityDuration = 8.0;
        this.abilityTimer = 0;
        this.abilityCooldownMax = 25.0;
        this.abilityCooldown = 0;

        // Footstep timing
        this.stepTimer = 0;

        // Equip default weapon
        this.equipWeapon(this.activeWeaponKey);
    }

    setCharacter(characterId) {
        if (this.charModel) {
            this.scene.remove(this.charModel.root);
        }
        this.characterId = characterId;
        this.charModel = window.modelFactory.createCharacter(this.characterId);
        this.scene.add(this.charModel.root);
        this.equipWeapon(this.activeWeaponKey);
    }

    equipWeapon(weaponKey) {
        if (!WEAPON_CONFIGS[weaponKey]) return;
        this.activeWeaponKey = weaponKey;

        // Detach old weapon
        if (this.weaponMesh) {
            this.charModel.weaponMount.remove(this.weaponMesh);
            this.weaponMesh = null;
        }

        // Attach new 3D weapon model
        this.weaponMesh = window.modelFactory.createWeaponModel(weaponKey);
        this.charModel.weaponMount.add(this.weaponMesh);

        // Adjust weapon placement offset in hands
        if (weaponKey === 'sniper') {
            this.weaponMesh.position.set(0, 0, -0.15);
        } else if (weaponKey === 'shotgun') {
            this.weaponMesh.position.set(0, 0, -0.1);
        } else if (weaponKey === 'pistol') {
            this.weaponMesh.position.set(0, 0, 0.05);
        } else {
            this.weaponMesh.position.set(0, 0, -0.05);
        }

        if (window.game && window.game.ui) {
            window.game.ui.updateWeaponHud(weaponKey, this.inventory[weaponKey]);
        }
    }

    switchSlot(slotNum) {
        if (this.isReloading) return;
        this.currentSlot = slotNum;
        if (slotNum === 1 && this.inventory.rifle.has) {
            this.equipWeapon('rifle');
        } else if (slotNum === 2) {
            if (this.inventory.sniper.has) this.equipWeapon('sniper');
            else if (this.inventory.shotgun.has) this.equipWeapon('shotgun');
        } else if (slotNum === 3 && this.inventory.pistol.has) {
            this.equipWeapon('pistol');
        } else if (slotNum === 4 && this.inventory.grenade.has && this.inventory.grenade.count > 0) {
            this.equipWeapon('grenade');
        }
    }

    // Trigger hero ability
    useAbility() {
        if (this.abilityCooldown > 0 || this.abilityActive) return;

        this.abilityActive = true;
        this.abilityTimer = this.abilityDuration;
        this.abilityCooldown = this.abilityCooldownMax;

        const isSpeed = (this.characterId === 'akshat');
        if (isSpeed) {
            this.charModel.speedAura.visible = true;
            if (window.soundSystem) window.soundSystem.playAbility('speed');
        } else {
            this.charModel.shieldDome.visible = true;
            if (window.soundSystem) window.soundSystem.playAbility('shield');
        }

        if (window.game && window.game.ui) {
            window.game.ui.showToast(`ABILITY ACTIVATED: ${this.charModel.abilityName.toUpperCase()}!`);
        }
    }

    // Use Healing Medkit
    useMedkit() {
        if (this.health >= this.maxHealth || this.medkits <= 0 || this.isHealing) return;
        this.isHealing = true;
        this.healTimer = 3.0; // 3 second channel time
        if (window.game && window.game.ui) {
            window.game.ui.showToast('Using First Aid Medkit...');
        }
    }

    // Reload active weapon
    reload() {
        const inv = this.inventory[this.activeWeaponKey];
        const cfg = WEAPON_CONFIGS[this.activeWeaponKey];
        if (!inv || !cfg || this.activeWeaponKey === 'grenade') return;
        if (inv.mag >= cfg.magSize || inv.reserve <= 0 || this.isReloading) return;

        this.isReloading = true;
        this.reloadTimer = cfg.reloadTime;
        if (window.soundSystem) window.soundSystem.playReload();
        if (window.game && window.game.ui) {
            window.game.ui.showToast('Reloading...');
        }
    }

    // Primary Fire Action
    shoot() {
        if (!this.alive || this.isReloading) return;
        if (this.fireCooldown > 0) return;

        const cfg = WEAPON_CONFIGS[this.activeWeaponKey];
        if (!cfg) return;

        if (this.activeWeaponKey === 'grenade') {
            if (this.inventory.grenade.count <= 0) return;
            this.inventory.grenade.count--;
            this.fireCooldown = cfg.fireRate;

            // Throw grenade along camera forward
            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            const throwOrigin = this.position.clone().add(new THREE.Vector3(0, 1.6, 0)).add(camDir.clone().multiplyScalar(0.8));
            window.game.weaponManager.throwGrenade(this, throwOrigin, camDir);

            if (this.inventory.grenade.count <= 0) {
                this.switchSlot(1);
            }
            if (window.game && window.game.ui) {
                window.game.ui.updateWeaponHud(this.activeWeaponKey, this.inventory[this.activeWeaponKey]);
            }
            return;
        }

        const inv = this.inventory[this.activeWeaponKey];
        if (inv.mag <= 0) {
            this.reload();
            return;
        }

        // Fire bullet
        inv.mag--;
        this.fireCooldown = cfg.fireRate;
        this.charModel.recoilKick = 0.35;

        // Weapon muzzle origin in world
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        // Calculate fire origin at shoulder / barrel level
        const rightOffset = new THREE.Vector3(0.3, -0.1, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const origin = this.position.clone().add(new THREE.Vector3(0, 1.45, 0)).add(rightOffset).add(camDir.clone().multiplyScalar(0.5));

        // Fire through weapon manager
        window.game.weaponManager.fireWeapon(this, this.activeWeaponKey, origin, camDir, this.isAiming);

        // Add camera recoil kick
        this.recoilPitch += cfg.recoilVertical;
        this.recoilYaw += (Math.random() - 0.5) * cfg.recoilHorizontal;

        if (window.game && window.game.ui) {
            window.game.ui.updateWeaponHud(this.activeWeaponKey, inv);
        }

        if (inv.mag === 0) {
            this.reload();
        }
    }

    // Damage intake with armor absorption and Titan Shield reduction
    takeDamage(amount, attacker = null, isHeadshot = false) {
        if (!this.alive) return;

        let dmg = amount;

        // Akshita's Titan Shield: 75% damage reduction!
        if (this.abilityActive && this.characterId === 'akshita') {
            dmg = Math.round(dmg * 0.25);
        }

        // Armor absorption
        if (this.armor > 0) {
            const absorbRate = this.armorLevel === 3 ? 0.7 : (this.armorLevel === 2 ? 0.5 : 0.3);
            const armorDamage = Math.round(dmg * absorbRate);
            const hpDamage = dmg - armorDamage;

            this.armor = Math.max(0, this.armor - armorDamage);
            this.health = Math.max(0, this.health - hpDamage);
        } else {
            this.health = Math.max(0, this.health - dmg);
        }

        // Interrupt healing on damage
        if (this.isHealing) {
            this.isHealing = false;
        }

        // Screen red flash & camera shake
        if (window.game) {
            window.game.triggerCameraShake(0.5);
            if (window.game.ui) {
                window.game.ui.flashDamageVignette();
                window.game.ui.updatePlayerStats(this);
            }
        }

        if (this.health <= 0) {
            this.die(attacker);
        }
    }

    die(killer = null) {
        this.alive = false;
        this.health = 0;
        if (window.soundSystem) window.soundSystem.playDefeat();
        if (window.game) {
            window.game.onPlayerDied(killer);
        }
    }

    // Pickup loot
    pickupLoot(item) {
        const d = item.data;
        if (['rifle', 'sniper', 'shotgun', 'pistol'].includes(d.type)) {
            this.inventory[d.type].has = true;
            this.inventory[d.type].reserve += (d.ammo || 30);
            this.equipWeapon(d.type);
            if (window.game && window.game.ui) {
                window.game.ui.showToast(`Picked up ${WEAPON_CONFIGS[d.type].name}`);
            }
        } else if (d.type === 'grenade') {
            this.inventory.grenade.has = true;
            this.inventory.grenade.count += (d.count || 2);
            if (window.game && window.game.ui) {
                window.game.ui.showToast(`Picked up ${d.count || 2}x Frag Grenades`);
            }
        } else if (d.type === 'medkit') {
            this.medkits += (d.count || 1);
            if (window.game && window.game.ui) {
                window.game.ui.showToast(`Picked up ${d.count || 1}x Medkit`);
            }
        } else if (d.type === 'armor') {
            this.armorLevel = Math.max(this.armorLevel, d.level || 1);
            this.armor = this.maxArmor;
            if (window.game && window.game.ui) {
                window.game.ui.showToast(`Equipped Level ${this.armorLevel} Armor Vest`);
            }
        }

        if (window.soundSystem) window.soundSystem.playLootPickup();
        item.alive = false; // removes from world

        if (window.game && window.game.ui) {
            window.game.ui.updatePlayerStats(this);
            window.game.ui.updateWeaponHud(this.activeWeaponKey, this.inventory[this.activeWeaponKey]);
        }
    }

    // Main update loop
    update(delta, input, map) {
        if (!this.alive) return;

        // 1. Ability Timers
        if (this.abilityActive) {
            this.abilityTimer -= delta;
            if (this.abilityTimer <= 0) {
                this.abilityActive = false;
                this.charModel.speedAura.visible = false;
                this.charModel.shieldDome.visible = false;
            }
        }
        if (this.abilityCooldown > 0) {
            this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
        }

        // 2. Healing Timer
        if (this.isHealing) {
            this.healTimer -= delta;
            if (this.healTimer <= 0) {
                this.isHealing = false;
                this.medkits--;
                this.health = Math.min(this.maxHealth, this.health + 50);
                if (window.game && window.game.ui) {
                    window.game.ui.showToast('Health Restored +50 HP!');
                    window.game.ui.updatePlayerStats(this);
                }
            }
        }

        // 3. Fire & Reload Cooldowns
        if (this.fireCooldown > 0) {
            this.fireCooldown = Math.max(0, this.fireCooldown - delta);
        }

        if (this.isReloading) {
            this.reloadTimer -= delta;
            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                const inv = this.inventory[this.activeWeaponKey];
                const cfg = WEAPON_CONFIGS[this.activeWeaponKey];
                const needed = cfg.magSize - inv.mag;
                const available = Math.min(needed, inv.reserve);
                inv.mag += available;
                inv.reserve -= available;
                if (window.game && window.game.ui) {
                    window.game.ui.updateWeaponHud(this.activeWeaponKey, inv);
                }
            }
        }

        // 4. Input & Movement
        this.isAiming = !!input.aim;
        this.isSprinting = !!input.sprint && !this.isAiming && !input.crouch;
        this.isCrouching = !!input.crouch;

        // Base Movement Speed
        let speed = 5.6;
        if (this.isSprinting) speed = 9.8;
        if (this.isCrouching) speed = 3.2;
        if (this.isAiming) speed = 3.8;

        // Akshat's Adrenaline Rush: +65% speed boost!
        if (this.abilityActive && this.characterId === 'akshat') {
            speed *= 1.65;
        }

        // Direction Vector relative to camera yaw
        const moveVec = new THREE.Vector3();
        if (input.forward) moveVec.z -= 1;
        if (input.backward) moveVec.z += 1;
        if (input.left) moveVec.x -= 1;
        if (input.right) moveVec.x += 1;

        this.isMoving = moveVec.lengthSq() > 0.01;

        if (this.isMoving) {
            moveVec.normalize();
            // Rotate move direction by camera yaw
            moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

            this.velocity.x = moveVec.x * speed;
            this.velocity.z = moveVec.z * speed;

            // Footstep audio
            this.stepTimer += delta;
            const stepInterval = this.isSprinting ? 0.28 : 0.44;
            if (this.stepTimer >= stepInterval && this.isGrounded) {
                this.stepTimer = 0;
                if (window.soundSystem) window.soundSystem.playFootstep(this.isSprinting);
            }
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }

        // Jump
        if (input.jump && this.isGrounded) {
            this.velocity.y = 8.5;
            this.isGrounded = false;
            this.isJumping = true;
            if (window.soundSystem) window.soundSystem.playJump();
        }

        // Gravity & Vertical Physics
        this.velocity.y -= 22 * delta;

        // Apply Movement
        const nextX = this.position.x + this.velocity.x * delta;
        const nextZ = this.position.z + this.velocity.z * delta;
        const nextY = this.position.y + this.velocity.y * delta;

        // Collision Check with Island colliders
        let collidedX = false;
        let collidedZ = false;
        const playerRadius = 0.45;
        const playerHeight = this.isCrouching ? 1.2 : 1.8;

        if (map && map.colliders) {
            for (let c of map.colliders) {
                const box = c.box;
                if (box) {
                    // Check if player box intersects collider box
                    const testBoxX = new THREE.Box3(
                        new THREE.Vector3(nextX - playerRadius, this.position.y, this.position.z - playerRadius),
                        new THREE.Vector3(nextX + playerRadius, this.position.y + playerHeight, this.position.z + playerRadius)
                    );
                    if (box.intersectsBox(testBoxX)) collidedX = true;

                    const testBoxZ = new THREE.Box3(
                        new THREE.Vector3(this.position.x - playerRadius, this.position.y, nextZ - playerRadius),
                        new THREE.Vector3(this.position.x + playerRadius, this.position.y + playerHeight, nextZ + playerRadius)
                    );
                    if (box.intersectsBox(testBoxZ)) collidedZ = true;
                }
            }
        }

        if (!collidedX) this.position.x = nextX;
        if (!collidedZ) this.position.z = nextZ;

        // Terrain Elevation Ground clamp
        const groundY = map ? map.getTerrainHeight(this.position.x, this.position.z) : 0;
        if (nextY <= groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
            this.isJumping = false;
        } else {
            this.position.y = nextY;
            this.isGrounded = false;
        }

        // Automatic Check for Nearby Loot Items
        if (map && map.lootItems) {
            let nearestLoot = null;
            let nearestDist = 3.2;

            for (let item of map.lootItems) {
                if (!item.alive) continue;
                const d = this.position.distanceTo(item.pos);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestLoot = item;
                }
            }

            if (nearestLoot) {
                if (window.game && window.game.ui) {
                    window.game.ui.showLootPrompt(nearestLoot);
                }
                if (input.interact) {
                    this.pickupLoot(nearestLoot);
                }
            } else {
                if (window.game && window.game.ui) {
                    window.game.ui.hideLootPrompt();
                }
            }
        }

        // 5. Update Camera & Recoil Decay
        // Recoil decay back to center
        this.recoilPitch = Math.max(0, this.recoilPitch - delta * 0.2);
        this.recoilYaw *= 0.9;

        const effectivePitch = this.pitch + this.recoilPitch;
        const effectiveYaw = this.yaw + this.recoilYaw;

        // Character model faces camera yaw direction
        this.charModel.root.position.copy(this.position);
        this.charModel.root.rotation.y = effectiveYaw;

        // Third person camera offset calculation
        const shoulderDist = this.isAiming ? 1.5 : this.cameraDistance;
        const shoulderX = this.isAiming ? 0.45 : this.cameraShoulderX;
        const shoulderY = (this.isCrouching ? 1.1 : this.cameraHeight);

        // Camera position in world space
        const camOffset = new THREE.Vector3(shoulderX, shoulderY, shoulderDist);
        // Rotate offset by pitch and yaw
        camOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), effectivePitch);
        camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), effectiveYaw);

        const targetCamPos = this.position.clone().add(camOffset);
        this.camera.position.lerp(targetCamPos, 0.28);

        // Target look-at point (slightly above character head)
        const lookTarget = this.position.clone().add(new THREE.Vector3(0, shoulderY, 0));
        const forwardLook = new THREE.Vector3(0, 0, -10)
            .applyAxisAngle(new THREE.Vector3(1, 0, 0), effectivePitch)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), effectiveYaw);
        this.camera.lookAt(lookTarget.add(forwardLook));

        // FOV adjustment for Aim Down Sights (ADS)
        const cfg = WEAPON_CONFIGS[this.activeWeaponKey];
        const targetFov = this.isAiming ? (cfg ? cfg.zoomFov : 45) : this.baseFov;
        this.camera.fov += (targetFov - this.camera.fov) * delta * 12;
        this.camera.updateProjectionMatrix();

        // 6. Update Character Procedural Animations
        window.modelFactory.updateCharacterAnimation(this.charModel, delta, {
            isMoving: this.isMoving,
            isSprinting: this.isSprinting,
            isCrouching: this.isCrouching,
            isJumping: this.isJumping,
            isAiming: this.isAiming,
            moveSpeed: speed
        });
    }
}

window.PlayerController = PlayerController;
