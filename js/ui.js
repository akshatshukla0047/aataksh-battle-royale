/**
 * AATAKSH - User Interface, HUD, Minimap, Damage Numbers, Kill Feed, Touch Controls & Modals
 */

class UIManager {
    constructor() {
        this.damageNumbers = [];
        this.initDomReferences();
        this.initEventListeners();
        this.initMinimap();
        this.initTouchControls();
    }

    initDomReferences() {
        // Screens
        this.mainMenu = document.getElementById('main-menu');
        this.gameHud = document.getElementById('game-hud');
        this.characterModal = document.getElementById('character-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.controlsModal = document.getElementById('controls-modal');
        this.victoryScreen = document.getElementById('victory-screen');
        this.defeatScreen = document.getElementById('defeat-screen');

        // HUD Elements
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.armorFill = document.getElementById('armor-fill');
        this.armorText = document.getElementById('armor-text');
        this.ammoClip = document.getElementById('ammo-clip');
        this.ammoReserve = document.getElementById('ammo-reserve');
        this.weaponName = document.getElementById('weapon-name');
        this.weaponIcon = document.getElementById('weapon-icon');
        this.aliveCount = document.getElementById('alive-count');
        this.killCount = document.getElementById('kill-count');
        this.matchTimer = document.getElementById('match-timer');
        this.stormTimer = document.getElementById('storm-timer');
        this.compassDegree = document.getElementById('compass-degree');
        this.compassTape = document.getElementById('compass-tape');
        this.hitmarker = document.getElementById('hitmarker');
        this.damageVignette = document.getElementById('damage-vignette');
        this.stormVignette = document.getElementById('storm-vignette');
        this.killFeed = document.getElementById('kill-feed');
        this.toastNotice = document.getElementById('toast-notice');
        this.lootPrompt = document.getElementById('loot-prompt');
        this.abilityBtn = document.getElementById('hud-ability-btn');
        this.abilityCdOverlay = document.getElementById('ability-cd-overlay');
        this.healBtn = document.getElementById('hud-heal-btn');
        this.medkitCount = document.getElementById('medkit-count');
        this.sniperScope = document.getElementById('sniper-scope-overlay');
        this.worldDmgContainer = document.getElementById('world-damage-container');

        // Minimap Canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }

    initEventListeners() {
        // Main Menu Buttons
        const btnPlay = document.getElementById('btn-play');
        const btnChar = document.getElementById('btn-characters');
        const btnSettings = document.getElementById('btn-settings');
        const btnControls = document.getElementById('btn-controls');
        const btnCloseModals = document.querySelectorAll('.modal-close');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                if (window.soundSystem) window.soundSystem.init();
                if (window.game) window.game.startMatch();
            });
        }

