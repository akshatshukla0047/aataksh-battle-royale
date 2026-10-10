/**
 * AATAKSH - Weapons & Ballistics System
 * Full ballistics, bullet tracers, recoil, reload, shotgun pellet spread, and grenade physics
 */

const WEAPON_CONFIGS = {
    rifle: {
        id: 'rifle',
        name: 'AK-47 Tactical',
        slot: 1,
        fireRate: 0.11, // seconds between shots
        damage: 34,
        headshotMultiplier: 2.2,
        magSize: 30,
        maxReserve: 180,
        recoilVertical: 0.028,
        recoilHorizontal: 0.012,
        spreadHip: 0.03,
        spreadAds: 0.007,
        bulletSpeed: 280,
        reloadTime: 2.2,
        range: 250,
        isAutomatic: true,
        pellets: 1,
        zoomFov: 50
    },
    sniper: {
        id: 'sniper',
        name: 'AWM Arctic',
        slot: 2,
        fireRate: 1.35,
        damage: 115,
        headshotMultiplier: 2.5,
        magSize: 5,
        maxReserve: 30,
        recoilVertical: 0.09,
        recoilHorizontal: 0.02,
        spreadHip: 0.08,
        spreadAds: 0.001,
        bulletSpeed: 420,
        reloadTime: 3.2,
        range: 450,
        isAutomatic: false,
        pellets: 1,
        zoomFov: 20 // Extreme zoom
    },
    shotgun: {
        id: 'shotgun',
        name: 'Spas-12 Shotgun',
        slot: 2,
        fireRate: 0.75,
        damage: 18, // 18 x 8 pellets = 144
        headshotMultiplier: 1.8,
        magSize: 8,
        maxReserve: 40,
        recoilVertical: 0.08,
        recoilHorizontal: 0.03,
        spreadHip: 0.085,
        spreadAds: 0.05,
        bulletSpeed: 200,
        reloadTime: 2.5,
        range: 50,
        isAutomatic: false,
        pellets: 8,
        zoomFov: 55
    },
    pistol: {
        id: 'pistol',
        name: 'Desert Eagle .50',
        slot: 3,
        fireRate: 0.28,
        damage: 50,
        headshotMultiplier: 2.2,
        magSize: 7,
        maxReserve: 42,
        recoilVertical: 0.045,
        recoilHorizontal: 0.015,
        spreadHip: 0.028,
        spreadAds: 0.01,
        bulletSpeed: 220,
        reloadTime: 1.6,
        range: 120,
        isAutomatic: false,
        pellets: 1,
        zoomFov: 58
    },
    grenade: {
        id: 'grenade',
        name: 'Frag Grenade',
        slot: 4,
        fireRate: 1.0,
        damage: 180,
        radius: 12,
        count: 3,
        throwSpeed: 28,
        fuseTime: 3.0
    }
};

class WeaponManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
        this.grenades = [];
        this.damageNumbers = [];
        this.particles = [];

        // Materials for tracers and effects
        this.tracerMat = new THREE.LineBasicMaterial({ color: 0xffea00, linewidth: 2 });
        this.sniperTracerMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 3 });
        this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        this.bloodMat = new THREE.MeshBasicMaterial({ color: 0xaa1111 });
        this.explosionMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.9 });
    }

    // Fire weapon from an origin in a given direction
    fireWeapon(shooter, weaponKey, origin, direction, isAds = false) {
        const config = WEAPON_CONFIGS[weaponKey];
        if (!config) return false;

        const isPlayer = shooter.isPlayer;

        // Sound effect
        if (window.soundSystem) {
            const listenerPos = window.game ? window.game.player.position : null;
            window.soundSystem.playGunshot(weaponKey, origin, isPlayer ? null : origin);
        }

        const pellets = config.pellets || 1;
        const baseSpread = isAds ? config.spreadAds : config.spreadHip;

        for (let i = 0; i < pellets; i++) {
            // Apply randomized spread cone
            const spreadVec = new THREE.Vector3(
                (Math.random() - 0.5) * baseSpread * 2,
                (Math.random() - 0.5) * baseSpread * 2,
                (Math.random() - 0.5) * baseSpread * 2
            );

            const fireDir = direction.clone().add(spreadVec).normalize();

            // Create 3D Visual Tracer Line
            const tracerLength = 2.5;
            const geo = new THREE.BufferGeometry().setFromPoints([
                origin.clone(),
                origin.clone().add(fireDir.clone().multiplyScalar(tracerLength))
            ]);
            const mat = weaponKey === 'sniper' ? this.sniperTracerMat : this.tracerMat;
            const tracerMesh = new THREE.Line(geo, mat);
            this.scene.add(tracerMesh);

            this.bullets.push({
                shooter,
                weaponKey,
                damage: config.damage,
                headshotMultiplier: config.headshotMultiplier,
                mesh: tracerMesh,
                pos: origin.clone(),
                dir: fireDir,
                speed: config.bulletSpeed,
                distanceTraveled: 0,
                maxRange: config.range,
                alive: true
            });
        }

        return true;
    }

    // Throw a grenade with physics trajectory
    throwGrenade(shooter, origin, direction) {
        const config = WEAPON_CONFIGS.grenade;
        const grenadeMesh = window.modelFactory.createWeaponModel('grenade');
        grenadeMesh.position.copy(origin);
        this.scene.add(grenadeMesh);

        const velocity = direction.clone().multiplyScalar(config.throwSpeed);
        velocity.y += 4; // slight upward arc

        this.grenades.push({
            shooter,
            mesh: grenadeMesh,
            velocity,
            timer: config.fuseTime,
            radius: config.radius,
            damage: config.damage,
            alive: true
        });
    }

    // Spawn damage number hovering in 3D world
    spawnDamageNumber(position, damage, isHeadshot = false) {
        if (!window.game || !window.game.ui) return;
        window.game.ui.addWorldDamageNumber(position, damage, isHeadshot);
    }

    // Spawn bullet impact particle burst
    spawnImpactParticles(position, normal, isFlesh = false) {
        const count = isFlesh ? 6 : 8;
        const colorMat = isFlesh ? this.bloodMat : this.sparkMat;

        for (let i = 0; i < count; i++) {
            const size = isFlesh ? 0.08 : 0.05;
            const p = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), colorMat);
            p.position.copy(position);
            this.scene.add(p);

            const vel = normal.clone().multiplyScalar(2 + Math.random() * 3);
            vel.x += (Math.random() - 0.5) * 3;
            vel.y += (Math.random() - 0.5) * 3;
            vel.z += (Math.random() - 0.5) * 3;

            this.particles.push({
                mesh: p,
                vel,
                life: 0.35 + Math.random() * 0.2,
                maxLife: 0.5
            });
        }
    }

    // Detonate grenade with expanding shockwave and radial damage
    explodeGrenade(grenade) {
        const pos = grenade.mesh.position;

        // Play massive explosion sound
        if (window.soundSystem) {
            const listenerPos = window.game ? window.game.player.position : null;
            window.soundSystem.playExplosion(pos, listenerPos);
        }

        // Camera shake if near player
        if (window.game && window.game.player) {
            const distToPlayer = window.game.player.position.distanceTo(pos);
            if (distToPlayer < 35) {
                const shakeIntensity = Math.max(0, 1 - (distToPlayer / 35)) * 0.8;
                window.game.triggerCameraShake(shakeIntensity);
            }
        }

        // 3D Fireball Mesh
        const sphereGeo = new THREE.SphereGeometry(3.5, 12, 10);
        const explosionMesh = new THREE.Mesh(sphereGeo, this.explosionMat.clone());
        explosionMesh.position.copy(pos);
        this.scene.add(explosionMesh);

        // Expanding shockwave ring
        const ringGeo = new THREE.RingGeometry(0.5, 2, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8800, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const shockwave = new THREE.Mesh(ringGeo, ringMat);
        shockwave.position.set(pos.x, pos.y + 0.1, pos.z);
        this.scene.add(shockwave);

        this.particles.push({
            mesh: explosionMesh,
            isExplosion: true,
            shockwave,
            radius: 1,
            maxRadius: grenade.radius * 0.7,
            life: 0.6,
            maxLife: 0.6
        });

        // Damage all entities in radius (Player + AI Bots)
        if (window.game) {
            const targets = [window.game.player, ...window.game.aiManager.bots];
            targets.forEach(target => {
                if (!target || !target.alive) return;
                const d = target.position.distanceTo(pos);
                if (d <= grenade.radius) {
                    const falloff = 1 - (d / grenade.radius);
                    const damage = Math.round(grenade.damage * falloff);
                    target.takeDamage(damage, grenade.shooter, false);
                }
            });
        }

        // Cleanup grenade mesh
        this.scene.remove(grenade.mesh);
        grenade.alive = false;
    }

    // Update all bullets, physics, collisions and particles
    update(delta, colliders, targets) {
        // 1. Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const moveDist = b.speed * delta;
            const nextPos = b.pos.clone().add(b.dir.clone().multiplyScalar(moveDist));

            // Raycast line segment between current pos and next pos
            const ray = new THREE.Ray(b.pos, b.dir);
            let hitInfo = null;
            let closestDist = moveDist;

            // Check Targets (Player & AI bots)
            for (let t of targets) {
                if (!t || !t.alive || t === b.shooter) continue;

                // Headshot check (head sphere ~ height 1.7)
                const headPos = t.position.clone().add(new THREE.Vector3(0, 1.7, 0));
                const headRadius = 0.35;
                const headDist = ray.distanceToPoint(headPos);

                if (headDist <= headRadius) {
                    const distToHead = b.pos.distanceTo(headPos);
                    if (distToHead < closestDist) {
                        closestDist = distToHead;
                        hitInfo = { target: t, isHeadshot: true, point: headPos };
                    }
                } else {
                    // Body cylinder / box check (height 0 to 1.5, radius 0.5)
                    const bodyPos = t.position.clone().add(new THREE.Vector3(0, 0.9, 0));
                    const bodyRadius = 0.55;
                    const bodyDist = ray.distanceToPoint(bodyPos);

                    if (bodyDist <= bodyRadius) {
                        const distToBody = b.pos.distanceTo(bodyPos);
                        if (distToBody < closestDist) {
                            closestDist = distToBody;
                            hitInfo = { target: t, isHeadshot: false, point: bodyPos };
                        }
                    }
                }
            }

            // Check World Static Colliders (walls, buildings, crates, terrain)
            if (!hitInfo && colliders && colliders.length > 0) {
                for (let col of colliders) {
                    // Quick bounding box test
                    if (col.box && col.box.intersectsRay(ray)) {
                        const hitPt = new THREE.Vector3();
                        if (ray.intersectBox(col.box, hitPt)) {
                            const d = b.pos.distanceTo(hitPt);
                            if (d < closestDist) {
                                closestDist = d;
                                hitInfo = { isWorld: true, point: hitPt, normal: new THREE.Vector3(0, 1, 0) };
                            }
                        }
                    }
                }
            }

            // Ground plane check (y <= 0)
            if (!hitInfo && nextPos.y <= 0) {
                const tFloor = -b.pos.y / b.dir.y;
                if (tFloor >= 0 && tFloor <= moveDist) {
                    closestDist = tFloor;
                    hitInfo = {
                        isWorld: true,
                        point: b.pos.clone().add(b.dir.clone().multiplyScalar(tFloor)),
                        normal: new THREE.Vector3(0, 1, 0)
                    };
                }
            }

            if (hitInfo) {
                // Bullet hit something
                if (hitInfo.target) {
                    // Entity hit!
                    const isHeadshot = hitInfo.isHeadshot;
                    const dmg = Math.round(isHeadshot ? b.damage * b.headshotMultiplier : b.damage);
                    hitInfo.target.takeDamage(dmg, b.shooter, isHeadshot);

                    // If shooter is player, give audio & hitmarker UI feedback!
                    if (b.shooter.isPlayer) {
                        if (window.soundSystem) window.soundSystem.playHitmarker(isHeadshot);
                        if (window.game && window.game.ui) window.game.ui.showHitmarker(isHeadshot);
                    }

                    this.spawnDamageNumber(hitInfo.point, dmg, isHeadshot);
                    this.spawnImpactParticles(hitInfo.point, new THREE.Vector3(0, 1, 0), true);
                } else if (hitInfo.isWorld) {
                    // World obstacle hit
                    this.spawnImpactParticles(hitInfo.point, hitInfo.normal, false);
                }

                this.scene.remove(b.mesh);
                this.bullets.splice(i, 1);
                continue;
            }

            // Advance bullet position
            b.pos.copy(nextPos);
            b.distanceTraveled += moveDist;

            // Update line tracer points
            const positions = b.mesh.geometry.attributes.position.array;
            positions[0] = b.pos.x;
            positions[1] = b.pos.y;
            positions[2] = b.pos.z;
            const tip = b.pos.clone().add(b.dir.clone().multiplyScalar(2.5));
            positions[3] = tip.x;
            positions[4] = tip.y;
            positions[5] = tip.z;
            b.mesh.geometry.attributes.position.needsUpdate = true;

            // Expire if beyond max range
            if (b.distanceTraveled >= b.maxRange || b.pos.y < -2) {
                this.scene.remove(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        // 2. Update Grenades
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const g = this.grenades[i];
            g.timer -= delta;

            // Apply gravity
            g.velocity.y -= 22 * delta;

            const nextPos = g.mesh.position.clone().add(g.velocity.clone().multiplyScalar(delta));

            // Ground bounce
            if (nextPos.y <= 0.15) {
                nextPos.y = 0.15;
                g.velocity.y = -g.velocity.y * 0.45;
                g.velocity.x *= 0.7;
                g.velocity.z *= 0.7;
            }

            g.mesh.position.copy(nextPos);
            g.mesh.rotation.x += delta * 5;
            g.mesh.rotation.z += delta * 4;

            if (g.timer <= 0) {
                this.explodeGrenade(g);
                this.grenades.splice(i, 1);
            }
        }

        // 3. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.isExplosion) {
                const progress = 1 - (p.life / p.maxLife);
                const scale = 1 + progress * (p.maxRadius - 1);
                p.mesh.scale.set(scale, scale, scale);
                p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);

                if (p.shockwave) {
                    p.shockwave.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
                    p.shockwave.material.opacity = Math.max(0, p.life / p.maxLife) * 0.8;
                }
            } else {
                p.vel.y -= 15 * delta;
                p.mesh.position.add(p.vel.clone().multiplyScalar(delta));
            }

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.shockwave) this.scene.remove(p.shockwave);
                this.particles.splice(i, 1);
            }
        }
    }
}

window.WeaponManager = WeaponManager;
window.WEAPON_CONFIGS = WEAPON_CONFIGS;
