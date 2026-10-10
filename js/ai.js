/**
 * AATAKSH - AI Enemy Bot Controller & Manager
 * 19 Autonomous AI combatants with behavioral states (Loot, Patrol, Engage, Evade Storm),
 * weapon accuracy, bot-vs-bot firefights, death loot crates, and live Kill Feed.
 */

const BOT_NAMES = [
    "Phantom", "Viper", "Ghost", "Striker", "Nova", "Blitz", "Shadow",
    "Rex", "Falcon", "Cobra", "Havoc", "Raven", "Titan", "Vortex",
    "Scythe", "Hunter", "Razor", "Spectre", "Zenith"
];

class AIBot {
    constructor(scene, id, name, startPos, weaponKey = 'rifle') {
        this.scene = scene;
        this.id = id;
        this.name = name;
        this.isPlayer = false;

        // Health & Stats
        this.maxHealth = 100;
        this.health = 100;
        this.armor = Math.random() > 0.4 ? 50 : 25;
        this.alive = true;
        this.kills = 0;

        // Position & Movement
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.yaw = Math.random() * Math.PI * 2;
        this.pitch = 0;
        this.isMoving = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isAiming = false;

        // AI State
        this.state = 'PATROL'; // PATROL, HUNT, ENGAGE, FLEE_STORM
        this.target = null;
        this.stateTimer = 1 + Math.random() * 3;
        this.moveTarget = new THREE.Vector3();
        this.pickNewWanderTarget();

        // Weapon
        this.weaponKey = weaponKey;
        this.fireCooldown = 0.5 + Math.random() * 0.8;
        this.burstCount = 0;
        this.burstMax = 3 + Math.floor(Math.random() * 4);
        this.burstCooldown = 0;
        this.accuracy = 0.65; // Bot accuracy factor

        // 3D Model
        const charType = Math.random() > 0.5 ? 'akshat' : 'akshita';
        this.charModel = window.modelFactory.createCharacter(charType);
        this.scene.add(this.charModel.root);

        // Weapon Mesh attached to hand
        this.weaponMesh = window.modelFactory.createWeaponModel(weaponKey);
        this.charModel.weaponMount.add(this.weaponMesh);
    }

    pickNewWanderTarget() {
        const radius = 25 + Math.random() * 40;
        const angle = Math.random() * Math.PI * 2;
        this.moveTarget.set(
            this.position.x + Math.cos(angle) * radius,
            0,
            this.position.z + Math.sin(angle) * radius
        );
    }

    takeDamage(amount, attacker = null, isHeadshot = false) {
        if (!this.alive) return;

        let dmg = amount;
        if (this.armor > 0) {
            const armorDmg = Math.round(dmg * 0.4);
            this.armor = Math.max(0, this.armor - armorDmg);
            dmg -= armorDmg;
        }

        this.health = Math.max(0, this.health - dmg);

        // Turn towards attacker immediately if attacked
        if (attacker && attacker.alive && (!this.target || Math.random() > 0.4)) {
            this.target = attacker;
            this.state = 'ENGAGE';
        }

        if (this.health <= 0) {
            this.die(attacker, isHeadshot);
        }
    }

    die(killer = null, isHeadshot = false) {
        this.alive = false;
        this.health = 0;

        // Remove 3D character model
        this.scene.remove(this.charModel.root);

        // Spawn Death Loot Crate on ground
        if (window.game && window.game.map) {
            const crate = window.modelFactory.createMilitaryCrate();
            crate.position.copy(this.position);
            this.scene.add(crate);

            // Spawn loot around crate
            window.game.map.spawnLootItem({
                x: this.position.x,
                z: this.position.z,
                type: this.weaponKey,
                ammo: 45
            });
            window.game.map.spawnLootItem({
                x: this.position.x + 0.8,
                z: this.position.z + 0.8,
                type: 'medkit',
                count: 1
            });
        }

        // Notify Game Manager & Kill Feed
        if (window.game) {
            window.game.onEntityKilled(this, killer, this.weaponKey, isHeadshot);
        }
    }

