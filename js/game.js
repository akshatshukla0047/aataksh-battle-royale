/**
 * AATAKSH - Main Game Controller & 3D Render Loop
 * Manages state (Menu / InGame / Victory / Defeat), cinematic menu background,
 * match coordinator, camera shake, pointer lock, and input processing.
 */

class AatakshGame {
    constructor() {
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.selectedCharacter = 'akshat';
        this.mouseSensitivity = 0.0022;
        this.matchStartTime = 0;
        this.matchDuration = 0;
        this.cameraShakeIntensity = 0;

        // Input States
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            crouch: false,
            jump: false,
            aim: false,
            shoot: false,
            interact: false
        };

        this.initRenderer();
        this.initScene();
        this.initMenuPreview();
        this.initInputListeners();

        this.ui = new window.UIManager();
        this.clock = new THREE.Clock();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initRenderer() {
        this.container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Daylight sky
        this.scene.fog = new THREE.FogExp2(0x9fc5e8, 0.0035);

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(this.ambientLight);

        // Directional Sun Light
        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.1);
        this.sunLight.position.set(120, 180, 80);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 400;
        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        // Hemisphere Sky/Ground Light
        const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x3b4d3b, 0.4);
        this.scene.add(hemiLight);
    }

    // Cinematic 3D Main Menu Background with Akshat and Akshita
    initMenuPreview() {
        this.menuGroup = new THREE.Group();
        this.scene.add(this.menuGroup);

        // Pedestal
        const pedestalGeo = new THREE.CylinderGeometry(4.5, 5.0, 0.8, 32);
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.3, metalness: 0.8 });
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.y = -0.4;
        this.menuGroup.add(pedestal);

        // Neon Pedestal Rim
        const rimGeo = new THREE.TorusGeometry(4.6, 0.06, 8, 32);
        rimGeo.rotateX(Math.PI / 2);
        const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 0.02;
        this.menuGroup.add(rim);

        // Akshat Model (Left)
        this.menuAkshat = window.modelFactory.createCharacter('akshat');
        this.menuAkshat.root.position.set(-1.2, 0, 0.2);
        this.menuAkshat.root.rotation.y = 0.25;
        const akshatWeapon = window.modelFactory.createWeaponModel('rifle');
        this.menuAkshat.weaponMount.add(akshatWeapon);
        this.menuGroup.add(this.menuAkshat.root);

        // Akshita Model (Right)
        this.menuAkshita = window.modelFactory.createCharacter('akshita');
        this.menuAkshita.root.position.set(1.2, 0, 0.2);
        this.menuAkshita.root.rotation.y = -0.25;
        const akshitaWeapon = window.modelFactory.createWeaponModel('sniper');
        this.menuAkshita.weaponMount.add(akshitaWeapon);
        this.menuGroup.add(this.menuAkshita.root);

        // Dramatic Studio Rim Lights
        const rimLightCyan = new THREE.PointLight(0x00f0ff, 2.5, 15);
        rimLightCyan.position.set(-3.5, 2.5, -2.5);
        this.menuGroup.add(rimLightCyan);

        const rimLightRed = new THREE.PointLight(0xff2244, 2.5, 15);
        rimLightRed.position.set(3.5, 2.5, -2.5);
        this.menuGroup.add(rimLightRed);

        // Camera setup for menu
        this.camera.position.set(0, 1.4, 4.2);
        this.camera.lookAt(0, 1.1, 0);
    }

    selectCharacter(charId) {
        this.selectedCharacter = charId;
        if (this.player) {
            this.player.setCharacter(charId);
        }
    }

    initInputListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;

            switch (e.code) {
                case 'KeyW': this.input.forward = true; break;
                case 'KeyS': this.input.backward = true; break;
                case 'KeyA': this.input.left = true; break;
                case 'KeyD': this.input.right = true; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.input.sprint = true; break;
                case 'KeyC': this.input.crouch = true; break;
                case 'Space': this.input.jump = true; break;
                case 'KeyR':
                    if (this.player) this.player.reload();
                    break;
                case 'KeyE':
                    if (this.player) this.player.useAbility();
                    break;
                case 'KeyF':
                    this.input.interact = true;
                    break;
                case 'KeyG':
                    if (this.player) this.player.switchSlot(4);
                    break;
                case 'Digit1': if (this.player) this.player.switchSlot(1); break;
                case 'Digit2': if (this.player) this.player.switchSlot(2); break;
                case 'Digit3': if (this.player) this.player.switchSlot(3); break;
                case 'Digit4': if (this.player) this.player.switchSlot(4); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.input.forward = false; break;
                case 'KeyS': this.input.backward = false; break;
                case 'KeyA': this.input.left = false; break;
                case 'KeyD': this.input.right = false; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.input.sprint = false; break;
                case 'KeyC': this.input.crouch = false; break;
                case 'Space': this.input.jump = false; break;
                case 'KeyF': this.input.interact = false; break;
            }
        });

        // Mouse Controls & Pointer Lock
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (this.state !== 'PLAYING') return;

            // Request pointer lock on click if not locked
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }

            if (e.button === 0) { // Left Click Shoot
                this.input.shoot = true;
                if (this.player) this.player.shoot();
            } else if (e.button === 2) { // Right Click ADS Zoom
                this.input.aim = true;
                if (this.player && this.player.activeWeaponKey === 'sniper') {
                    this.ui.setSniperScopeVisible(true);
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.input.shoot = false;
            } else if (e.button === 2) {
                this.input.aim = false;
                this.ui.setSniperScopeVisible(false);
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Mouse Move for Camera
        window.addEventListener('mousemove', (e) => {
            if (this.state !== 'PLAYING' || document.pointerLockElement !== this.renderer.domElement) return;

            if (this.player) {
                const sens = this.mouseSensitivity;
                this.player.yaw -= e.movementX * sens;
                this.player.pitch -= e.movementY * sens;
                // Clamp pitch to prevent camera flip
                this.player.pitch = Math.max(-1.15, Math.min(1.15, this.player.pitch));
            }
        });
    }

    triggerCameraShake(amount) {
        this.cameraShakeIntensity = Math.min(1.2, this.cameraShakeIntensity + amount);
    }

    startMatch() {
        // Hide Menu Screen
        this.ui.mainMenu.classList.add('hidden');
        this.ui.characterModal.classList.add('hidden');
        this.ui.gameHud.classList.remove('hidden');

        // Remove menu preview objects
        if (this.menuGroup) {
            this.scene.remove(this.menuGroup);
            this.menuGroup = null;
        }

        // Initialize Map
        this.map = new window.IslandMap(this.scene);

        // Initialize Weapons Manager
        this.weaponManager = new window.WeaponManager(this.scene);

        // Spawn Player at Edge of Apex City
        this.player = new window.PlayerController(this.scene, this.camera, this.selectedCharacter);
        this.player.position.set(0, this.map.getTerrainHeight(0, 25), 25);

        // Spawn 19 AI Bots
        this.aiManager = new window.AIManager(this.scene);
        this.aiManager.spawnBots(19, this.map);

        // Initialize Safe Zone
        this.safeZone = new window.SafeZone(this.scene);

        // Start Game State
        this.state = 'PLAYING';
        this.matchStartTime = performance.now();
        this.renderer.domElement.requestPointerLock();

        // Update Initial HUD
        this.ui.updatePlayerStats(this.player);
        this.ui.updateWeaponHud(this.player.activeWeaponKey, this.player.inventory[this.player.activeWeaponKey]);
        this.ui.aliveCount.textContent = '20';
        this.ui.killCount.textContent = '0';
        this.ui.showToast(`BATTLE ROYALE STARTED! 20 OPERATIVES DEPLOYED!`, 3500);
    }

    restartMatch() {
        location.reload();
    }

    onEntityKilled(victim, killer, weaponKey, isHeadshot) {
        const weaponCfg = WEAPON_CONFIGS[weaponKey] || { name: 'Firearm' };
        const killerName = killer ? (killer.isPlayer ? 'You' : killer.name) : 'Storm';
        const victimName = victim.isPlayer ? 'You' : victim.name;

        // Feed notification
        this.ui.addKillFeedEntry(killerName, victimName, weaponCfg.name, killer && killer.isPlayer, isHeadshot);

        // If player got the kill!
        if (killer && killer.isPlayer) {
            this.player.kills++;
            this.player.damageDealt += 100;
            this.ui.killCount.textContent = `${this.player.kills}`;
            this.ui.showToast(isHeadshot ? `🎯 HEADSHOT ELIMINATION! (+1 KILL)` : `⚡ ENEMY ELIMINATED! (+1 KILL)`, 2200);
        }

        // Update remaining alive counter
        const aliveBots = this.aiManager.getAliveCount();
        const totalAlive = aliveBots + (this.player.alive ? 1 : 0);
        this.ui.aliveCount.textContent = `${totalAlive}`;

        // Check Victory Condition! (Last operative standing)
        if (this.player.alive && aliveBots === 0) {
            this.triggerVictory();
        }
    }

    onPlayerDied(killer) {
        this.state = 'GAMEOVER';
        document.exitPointerLock();

        const matchSec = Math.floor((performance.now() - this.matchStartTime) / 1000);
        const mins = Math.floor(matchSec / 60);
        const secs = matchSec % 60;
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const aliveBots = this.aiManager.getAliveCount();
        const rank = aliveBots + 1;

        this.ui.showDefeatScreen({
            rank,
            killer: killer ? killer.name : 'Electric Storm',
            kills: this.player.kills,
            damage: this.player.damageDealt,
            time: timeStr
        });
    }

    triggerVictory() {
        this.state = 'GAMEOVER';
        document.exitPointerLock();

        if (window.soundSystem) window.soundSystem.playVictory();

        const matchSec = Math.floor((performance.now() - this.matchStartTime) / 1000);
        const mins = Math.floor(matchSec / 60);
        const secs = matchSec % 60;
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const score = (this.player.kills * 500) + (matchSec * 15) + 2000;

        this.ui.showVictoryScreen({
            kills: this.player.kills,
            damage: this.player.damageDealt,
            time: timeStr,
            score
        });
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.state === 'MENU') {
            // Animate Menu Scene with Slow Orbit & Breathing
            const time = performance.now() * 0.001;
            if (this.menuGroup) {
                this.menuGroup.rotation.y = Math.sin(time * 0.3) * 0.15;
            }
            if (this.menuAkshat) {
                window.modelFactory.updateCharacterAnimation(this.menuAkshat, delta, { isMoving: false });
            }
            if (this.menuAkshita) {
                window.modelFactory.updateCharacterAnimation(this.menuAkshita, delta, { isMoving: false });
            }
        } else if (this.state === 'PLAYING') {
            // Merge Keyboard and Touch Inputs
            const combinedInput = {
                ...this.input,
                forward: this.input.forward || this.ui.touchInput.forward,
                backward: this.input.backward || this.ui.touchInput.backward,
                left: this.input.left || this.ui.touchInput.left,
                right: this.input.right || this.ui.touchInput.right,
                sprint: this.input.sprint || this.ui.touchInput.sprint,
                crouch: this.input.crouch || this.ui.touchInput.crouch,
                jump: this.input.jump || this.ui.touchInput.jump,
                aim: this.input.aim || this.ui.touchInput.aim,
                interact: this.input.interact || this.ui.touchInput.interact
            };

            // Automatic shooting holding left click for automatic rifles
            if (this.input.shoot && this.player && this.player.activeWeaponKey === 'rifle') {
                this.player.shoot();
            }

            // Update Map Loot
            if (this.map) this.map.update(delta);

            // Update Safe Zone
            if (this.safeZone) {
                this.safeZone.update(delta, this.player, this.aiManager.bots);
                // Update Safe Zone Timer on HUD
                const phaseTime = Math.ceil(this.safeZone.phaseTimer);
                const isShrinking = (this.safeZone.state === 'SHRINKING');
                this.ui.stormTimer.textContent = isShrinking ? `SHRINKING (${phaseTime}s)` : `SAFE (${phaseTime}s)`;
                this.ui.stormTimer.style.color = isShrinking ? '#ff3344' : '#00f0ff';
            }

            // Update Player
            if (this.player && this.player.alive) {
                this.player.update(delta, combinedInput, this.map);
                this.ui.updatePlayerStats(this.player);
                this.ui.updateCompass(this.player.yaw);
            }

            // Update AI Bots
            if (this.aiManager) {
                this.aiManager.update(delta, this.map, this.safeZone, this.player);
            }

            // Update Weapons, Bullets & Physics Collisions
            if (this.weaponManager) {
                const allTargets = [this.player, ...this.aiManager.bots];
                this.weaponManager.update(delta, this.map.colliders, allTargets);
            }

            // Camera Shake application
            if (this.cameraShakeIntensity > 0) {
                this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
                this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
                this.camera.position.z += (Math.random() - 0.5) * this.cameraShakeIntensity;
                this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 3.5);
            }

            // Update HUD Minimap & 3D Damage Numbers
            this.ui.updateMinimap(this.player, this.safeZone, this.aiManager.bots);
            this.ui.updateWorldDamageNumbers(this.camera);

            // Match Timer HUD
            const elapsed = Math.floor((performance.now() - this.matchStartTime) / 1000);
            const m = Math.floor(elapsed / 60);
            const s = elapsed % 60;
            this.ui.matchTimer.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }
}

// Global initialization on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new AatakshGame();
});