        if (btnChar) {
            btnChar.addEventListener('click', () => {
                this.characterModal.classList.remove('hidden');
            });
        }

        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                this.settingsModal.classList.remove('hidden');
            });
        }

        if (btnControls) {
            btnControls.addEventListener('click', () => {
                this.controlsModal.classList.remove('hidden');
            });
        }

        btnCloseModals.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal-overlay').classList.add('hidden');
            });
        });

        // Character Select Cards
        const cardAkshat = document.getElementById('card-akshat');
        const cardAkshita = document.getElementById('card-akshita');
        if (cardAkshat && cardAkshita) {
            cardAkshat.addEventListener('click', () => {
                cardAkshat.classList.add('selected');
                cardAkshita.classList.remove('selected');
                if (window.game) window.game.selectCharacter('akshat');
            });

            cardAkshita.addEventListener('click', () => {
                cardAkshita.classList.add('selected');
                cardAkshat.classList.remove('selected');
                if (window.game) window.game.selectCharacter('akshita');
            });
        }

        // Settings Sliders
        const sensSlider = document.getElementById('setting-sens');
        if (sensSlider) {
            sensSlider.addEventListener('input', (e) => {
                if (window.game) window.game.mouseSensitivity = parseFloat(e.target.value);
            });
        }

        const volSlider = document.getElementById('setting-volume');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                if (window.soundSystem) window.soundSystem.setMasterVolume(parseFloat(e.target.value));
            });
        }

        const touchToggle = document.getElementById('setting-touch');
        if (touchToggle) {
            touchToggle.addEventListener('change', (e) => {
                const touchContainer = document.getElementById('touch-controls-container');
                if (touchContainer) touchContainer.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Restart buttons
        const btnRestartVic = document.getElementById('btn-restart-victory');
        const btnRestartDef = document.getElementById('btn-restart-defeat');
        if (btnRestartVic) btnRestartVic.addEventListener('click', () => window.game.restartMatch());
        if (btnRestartDef) btnRestartDef.addEventListener('click', () => window.game.restartMatch());

        // HUD Interactive Clicks
        if (this.abilityBtn) {
            this.abilityBtn.addEventListener('click', () => {
                if (window.game && window.game.player) window.game.player.useAbility();
            });
        }
        if (this.healBtn) {
            this.healBtn.addEventListener('click', () => {
                if (window.game && window.game.player) window.game.player.useMedkit();
            });
        }

        // Weapon Slot Switch Buttons
        for (let s = 1; s <= 4; s++) {
            const slotEl = document.getElementById(`hud-slot-${s}`);
            if (slotEl) {
                slotEl.addEventListener('click', () => {
                    if (window.game && window.game.player) window.game.player.switchSlot(s);
                });
            }
        }
    }

    initMinimap() {
        if (!this.minimapCanvas) return;
        this.minimapCanvas.width = 180;
        this.minimapCanvas.height = 180;
    }

    // Touch Virtual Joystick & Touch Buttons for Mobile/Android
    initTouchControls() {
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const touchContainer = document.getElementById('touch-controls-container');
        if (touchContainer && isTouchDevice) {
            touchContainer.style.display = 'block';
        }

        this.touchInput = {
            forward: false, backward: false, left: false, right: false,
            jump: false, crouch: false, sprint: false, aim: false,
            shoot: false, interact: false
        };

        // Virtual Move Stick
        const stickBase = document.getElementById('touch-stick-base');
        const stickThumb = document.getElementById('touch-stick-thumb');
        if (stickBase && stickThumb) {
            let stickTouchId = null;
            let baseRect = null;

            const handleStick = (touch) => {
                const dx = touch.clientX - (baseRect.left + baseRect.width / 2);
                const dy = touch.clientY - (baseRect.top + baseRect.height / 2);
                const dist = Math.hypot(dx, dy);
                const maxR = baseRect.width / 2;
                const clampedDist = Math.min(dist, maxR);
                const angle = Math.atan2(dy, dx);

                const thumbX = Math.cos(angle) * clampedDist;
                const thumbY = Math.sin(angle) * clampedDist;
                stickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

                // Thresholds for directional movement
                const nx = dx / maxR;
                const ny = dy / maxR;
                this.touchInput.forward = (ny < -0.3);
                this.touchInput.backward = (ny > 0.3);
                this.touchInput.left = (nx < -0.3);
                this.touchInput.right = (nx > 0.3);
                this.touchInput.sprint = (clampedDist > maxR * 0.85);
            };

            stickBase.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                stickTouchId = touch.identifier;
                baseRect = stickBase.getBoundingClientRect();
                handleStick(touch);
            });

            stickBase.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === stickTouchId) {
                        handleStick(e.changedTouches[i]);
                        break;
                    }
                }
            });

            const endStick = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === stickTouchId) {
                        stickTouchId = null;
                        stickThumb.style.transform = 'translate(0px, 0px)';
                        this.touchInput.forward = false;
                        this.touchInput.backward = false;
                        this.touchInput.left = false;
                        this.touchInput.right = false;
                        this.touchInput.sprint = false;
                        break;
                    }
                }
            };

            stickBase.addEventListener('touchend', endStick);
            stickBase.addEventListener('touchcancel', endStick);
        }

        // Touch Swipe Area for Camera Look & Aim
        const touchLookArea = document.getElementById('touch-look-area');
        if (touchLookArea) {
            let lookTouchId = null;
            let lastLookX = 0;
            let lastLookY = 0;

            touchLookArea.addEventListener('touchstart', (e) => {
                const touch = e.changedTouches[0];
                lookTouchId = touch.identifier;
                lastLookX = touch.clientX;
                lastLookY = touch.clientY;
            });

            touchLookArea.addEventListener('touchmove', (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === lookTouchId) {
                        const dx = t.clientX - lastLookX;
                        const dy = t.clientY - lastLookY;
                        lastLookX = t.clientX;
                        lastLookY = t.clientY;

                        if (window.game && window.game.player) {
                            const sens = (window.game.mouseSensitivity || 0.0022) * 1.5;
                            window.game.player.yaw -= dx * sens;
                            window.game.player.pitch = Math.max(-1.1, Math.min(1.1, window.game.player.pitch - dy * sens));
                        }
                        break;
                    }
                }
            });

            const endLook = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === lookTouchId) {
                        lookTouchId = null;
                        break;
                    }
                }
            };
            touchLookArea.addEventListener('touchend', endLook);
            touchLookArea.addEventListener('touchcancel', endLook);
        }

        // Action Touch Buttons
        const bindTouchBtn = (elemId, key) => {
            const el = document.getElementById(elemId);
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchInput[key] = true;
                if (key === 'shoot' && window.game && window.game.player) {
                    window.game.player.shoot();
                }
            });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchInput[key] = false;
            });
        };

        bindTouchBtn('touch-btn-fire', 'shoot');
        bindTouchBtn('touch-btn-aim', 'aim');
        bindTouchBtn('touch-btn-jump', 'jump');
        bindTouchBtn('touch-btn-crouch', 'crouch');
        bindTouchBtn('touch-btn-reload', 'reload');
        bindTouchBtn('touch-btn-loot', 'interact');
    }

    updatePlayerStats(player) {
        if (!player) return;

        // Health Bar
        const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
        this.healthFill.style.width = `${hpPercent}%`;
        this.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

        // Armor Bar
        const armPercent = Math.max(0, Math.min(100, (player.armor / player.maxArmor) * 100));
        this.armorFill.style.width = `${armPercent}%`;
        this.armorText.textContent = `${Math.ceil(player.armor)} / ${player.maxArmor}`;

        // Medkit count
        if (this.medkitCount) {
            this.medkitCount.textContent = `${player.medkits}`;
        }

        // Ability Cooldown overlay
        if (this.abilityCdOverlay) {
            if (player.abilityCooldown > 0) {
                const pct = (player.abilityCooldown / player.abilityCooldownMax) * 100;
                this.abilityCdOverlay.style.height = `${pct}%`;
                this.abilityCdOverlay.textContent = `${Math.ceil(player.abilityCooldown)}s`;
            } else {
                this.abilityCdOverlay.style.height = '0%';
                this.abilityCdOverlay.textContent = '';
            }
        }
    }

    updateWeaponHud(weaponKey, inv) {
        const cfg = WEAPON_CONFIGS[weaponKey];
        if (!cfg) return;

        this.weaponName.textContent = cfg.name;
        if (weaponKey === 'grenade') {
            this.ammoClip.textContent = `${inv ? inv.count : 0}`;
            this.ammoReserve.textContent = 'GRENADES';
        } else {
            this.ammoClip.textContent = `${inv ? inv.mag : 0}`;
            this.ammoReserve.textContent = `/ ${inv ? inv.reserve : 0}`;
        }

        // Highlight active slot
        for (let s = 1; s <= 4; s++) {
            const slotEl = document.getElementById(`hud-slot-${s}`);
            if (slotEl) {
                if (s === cfg.slot) slotEl.classList.add('active');
                else slotEl.classList.remove('active');
            }
        }
    }

    setSniperScopeVisible(visible) {
        if (this.sniperScope) {
            this.sniperScope.style.display = visible ? 'block' : 'none';
        }
    }

    showHitmarker(isHeadshot = false) {
        if (!this.hitmarker) return;
        this.hitmarker.className = isHeadshot ? 'hitmarker headshot' : 'hitmarker hit';
        this.hitmarker.style.opacity = '1';
        this.hitmarker.style.transform = 'translate(-50%, -50%) scale(1.3)';

        setTimeout(() => {
            this.hitmarker.style.opacity = '0';
            this.hitmarker.style.transform = 'translate(-50%, -50%) scale(1.0)';
        }, 120);
    }

    flashDamageVignette() {
        if (!this.damageVignette) return;
        this.damageVignette.style.opacity = '0.7';
        setTimeout(() => {
            this.damageVignette.style.opacity = '0';
        }, 220);
    }

    flashStormVignette() {
        if (!this.stormVignette) return;
        this.stormVignette.style.opacity = '0.65';
        setTimeout(() => {
            this.stormVignette.style.opacity = '0';
        }, 300);
    }

    showToast(msg, duration = 2500) {
        if (!this.toastNotice) return;
        this.toastNotice.textContent = msg;
        this.toastNotice.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toastNotice.classList.remove('show');
        }, duration);
    }

    showLootPrompt(lootItem) {
        if (!this.lootPrompt) return;
        const d = lootItem.data;
        let label = d.type.toUpperCase();
        if (WEAPON_CONFIGS[d.type]) label = WEAPON_CONFIGS[d.type].name;
        if (d.type === 'armor') label = `Armor Vest (Lvl ${d.level})`;
        if (d.type === 'medkit') label = `First Aid Medkit (${d.count}x)`;

        this.lootPrompt.innerHTML = `<span class="key-pill">F</span> Take ${label}`;
        this.lootPrompt.style.display = 'block';
    }

    hideLootPrompt() {
        if (this.lootPrompt) this.lootPrompt.style.display = 'none';
    }

    addKillFeedEntry(killerName, victimName, weaponName, isPlayerKill = false, isHeadshot = false) {
        if (!this.killFeed) return;
        const entry = document.createElement('div');
        entry.className = `kill-feed-item ${isPlayerKill ? 'player-kill' : ''}`;
        entry.innerHTML = `
            <span class="kf-killer">${killerName}</span>
            <span class="kf-icon">${isHeadshot ? '🎯' : '⚡'} ${weaponName}</span>
            <span class="kf-victim">${victimName}</span>
        `;
        this.killFeed.appendChild(entry);

        setTimeout(() => {
            entry.classList.add('fade-out');
            setTimeout(() => entry.remove(), 400);
        }, 4000);
    }

    addWorldDamageNumber(worldPos, damage, isHeadshot = false) {
        this.damageNumbers.push({
            pos: worldPos.clone(),
            damage,
            isHeadshot,
            life: 0.85,
            el: null
        });
    }

    updateWorldDamageNumbers(camera) {
        if (!this.worldDmgContainer || !camera) return;

        const w = window.innerWidth;
        const h = window.innerHeight;

        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.life -= 0.016;

            if (!dn.el) {
                dn.el = document.createElement('div');
                dn.el.className = `dmg-number ${dn.isHeadshot ? 'headshot' : ''}`;
                dn.textContent = dn.isHeadshot ? `${dn.damage} 💥` : `${dn.damage}`;
                this.worldDmgContainer.appendChild(dn.el);
            }

            // Project 3D to 2D screen coordinate
            const p = dn.pos.clone();
            p.y += (0.85 - dn.life) * 1.5; // Float upwards
            p.project(camera);

            const screenX = (p.x * 0.5 + 0.5) * w;
            const screenY = (-(p.y * 0.5) + 0.5) * h;

            if (p.z < 1) {
                dn.el.style.left = `${screenX}px`;
                dn.el.style.top = `${screenY}px`;
                dn.el.style.opacity = `${Math.min(1, dn.life * 2)}`;
            } else {
                dn.el.style.opacity = '0';
            }

            if (dn.life <= 0) {
                dn.el.remove();
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    updateMinimap(player, safeZone, bots) {
        if (!this.minimapCtx || !player) return;
        const ctx = this.minimapCtx;
        const w = 180;
        const h = 180;
        const mapScale = 0.42; // island is 400 units, fits cleanly

        ctx.clearRect(0, 0, w, h);

        // Circular clip for tactical radar
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Background terrain radar color
        ctx.fillStyle = '#17231c';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#223829';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        const worldToMini = (wx, wz) => {
            return {
                x: w / 2 + (wx * mapScale),
                y: h / 2 + (wz * mapScale)
            };
        };

        // Draw Landmarks / POIs
        ctx.fillStyle = '#3a4e40';
        // Apex City at center
        const cityPt = worldToMini(0, 0);
        ctx.fillRect(cityPt.x - 12, cityPt.y - 12, 24, 24);
        // Military Base at (75, 75)
        const milPt = worldToMini(75, 75);
        ctx.fillRect(milPt.x - 10, milPt.y - 10, 20, 20);
        // Warehouses at (-75, 60)
        const whPt = worldToMini(-75, 60);
        ctx.fillRect(whPt.x - 10, whPt.y - 10, 20, 20);

        // Draw Safe Zones
        if (safeZone) {
            // Next Safe Zone (Dotted Yellow)
            const nextCenter = worldToMini(safeZone.nextCenter.x, safeZone.nextCenter.y);
            const nextR = safeZone.targetRadius * mapScale;
            ctx.strokeStyle = '#ffee00';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(nextCenter.x, nextCenter.y, nextR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Current Safe Zone (Solid Electric Blue)
            const curCenter = worldToMini(safeZone.center.x, safeZone.center.y);
            const curR = safeZone.radius * mapScale;
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(curCenter.x, curCenter.y, curR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw Bots (Subtle red blips if close or firing)
        if (bots) {
            ctx.fillStyle = '#ff2233';
            bots.forEach(b => {
                if (!b.alive) return;
                const d = player.position.distanceTo(b.position);
                if (d < 50) {
                    const pt = worldToMini(b.position.x, b.position.z);
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // Draw Player Arrow
        const playerPt = worldToMini(player.position.x, player.position.z);
        ctx.save();
        ctx.translate(playerPt.x, playerPt.y);
        ctx.rotate(-player.yaw); // Rotate with player yaw

        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        ctx.restore(); // restore clip
    }

    updateCompass(yaw) {
        if (!this.compassDegree) return;
        let deg = Math.round((-yaw * 180 / Math.PI) % 360);
        if (deg < 0) deg += 360;
        this.compassDegree.textContent = `${deg}°`;
        if (this.compassTape) {
            const offset = (deg / 360) * 800;
            this.compassTape.style.transform = `translateX(-${offset}px)`;
        }
    }

    showVictoryScreen(stats) {
        if (this.victoryScreen) {
            document.getElementById('vic-kills').textContent = stats.kills;
            document.getElementById('vic-dmg').textContent = stats.damage;
            document.getElementById('vic-time').textContent = stats.time;
            document.getElementById('vic-score').textContent = stats.score;
            this.victoryScreen.classList.remove('hidden');
        }
    }

    showDefeatScreen(stats) {
        if (this.defeatScreen) {
            document.getElementById('def-rank').textContent = `#${stats.rank} / 20`;
            document.getElementById('def-killer').textContent = stats.killer || 'Storm Zone';
            document.getElementById('def-kills').textContent = stats.kills;
            document.getElementById('def-dmg').textContent = stats.damage;
            this.defeatScreen.classList.remove('hidden');
        }
    }
}

window.UIManager = UIManager;