    shootAtTarget(delta) {
        if (!this.target || !this.target.alive) return;

        const cfg = WEAPON_CONFIGS[this.weaponKey];
        if (!cfg) return;

        this.fireCooldown -= delta;
        if (this.burstCooldown > 0) {
            this.burstCooldown -= delta;
            return;
        }

        if (this.fireCooldown <= 0) {
            this.fireCooldown = cfg.fireRate * (1.2 + Math.random() * 0.5);
            this.burstCount++;

            // Muzzle origin
            const origin = this.position.clone().add(new THREE.Vector3(0, 1.45, 0));
            // Aim vector towards target chest with accuracy spread
            const targetPos = this.target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            const aimDir = targetPos.clone().sub(origin).normalize();

            // Bot aim inaccuracy
            const spread = (1 - this.accuracy) * 0.12;
            aimDir.x += (Math.random() - 0.5) * spread;
            aimDir.y += (Math.random() - 0.5) * spread;
            aimDir.z += (Math.random() - 0.5) * spread;
            aimDir.normalize();

            // Fire weapon
            window.game.weaponManager.fireWeapon(this, this.weaponKey, origin, aimDir, true);
            this.charModel.recoilKick = 0.3;

            if (this.burstCount >= this.burstMax) {
                this.burstCount = 0;
                this.burstCooldown = 0.8 + Math.random() * 1.2;
            }
        }
    }

