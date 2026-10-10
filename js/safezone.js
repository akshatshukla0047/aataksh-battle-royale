/**
 * AATAKSH - Shrinking Safe Zone & Electric Storm System
 * Dynamic 3D energy barrier cylinder, multi-phase circle shrinking, DPS storm damage,
 * visual electric vignette, and siren warning alerts.
 */

class SafeZone {
    constructor(scene) {
        this.scene = scene;

        // Zone Circle Geometry
        this.center = new THREE.Vector2(0, 0);
        this.nextCenter = new THREE.Vector2(10, 10);
        this.radius = 175;
        this.targetRadius = 115;
        this.initialRadius = 175;

        // Phases Configuration
        this.phases = [
            { waitTime: 45, shrinkTime: 30, targetRadius: 115, dps: 3, name: "Phase 1" },
            { waitTime: 35, shrinkTime: 25, targetRadius: 65, dps: 6, name: "Phase 2" },
            { waitTime: 25, shrinkTime: 20, targetRadius: 28, dps: 10, name: "Phase 3" },
            { waitTime: 15, shrinkTime: 18, targetRadius: 6, dps: 16, name: "Final Circle" }
        ];

        this.currentPhaseIdx = 0;
        this.state = 'WAITING'; // WAITING or SHRINKING
        this.phaseTimer = this.phases[0].waitTime;
        this.shrinkProgress = 0;
        this.dpsTimer = 0;

        // 3D Storm Barrier Cylinder Mesh
        this.initVisualMesh();
    }

    initVisualMesh() {
        const height = 75;
        const geo = new THREE.CylinderGeometry(this.radius, this.radius, height, 48, 1, true);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            wireframe: false
        });

        this.cylinderMesh = new THREE.Mesh(geo, mat);
        this.cylinderMesh.position.set(this.center.x, height / 2, this.center.y);
        this.scene.add(this.cylinderMesh);

        // Electric Top Ring
        const ringGeo = new THREE.RingGeometry(this.radius - 1, this.radius + 1, 48);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x55ffff, side: THREE.DoubleSide });
        this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
        this.ringMesh.position.set(this.center.x, 0.4, this.center.y);
        this.scene.add(this.ringMesh);
    }

    isInside(position) {
        const dx = position.x - this.center.x;
        const dz = position.z - this.center.y;
        return Math.sqrt(dx * dx + dz * dz) <= this.radius;
    }

    pickNextCenter(newRadius) {
        // Next center must fit inside current circle
        const maxOffset = Math.max(0, this.radius - newRadius - 5);
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * maxOffset * 0.7;
        return new THREE.Vector2(
            this.center.x + Math.cos(angle) * dist,
            this.center.y + Math.sin(angle) * dist
        );
    }

    update(delta, player, bots) {
        const phase = this.phases[this.currentPhaseIdx];
        if (!phase) return;

        this.phaseTimer -= delta;

        if (this.state === 'WAITING') {
            // Countdown before circle starts shrinking
            if (this.phaseTimer <= 0) {
                this.state = 'SHRINKING';
                this.phaseTimer = phase.shrinkTime;
                this.startRadius = this.radius;
                this.startCenter = this.center.clone();
                this.targetRadius = phase.targetRadius;
                this.nextCenter = this.pickNextCenter(this.targetRadius);

                if (window.soundSystem) window.soundSystem.playStormAlert();
                if (window.game && window.game.ui) {
                    window.game.ui.showToast(`WARNING: Safe zone is now shrinking!`, 3500);
                }
            } else if (this.phaseTimer <= 5 && !this.sirenPlayed) {
                // Siren warning 5s prior
                if (window.soundSystem) window.soundSystem.playStormAlert();
                this.sirenPlayed = true;
            }
        } else if (this.state === 'SHRINKING') {
            this.sirenPlayed = false;
            const progress = 1 - Math.max(0, this.phaseTimer / phase.shrinkTime);

            // Interpolate radius and center towards target
            this.radius = this.startRadius + (this.targetRadius - this.startRadius) * progress;
            this.center.x = this.startCenter.x + (this.nextCenter.x - this.startCenter.x) * progress;
            this.center.y = this.startCenter.y + (this.nextCenter.y - this.startCenter.y) * progress;

            if (this.phaseTimer <= 0) {
                // Phase completed! Advance to next phase
                this.radius = this.targetRadius;
                this.currentPhaseIdx++;
                if (this.currentPhaseIdx < this.phases.length) {
                    const nextP = this.phases[this.currentPhaseIdx];
                    this.state = 'WAITING';
                    this.phaseTimer = nextP.waitTime;
                    this.nextCenter = this.pickNextCenter(nextP.targetRadius);
                    if (window.game && window.game.ui) {
                        window.game.ui.showToast(`New Safe Zone marked! ${nextP.waitTime}s to move.`, 3000);
                    }
                } else {
                    // Reached final circle
                    this.state = 'FINAL';
                }
            }
        }

        // Update 3D Visual Mesh
        const scale = this.radius / this.initialRadius;
        this.cylinderMesh.scale.set(scale, 1, scale);
        this.cylinderMesh.position.set(this.center.x, 37.5, this.center.y);
        this.ringMesh.scale.set(scale, scale, 1);
        this.ringMesh.position.set(this.center.x, 0.4, this.center.y);

        // Animate cylinder opacity pulse
        const pulse = 0.22 + Math.sin(performance.now() * 0.004) * 0.08;
        this.cylinderMesh.material.opacity = pulse;

        // 3. Apply Storm Damage (DPS) to Player & AI outside safe zone
        this.dpsTimer += delta;
        if (this.dpsTimer >= 1.0) {
            this.dpsTimer = 0;
            const currentDps = phase.dps;

            // Damage Player if outside
            if (player && player.alive) {
                const outside = !this.isInside(player.position);
                if (outside) {
                    player.takeDamage(currentDps, null, false);
                    if (window.game && window.game.ui) {
                        window.game.ui.flashStormVignette();
                    }
                }
            }

            // Damage AI bots if outside
            if (bots) {
                bots.forEach(bot => {
                    if (bot.alive && !this.isInside(bot.position)) {
                        bot.takeDamage(currentDps, null, false);
                    }
                });
            }
        }
    }
}

window.SafeZone = SafeZone;