    update(delta, map, safeZone, player, otherBots) {
        if (!this.alive) return;

        this.stateTimer -= delta;

        // 1. Check Safe Zone Urgency (Flee storm if outside safe circle)
        if (safeZone) {
            const distFromZoneCenter = Math.hypot(
                this.position.x - safeZone.center.x,
                this.position.z - safeZone.center.z
            );
            if (distFromZoneCenter > safeZone.radius - 8) {
                // Outside or near boundary -> high priority to run inside!
                this.state = 'FLEE_STORM';
                this.moveTarget.set(safeZone.center.x, 0, safeZone.center.z);
            }
        }

        // 2. Target Perception (Scan for Player or other AI bots within 45m)
        if (this.state !== 'FLEE_STORM') {
            let potentialTargets = [player, ...otherBots].filter(t => t && t.alive && t !== this);
            let closestTarget = null;
            let closestDist = 45; // 45m perception range

            for (let t of potentialTargets) {
                const d = this.position.distanceTo(t.position);
                if (d < closestDist) {
                    closestDist = d;
                    closestTarget = t;
                }
            }

            if (closestTarget) {
                this.target = closestTarget;
                this.state = 'ENGAGE';
            } else if (this.state === 'ENGAGE') {
                this.state = 'PATROL';
                this.target = null;
            }
        }

        // 3. State Behavior Execution
        let desiredSpeed = 4.8;
        this.isAiming = false;
        this.isSprinting = false;

        switch (this.state) {
            case 'FLEE_STORM': {
                this.isSprinting = true;
                desiredSpeed = 8.5;
                // Move directly towards safe zone center
                const dirToCenter = this.moveTarget.clone().sub(this.position);
                dirToCenter.y = 0;
                if (dirToCenter.lengthSq() > 1) {
                    dirToCenter.normalize();
                    this.yaw = Math.atan2(dirToCenter.x, dirToCenter.z);
                    this.velocity.x = dirToCenter.x * desiredSpeed;
                    this.velocity.z = dirToCenter.z * desiredSpeed;
                    this.isMoving = true;
                }
                break;
            }
            case 'ENGAGE': {
                if (this.target && this.target.alive) {
                    this.isAiming = true;
                    const toTarget = this.target.position.clone().sub(this.position);
                    const distToTarget = toTarget.length();
                    toTarget.y = 0;
                    toTarget.normalize();

                    // Face target
                    this.yaw = Math.atan2(toTarget.x, toTarget.z);

                    if (distToTarget > 28) {
                        // Advance towards target
                        desiredSpeed = 5.2;
                        this.velocity.x = toTarget.x * desiredSpeed;
                        this.velocity.z = toTarget.z * desiredSpeed;
                        this.isMoving = true;
                    } else if (distToTarget < 8) {
                        // Back up slightly or strafe
                        desiredSpeed = 3.8;
                        this.velocity.x = -toTarget.x * desiredSpeed;
                        this.velocity.z = -toTarget.z * desiredSpeed;
                        this.isMoving = true;
                    } else {
                        // Tactical strafing left / right
                        const strafeDir = new THREE.Vector3(-toTarget.z, 0, toTarget.x);
                        desiredSpeed = 3.0;
                        this.velocity.x = strafeDir.x * desiredSpeed * (Math.sin(this.stateTimer * 2) > 0 ? 1 : -1);
                        this.velocity.z = strafeDir.z * desiredSpeed * (Math.sin(this.stateTimer * 2) > 0 ? 1 : -1);
                        this.isMoving = true;
                    }

                    // Fire at target!
                    this.shootAtTarget(delta);
                } else {
                    this.state = 'PATROL';
                    this.target = null;
                }
                break;
            }
            case 'PATROL':
            default: {
                if (this.stateTimer <= 0) {
                    this.stateTimer = 4 + Math.random() * 5;
                    this.pickNewWanderTarget();
                }

                const toWander = this.moveTarget.clone().sub(this.position);
                toWander.y = 0;
                if (toWander.length() > 2) {
                    toWander.normalize();
                    this.yaw = Math.atan2(toWander.x, toWander.z);
                    this.velocity.x = toWander.x * desiredSpeed;
                    this.velocity.z = toWander.z * desiredSpeed;
                    this.isMoving = true;
                } else {
                    this.velocity.x *= 0.5;
                    this.velocity.z *= 0.5;
                    this.isMoving = false;
                    this.pickNewWanderTarget();
                }
                break;
            }
        }

        // 4. Physics, Movement & Terrain Clamping
        this.position.x += this.velocity.x * delta;
        this.position.z += this.velocity.z * delta;

        const groundY = map ? map.getTerrainHeight(this.position.x, this.position.z) : 0;
        this.position.y = groundY;

        // Update 3D mesh position & rotation
        this.charModel.root.position.copy(this.position);
        this.charModel.root.rotation.y = this.yaw;

        // Procedural Animation
        window.modelFactory.updateCharacterAnimation(this.charModel, delta, {
            isMoving: this.isMoving,
            isSprinting: this.isSprinting,
            isCrouching: this.isCrouching,
            isJumping: false,
            isAiming: this.isAiming,
            moveSpeed: desiredSpeed
        });
    }
}

class AIManager {
    constructor(scene) {
        this.scene = scene;
        this.bots = [];
    }

    spawnBots(count = 19, map) {
        const weaponChoices = ['rifle', 'rifle', 'sniper', 'shotgun', 'pistol'];

        for (let i = 0; i < count; i++) {
            const name = BOT_NAMES[i % BOT_NAMES.length];

            // Spread spawn positions across the island POIs and fields
            const angle = (i / count) * Math.PI * 2;
            const dist = 35 + (i * 7) % 110;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = map ? map.getTerrainHeight(x, z) : 0;

            const weapon = weaponChoices[i % weaponChoices.length];
            const bot = new AIBot(this.scene, `bot_${i}`, name, new THREE.Vector3(x, y, z), weapon);
            this.bots.push(bot);
        }
    }

    getAliveCount() {
        return this.bots.filter(b => b.alive).length;
    }

    update(delta, map, safeZone, player) {
        for (let i = this.bots.length - 1; i >= 0; i--) {
            const bot = this.bots[i];
            if (!bot.alive) continue;

            const otherBots = this.bots.filter(b => b !== bot && b.alive);
            bot.update(delta, map, safeZone, player, otherBots);
        }
    }
}

window.AIManager = AIManager;
