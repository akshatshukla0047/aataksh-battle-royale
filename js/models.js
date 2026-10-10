/**
 * AATAKSH - Procedural 3D Model & Animation Engine
 * Creates rich, optimized 3D models for Akshat, Akshita, Weapons, Buildings, and Map props
 */

class ModelFactory {
    constructor() {
        this.materials = this.initMaterials();
    }

    // Procedural canvas textures for realistic tactical surfaces
    createProceduralTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (type === 'carbon') {
            ctx.fillStyle = '#181a1d';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#22252a';
            for (let x = 0; x < 256; x += 8) {
                for (let y = 0; y < 256; y += 8) {
                    if ((x + y) % 16 === 0) {
                        ctx.fillRect(x, y, 8, 8);
                    }
                }
            }
        } else if (type === 'camo_dark') {
            ctx.fillStyle = '#1e2124';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#2c3035';
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 24, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#141618';
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 18, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'camo_red') {
            ctx.fillStyle = '#1a1818';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#7a1414';
            for (let i = 0; i < 35; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 22, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#b81d1d';
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 12, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'container') {
            ctx.fillStyle = '#3a506b';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#2b3a4a';
            for (let x = 0; x < 256; x += 16) {
                ctx.fillRect(x, 0, 6, 256);
            }
        } else if (type === 'concrete') {
            ctx.fillStyle = '#8a8d91';
            ctx.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 800; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#777a7e' : '#999da3';
                ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    initMaterials() {
        const carbonTex = this.createProceduralTexture('carbon');
        const darkCamoTex = this.createProceduralTexture('camo_dark');
        const redCamoTex = this.createProceduralTexture('camo_red');

        return {
            skinMale: new THREE.MeshLambertMaterial({ color: 0xd29d7c }),
            skinFemale: new THREE.MeshLambertMaterial({ color: 0xe0ad8b }),
            hairDark: new THREE.MeshLambertMaterial({ color: 0x1a1614 }),
            hairRedTint: new THREE.MeshLambertMaterial({ color: 0x2e1114 }),
            tacticalBlack: new THREE.MeshStandardMaterial({ color: 0x181a1c, roughness: 0.7, metalness: 0.2 }),
            tacticalGrey: new THREE.MeshStandardMaterial({ color: 0x34383c, roughness: 0.6, metalness: 0.3 }),
            camoDark: new THREE.MeshStandardMaterial({ map: darkCamoTex, roughness: 0.8 }),
            camoRed: new THREE.MeshStandardMaterial({ map: redCamoTex, roughness: 0.8 }),
            bootsLeather: new THREE.MeshStandardMaterial({ color: 0x0f1011, roughness: 0.5, metalness: 0.4 }),
            armorPlateMale: new THREE.MeshStandardMaterial({ color: 0x25282d, roughness: 0.3, metalness: 0.8 }),
            armorPlateFemale: new THREE.MeshStandardMaterial({ color: 0x8b181b, roughness: 0.3, metalness: 0.85 }),
            gunMetalDark: new THREE.MeshStandardMaterial({ color: 0x1f2224, roughness: 0.3, metalness: 0.9 }),
            gunMetalSteel: new THREE.MeshStandardMaterial({ color: 0x484d52, roughness: 0.3, metalness: 0.85 }),
            gunGrip: new THREE.MeshStandardMaterial({ color: 0x151617, roughness: 0.9, metalness: 0.1 }),
            gunGold: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 }),
            scopeLens: new THREE.MeshStandardMaterial({ color: 0x11e2f5, roughness: 0.1, metalness: 0.9, opacity: 0.7, transparent: true }),
            glowCyan: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
            glowRed: new THREE.MeshBasicMaterial({ color: 0xff1e38 }),
            glowGreen: new THREE.MeshBasicMaterial({ color: 0x22ff66 }),
            glowYellow: new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
            visorMale: new THREE.MeshStandardMaterial({ color: 0x00e1d9, roughness: 0.1, metalness: 0.95, opacity: 0.85, transparent: true }),
            visorFemale: new THREE.MeshStandardMaterial({ color: 0xff2a48, roughness: 0.1, metalness: 0.95, opacity: 0.85, transparent: true })
        };
    }

    // -------------------------------------------------------------
    // CHARACTER GENERATOR (AKSHAT & AKSHITA)
    // -------------------------------------------------------------
    createCharacter(characterId = 'akshat') {
        const isMale = (characterId === 'akshat');
        const root = new THREE.Group();
        root.name = `character_${characterId}`;

        const m = this.materials;
        const skinMat = isMale ? m.skinMale : m.skinFemale;
        const pantsMat = isMale ? m.tacticalBlack : m.camoRed;
        const jacketMat = isMale ? m.camoDark : m.tacticalBlack;
        const armorMat = isMale ? m.armorPlateMale : m.armorPlateFemale;
        const visorMat = isMale ? m.visorMale : m.visorFemale;
        const hairMat = isMale ? m.hairDark : m.hairRedTint;

        // Scaling & proportions
        const scale = isMale ? 1.0 : 0.96;
        const width = isMale ? 1.0 : 0.9;

        // Pelvis / Hips (Root of body hierarchy)
        const hips = new THREE.Group();
        hips.position.y = 0.95 * scale;
        root.add(hips);

        const pelvisGeo = new THREE.BoxGeometry(0.38 * width, 0.22, 0.26);
        const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
        pelvisMesh.castShadow = true;
        hips.add(pelvisMesh);

        // Tactical belt & pouch
        const beltGeo = new THREE.BoxGeometry(0.40 * width, 0.08, 0.28);
        const beltMesh = new THREE.Mesh(beltGeo, m.bootsLeather);
        beltMesh.position.y = 0.06;
        hips.add(beltMesh);

        const pouchGeo = new THREE.BoxGeometry(0.08, 0.1, 0.08);
        const pouchL = new THREE.Mesh(pouchGeo, m.tacticalGrey);
        pouchL.position.set(-0.21 * width, 0.02, 0);
        const pouchR = new THREE.Mesh(pouchGeo, m.tacticalGrey);
        pouchR.position.set(0.21 * width, 0.02, 0);
        hips.add(pouchL);
        hips.add(pouchR);

        // Torso / Chest
        const spine = new THREE.Group();
        spine.position.y = 0.12;
        hips.add(spine);

        const chestWidth = (isMale ? 0.44 : 0.38) * width;
        const chestGeo = new THREE.BoxGeometry(chestWidth, 0.44, 0.28);
        const chestMesh = new THREE.Mesh(chestGeo, jacketMat);
        chestMesh.position.y = 0.22;
        chestMesh.castShadow = true;
        spine.add(chestMesh);

        // Tactical Armor Vest Plate
        const vestGeo = new THREE.BoxGeometry(chestWidth + 0.03, 0.36, 0.31);
        const vestMesh = new THREE.Mesh(vestGeo, armorMat);
        vestMesh.position.y = 0.22;
        spine.add(vestMesh);

        // Neck & Head
        const neck = new THREE.Group();
        neck.position.y = 0.46;
        spine.add(neck);

        const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8);
        const neckMesh = new THREE.Mesh(neckGeo, skinMat);
        neckMesh.position.y = 0.04;
        neck.add(neckMesh);

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.14;
        neck.add(headGroup);

        const headGeo = new THREE.BoxGeometry(0.22, 0.25, 0.24);
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        // Hair styling
        if (isMale) {
            // Stylish tactical undercut
            const hairGeo = new THREE.BoxGeometry(0.24, 0.12, 0.26);
            const hairMesh = new THREE.Mesh(hairGeo, hairMat);
            hairMesh.position.set(0, 0.12, -0.01);
            headGroup.add(hairMesh);

            // Comms headset
            const headsetBand = new THREE.BoxGeometry(0.25, 0.04, 0.04);
            const headset = new THREE.Mesh(headsetBand, m.tacticalBlack);
            headset.position.set(0, 0.08, 0);
            headGroup.add(headset);
            const earpiece = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
            earpiece.rotateZ(Math.PI / 2);
            const earR = new THREE.Mesh(earpiece, m.tacticalGrey);
            earR.position.set(0.12, 0.03, 0);
            headGroup.add(earR);
        } else {
            // Stylish ponytail with crimson hair streak
            const hairGeo = new THREE.BoxGeometry(0.24, 0.14, 0.26);
            const hairMesh = new THREE.Mesh(hairGeo, hairMat);
            hairMesh.position.set(0, 0.11, -0.01);
            headGroup.add(hairMesh);

            const ponytailGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.35, 8);
            ponytailGeo.rotateX(-Math.PI / 6);
            const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
            ponytail.position.set(0, 0.04, -0.22);
            headGroup.add(ponytail);
        }

        // Tactical Visor / Eye Shades
        const visorGeo = new THREE.BoxGeometry(0.21, 0.06, 0.05);
        const visorMesh = new THREE.Mesh(visorGeo, visorMat);
        visorMesh.position.set(0, 0.02, 0.12);
        headGroup.add(visorMesh);

        // ----------------- LEGS -----------------
        const createLeg = (isLeft) => {
            const side = isLeft ? -1 : 1;
            const legRoot = new THREE.Group();
            legRoot.position.set(side * 0.12 * width, -0.1, 0);
            hips.add(legRoot);

            // Upper Leg (Thigh)
            const thighGeo = new THREE.BoxGeometry(0.15, 0.42, 0.17);
            const thigh = new THREE.Mesh(thighGeo, pantsMat);
            thigh.position.y = -0.21;
            thigh.castShadow = true;
            legRoot.add(thigh);

            // Thigh Holster / Tactical Strap
            if (!isLeft) {
                const holsterGeo = new THREE.BoxGeometry(0.06, 0.14, 0.1);
                const holster = new THREE.Mesh(holsterGeo, m.bootsLeather);
                holster.position.set(0.08, -0.18, 0);
                legRoot.add(holster);
            }

            // Knee joint
            const knee = new THREE.Group();
            knee.position.y = -0.42;
            legRoot.add(knee);

            // Knee Pad
            const kneePadGeo = new THREE.BoxGeometry(0.12, 0.1, 0.06);
            const kneePad = new THREE.Mesh(kneePadGeo, armorMat);
            kneePad.position.set(0, -0.04, 0.09);
            knee.add(kneePad);

            // Lower Leg (Shin) & Combat Boot
            const shinGeo = new THREE.BoxGeometry(0.13, 0.38, 0.15);
            const shin = new THREE.Mesh(shinGeo, pantsMat);
            shin.position.y = -0.19;
            shin.castShadow = true;
            knee.add(shin);

            // Combat Boot
            const bootGeo = new THREE.BoxGeometry(0.14, 0.18, 0.22);
            const boot = new THREE.Mesh(bootGeo, m.bootsLeather);
            boot.position.set(0, -0.32, 0.03);
            boot.castShadow = true;
            knee.add(boot);

            return { legRoot, knee };
        };

        const leftLeg = createLeg(true);
        const rightLeg = createLeg(false);

        // ----------------- ARMS -----------------
        const createArm = (isLeft) => {
            const side = isLeft ? -1 : 1;
            const armRoot = new THREE.Group();
            armRoot.position.set(side * (chestWidth * 0.5 + 0.06), 0.38, 0);
            spine.add(armRoot);

            // Shoulder Pauldron / Guard
            const shoulderGeo = new THREE.BoxGeometry(0.14, 0.12, 0.16);
            const shoulder = new THREE.Mesh(shoulderGeo, armorMat);
            shoulder.position.set(side * 0.02, -0.02, 0);
            armRoot.add(shoulder);

            // Upper Arm
            const upperArmGeo = new THREE.BoxGeometry(0.12, 0.32, 0.13);
            const upperArm = new THREE.Mesh(upperArmGeo, jacketMat);
            upperArm.position.y = -0.16;
            upperArm.castShadow = true;
            armRoot.add(upperArm);

            // Elbow
            const elbow = new THREE.Group();
            elbow.position.y = -0.32;
            armRoot.add(elbow);

            // Forearm
            const forearmGeo = new THREE.BoxGeometry(0.11, 0.28, 0.12);
            const forearm = new THREE.Mesh(forearmGeo, isLeft ? jacketMat : skinMat);
            forearm.position.y = -0.14;
            forearm.castShadow = true;
            elbow.add(forearm);

            // Tactical Glove / Hand
            const handGeo = new THREE.BoxGeometry(0.09, 0.1, 0.1);
            const hand = new THREE.Mesh(handGeo, m.bootsLeather);
            hand.position.y = -0.31;
            elbow.add(hand);

            return { armRoot, elbow, hand };
        };

        const leftArm = createArm(true);
        const rightArm = createArm(false);

        // Weapon Attachment Point in right hand
        const weaponMount = new THREE.Group();
        weaponMount.position.set(0, -0.06, 0.06);
        weaponMount.rotation.x = Math.PI / 2;
        rightArm.hand.add(weaponMount);

        // Shield Effect Dome (for Akshita's Titan Shield)
        const shieldDome = this.createShieldMesh();
        shieldDome.visible = false;
        root.add(shieldDome);

        // Speed Trail Aura (for Akshat's Adrenaline Rush)
        const speedAura = this.createSpeedAura();
        speedAura.visible = false;
        root.add(speedAura);

        // Character controller metadata and animation system
        const characterData = {
            id: characterId,
            name: isMale ? "Akshat" : "Akshita",
            abilityName: isMale ? "Adrenaline Rush" : "Titan Shield",
            abilityDesc: isMale ? "+65% Movement Speed for 8s" : "Absorbs 75% Damage for 8s",
            root,
            hips,
            spine,
            neck,
            headGroup,
            leftLeg,
            rightLeg,
            leftArm,
            rightArm,
            weaponMount,
            shieldDome,
            speedAura,
            animTimer: 0,
            currentAnim: 'idle',
            recoilKick: 0
        };

        root.userData = characterData;
        return characterData;
    }

    // Hexagonal glowing shield dome for Akshita
    createShieldMesh() {
        const geo = new THREE.IcosahedronGeometry(1.6, 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00e1d9,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.0;
        return mesh;
    }

    // Speed particle aura for Akshat
    createSpeedAura() {
        const group = new THREE.Group();
        const geo = new THREE.RingGeometry(0.3, 0.9, 16);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.y = 0.05;
        group.add(ring);
        return group;
    }

    // Procedural Animation System (walk, run, crouch, jump, aim, recoil)
    updateCharacterAnimation(char, delta, movementState = {}) {
        if (!char) return;
        char.animTimer += delta;

        const {
            isMoving = false,
            isSprinting = false,
            isCrouching = false,
            isJumping = false,
            isAiming = false,
            moveSpeed = 0
        } = movementState;

        const timer = char.animTimer;
        const hips = char.hips;
        const spine = char.spine;
        const leftLeg = char.leftLeg;
        const rightLeg = char.rightLeg;
        const leftArm = char.leftArm;
        const rightArm = char.rightArm;

        // Crouch posture adjustment
        const targetHipsY = isCrouching ? 0.65 : (isJumping ? 1.2 : 0.95);
        hips.position.y += (targetHipsY - hips.position.y) * 10 * delta;

        // Recoil kick decay
        if (char.recoilKick > 0) {
            char.recoilKick = Math.max(0, char.recoilKick - delta * 5);
        }

        if (isJumping) {
            // Tuck legs slightly, raise arms
            leftLeg.legRoot.rotation.x = -0.5;
            leftLeg.knee.rotation.x = 0.8;
            rightLeg.legRoot.rotation.x = -0.3;
            rightLeg.knee.rotation.x = 0.6;
            leftArm.armRoot.rotation.x = -0.8;
            rightArm.armRoot.rotation.x = -0.6;
        } else if (isMoving) {
            // Walk or sprint stride frequency
            const freq = isSprinting ? 12 : 7;
            const amp = isSprinting ? 0.85 : 0.55;
            const swing = Math.sin(timer * freq);

            // Legs opposing swing
            leftLeg.legRoot.rotation.x = swing * amp;
            rightLeg.legRoot.rotation.x = -swing * amp;

            // Knee flex on backswing
            leftLeg.knee.rotation.x = swing < 0 ? Math.abs(swing) * 0.9 : 0.1;
            rightLeg.knee.rotation.x = swing > 0 ? Math.abs(swing) * 0.9 : 0.1;

            // Torso bounce
            spine.position.y = 0.12 + Math.abs(Math.cos(timer * freq)) * 0.04;
            spine.rotation.y = -swing * 0.12;

            if (isAiming) {
                // Keep weapon aimed forward even while walking
                this.applyAimPose(char);
            } else {
                // Natural arm swing
                leftArm.armRoot.rotation.x = -swing * amp * 0.7;
                leftArm.elbow.rotation.x = -0.2 - Math.abs(swing) * 0.3;
                rightArm.armRoot.rotation.x = swing * amp * 0.5;
                rightArm.elbow.rotation.x = -0.5;
            }
        } else {
            // Idle breathing
            const breathe = Math.sin(timer * 2.5);
            spine.position.y = 0.12 + breathe * 0.015;
            leftLeg.legRoot.rotation.set(0, 0, 0);
            leftLeg.knee.rotation.set(0, 0, 0);
            rightLeg.legRoot.rotation.set(0, 0, 0);
            rightLeg.knee.rotation.set(0, 0, 0);

            if (isAiming) {
                this.applyAimPose(char);
            } else {
                // Relaxed tactical hold
                leftArm.armRoot.rotation.set(-0.35 + breathe * 0.03, 0.3, 0.1);
                leftArm.elbow.rotation.set(-0.6, 0, 0);
                rightArm.armRoot.rotation.set(-0.4 + breathe * 0.02, -0.2, -0.1);
                rightArm.elbow.rotation.set(-0.7, 0, 0);
            }
        }

        // Apply recoil kick to right arm / upper body
        if (char.recoilKick > 0) {
            rightArm.armRoot.rotation.x -= char.recoilKick * 0.35;
            spine.rotation.x += char.recoilKick * 0.15;
        }
    }

    applyAimPose(char) {
        // Steady tactical two-handed aim facing straight
        char.rightArm.armRoot.rotation.set(-1.45, -0.25, 0.1);
        char.rightArm.elbow.rotation.set(-0.4, 0, 0);
        char.leftArm.armRoot.rotation.set(-1.3, 0.45, -0.2);
        char.leftArm.elbow.rotation.set(-0.9, 0, 0);
    }

    // -------------------------------------------------------------
    // WEAPONS GENERATOR (AK-47, AWM, SPAS-12, DEAGLE, GRENADE)
    // -------------------------------------------------------------
    createWeaponModel(weaponType) {
        const root = new THREE.Group();
        root.name = `weapon_${weaponType}`;
        const m = this.materials;

        switch (weaponType) {
            case 'sniper': {
                // AWM Arctic Sniper Rifle
                // Receiver
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.65), m.gunMetalDark);
                root.add(body);

                // Long precision barrel
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.75, 8), m.gunMetalSteel);
                barrel.rotateX(Math.PI / 2);
                barrel.position.set(0, 0.02, 0.65);
                root.add(barrel);

                // Muzzle brake
                const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.08), m.gunMetalDark);
                muzzle.position.set(0, 0.02, 1.05);
                root.add(muzzle);

                // Sniper Scope with dual rings
                const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 8), m.gunMetalDark);
                scopeTube.rotateX(Math.PI / 2);
                scopeTube.position.set(0, 0.14, 0.05);
                root.add(scopeTube);

                const lensF = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), m.scopeLens);
                lensF.rotateX(Math.PI / 2);
                lensF.position.set(0, 0.14, 0.22);
                root.add(lensF);

                // Thumbhole Stock
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.38), m.camoDark);
                stock.position.set(0, -0.04, -0.42);
                root.add(stock);

                // Magazine & Bolt handle
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.12), m.gunMetalSteel);
                mag.position.set(0, -0.12, 0.08);
                root.add(mag);

                const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.03), m.gunMetalSteel);
                bolt.position.set(0.07, 0.06, -0.06);
                root.add(bolt);
                break;
            }
            case 'shotgun': {
                // Spas-12 Tactical Shotgun
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.5), m.gunMetalDark);
                root.add(receiver);

                // Heavy Dual Barrel + Tube
                const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.55, 8), m.gunMetalSteel);
                barrel1.rotateX(Math.PI / 2);
                barrel1.position.set(0, 0.03, 0.48);
                root.add(barrel1);

                const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8), m.gunMetalSteel);
                magTube.rotateX(Math.PI / 2);
                magTube.position.set(0, -0.03, 0.42);
                root.add(magTube);

                // Pump handle slide
                const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.18, 8), m.gunGrip);
                pump.rotateX(Math.PI / 2);
                pump.position.set(0, -0.03, 0.38);
                root.add(pump);

                // Pistol grip & folding stock
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.09), m.gunGrip);
                grip.position.set(0, -0.12, -0.14);
                grip.rotation.x = -0.3;
                root.add(grip);

                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.3), m.gunMetalDark);
                stock.position.set(0, 0.02, -0.32);
                root.add(stock);
                break;
            }
            case 'pistol': {
                // Desert Eagle .50 Handgun
                const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.28), m.gunMetalSteel);
                slide.position.set(0, 0.04, 0.04);
                root.add(slide);

                const frame = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.2), m.gunMetalDark);
                frame.position.set(0, -0.01, 0.02);
                root.add(frame);

                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.09), m.gunGrip);
                grip.position.set(0, -0.1, -0.04);
                grip.rotation.x = -0.25;
                root.add(grip);

                const barrelPort = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8), m.gunMetalDark);
                barrelPort.rotateX(Math.PI / 2);
                barrelPort.position.set(0, 0.04, 0.19);
                root.add(barrelPort);
                break;
            }
            case 'grenade': {
                // Tactical Frag Grenade
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), m.camoDark);
                root.add(body);

                const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), m.gunMetalDark);
                topCap.position.y = 0.09;
                root.add(topCap);

                const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.02), m.gunMetalSteel);
                spoon.position.set(0.03, 0.05, 0);
                root.add(spoon);

                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 12), m.gunGold);
                ring.position.set(-0.03, 0.09, 0);
                root.add(ring);
                break;
            }
            case 'rifle':
            default: {
                // AK-Tactical Assault Rifle
                const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.48), m.gunMetalDark);
                root.add(receiver);

                // Handguard
                const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.28), m.camoDark);
                handguard.position.set(0, 0.01, 0.32);
                root.add(handguard);

                // Barrel & Gas Tube
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), m.gunMetalSteel);
                barrel.rotateX(Math.PI / 2);
                barrel.position.set(0, 0.02, 0.58);
                root.add(barrel);

                // Curved Banana Magazine
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.24, 0.12), m.gunMetalDark);
                mag.position.set(0, -0.15, 0.12);
                mag.rotation.x = 0.25;
                root.add(mag);

                // Tactical Stock
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.32), m.gunMetalDark);
                stock.position.set(0, -0.02, -0.34);
                root.add(stock);

                // Pistol Grip
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.15, 0.08), m.gunGrip);
                grip.position.set(0, -0.12, -0.12);
                grip.rotation.x = -0.3;
                root.add(grip);

                // Red dot sight optic
                const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.12), m.gunMetalSteel);
                sightBase.position.set(0, 0.08, 0.05);
                root.add(sightBase);

                const sightOptic = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.025, 8), m.glowCyan);
                sightOptic.position.set(0, 0.1, 0.1);
                root.add(sightOptic);
                break;
            }
        }

        // Add a muzzle point for firing tracers/flashes
        const muzzlePoint = new THREE.Object3D();
        muzzlePoint.name = 'muzzle';
        switch (weaponType) {
            case 'sniper': muzzlePoint.position.set(0, 0.02, 1.1); break;
            case 'shotgun': muzzlePoint.position.set(0, 0.03, 0.78); break;
            case 'pistol': muzzlePoint.position.set(0, 0.04, 0.24); break;
            case 'rifle': muzzlePoint.position.set(0, 0.02, 0.78); break;
            default: muzzlePoint.position.set(0, 0, 0.2); break;
        }
        root.add(muzzlePoint);

        return root;
    }

    // -------------------------------------------------------------
    // ENVIRONMENT OBJECTS (BUILDINGS, WAREHOUSE, TOWER, TREES, CRATES)
    // -------------------------------------------------------------

    // 2-Story Enterable Tactical House
    createTacticalHouse() {
        const group = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x9e978e, roughness: 0.85 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x423e3b, roughness: 0.8 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: 0.9 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.7 });

        const W = 16;
        const D = 14;
        const H1 = 4.5;
        const H2 = 4.5;

        // Ground Floor Floorplate
        const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), floorMat);
        groundFloor.position.y = 0.2;
        groundFloor.receiveShadow = true;
        group.add(groundFloor);

        // Ground Walls with Doorway (Front has door opening)
        // Back Wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H1, 0.5), wallMat);
        backWall.position.set(0, H1 / 2, -D / 2);
        backWall.castShadow = true;
        group.add(backWall);

        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, H1, D), wallMat);
        leftWall.position.set(-W / 2, H1 / 2, 0);
        leftWall.castShadow = true;
        group.add(leftWall);

        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, H1, D), wallMat);
        rightWall.position.set(W / 2, H1 / 2, 0);
        rightWall.castShadow = true;
        group.add(rightWall);

        // Front Wall Left & Right sections leaving 3.5m door opening
        const frontL = new THREE.Mesh(new THREE.BoxGeometry((W - 3.5) / 2, H1, 0.5), wallMat);
        frontL.position.set(-(W - 3.5) / 4 - 1.75, H1 / 2, D / 2);
        group.add(frontL);

        const frontR = new THREE.Mesh(new THREE.BoxGeometry((W - 3.5) / 2, H1, 0.5), wallMat);
        frontR.position.set((W - 3.5) / 4 + 1.75, H1 / 2, D / 2);
        group.add(frontR);

        // Second Floor Ceiling / Floor
        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), floorMat);
        secondFloor.position.y = H1 + 0.2;
        secondFloor.receiveShadow = true;
        group.add(secondFloor);

        // Second Floor Balcony & Roof Walls
        const roofParapetB = new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, 0.4), roofMat);
        roofParapetB.position.set(0, H1 + 0.8, -D / 2);
        group.add(roofParapetB);

        const roofParapetL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, D), roofMat);
        roofParapetL.position.set(-W / 2, H1 + 0.8, 0);
        group.add(roofParapetL);

        const roofParapetR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, D), roofMat);
        roofParapetR.position.set(W / 2, H1 + 0.8, 0);
        group.add(roofParapetR);

        // Staircase / Ramp to Second Floor / Roof
        const stairsRamp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 7), floorMat);
        stairsRamp.position.set(W / 2 - 2, H1 / 2, 0);
        stairsRamp.rotation.x = -Math.PI / 6;
        group.add(stairsRamp);

        return group;
    }

    // Industrial Military Warehouse
    createWarehouse() {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x3e4a59, roughness: 0.6, metalness: 0.4 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x27303b, roughness: 0.5, metalness: 0.6 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.9 });

        const W = 28;
        const D = 20;
        const H = 8;

        // Concrete floor
        const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), floorMat);
        floor.position.y = 0.25;
        group.add(floor);

        // Long Back Wall
        const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.6), metalMat);
        back.position.set(0, H / 2, -D / 2);
        back.castShadow = true;
        group.add(back);

        // Left & Right Gable Walls
        const left = new THREE.Mesh(new THREE.BoxGeometry(0.6, H, D), metalMat);
        left.position.set(-W / 2, H / 2, 0);
        left.castShadow = true;
        group.add(left);

        const right = new THREE.Mesh(new THREE.BoxGeometry(0.6, H, D), metalMat);
        right.position.set(W / 2, H / 2, 0);
        right.castShadow = true;
        group.add(right);

        // Front with huge 10m roll-up door opening
        const frontL = new THREE.Mesh(new THREE.BoxGeometry((W - 10) / 2, H, 0.6), metalMat);
        frontL.position.set(-(W + 10) / 4, H / 2, D / 2);
        group.add(frontL);

        const frontR = new THREE.Mesh(new THREE.BoxGeometry((W - 10) / 2, H, 0.6), metalMat);
        frontR.position.set((W + 10) / 4, H / 2, D / 2);
        group.add(frontR);

        // Gabled Roof
        const roofL = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 0.4, (D / 2) + 2), roofMat);
        roofL.position.set(0, H + 1.8, -D / 4);
        roofL.rotation.x = 0.25;
        roofL.castShadow = true;
        group.add(roofL);

        const roofR = new THREE.Mesh(new THREE.BoxGeometry(W + 1, 0.4, (D / 2) + 2), roofMat);
        roofR.position.set(0, H + 1.8, D / 4);
        roofR.rotation.x = -0.25;
        roofR.castShadow = true;
        group.add(roofR);

        // Interior Wooden Supply Crates for cover & tactical fire
        for (let i = -1; i <= 1; i += 2) {
            const crate = this.createMilitaryCrate();
            crate.scale.set(1.5, 1.5, 1.5);
            crate.position.set(i * 6, 0, -4);
            group.add(crate);
        }

        return group;
    }

    // Military Watchtower
    createWatchtower() {
        const group = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x303438, roughness: 0.5, metalness: 0.7 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4635, roughness: 0.9 });

        const H = 10;
        // 4 Legs
        [-2.5, 2.5].forEach(x => {
            [-2.5, 2.5].forEach(z => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, H, 8), steelMat);
                leg.position.set(x, H / 2, z);
                leg.castShadow = true;
                group.add(leg);
            });
        });

        // Top Platform
        const platform = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 6.5), woodMat);
        platform.position.y = H;
        platform.castShadow = true;
        group.add(platform);

        // Guard rails / Sandbags around platform
        const railMat = new THREE.MeshStandardMaterial({ color: 0x73695d, roughness: 0.9 });
        [-2.8, 2.8].forEach(x => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 6), railMat);
            rail.position.set(x, H + 0.6, 0);
            group.add(rail);
        });
        const railB = new THREE.Mesh(new THREE.BoxGeometry(6, 1.1, 0.4), railMat);
        railB.position.set(0, H + 0.6, -2.8);
        group.add(railB);

        // Access Ladder / Ramp
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, H * 1.3), woodMat);
        ramp.position.set(0, H / 2, 4.5);
        ramp.rotation.x = -Math.PI / 4.2;
        group.add(ramp);

        return group;
    }

    // Shipping Container
    createShippingContainer(colorHex = 0x2e5077) {
        const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6, metalness: 0.5 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 10), mat);
        mesh.position.y = 1.6;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    // Pine Tree
    createPineTree() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.9 });
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x224922, roughness: 0.8 });

        const trunkH = 3 + Math.random() * 2;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, trunkH, 8), trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // 3 Tiers of foliage cones
        const tiers = [
            { r: 3.2, h: 4.2, y: trunkH * 0.7 },
            { r: 2.6, h: 3.8, y: trunkH * 0.7 + 2.5 },
            { r: 1.8, h: 3.2, y: trunkH * 0.7 + 4.8 }
        ];

        tiers.forEach(t => {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), leavesMat);
            cone.position.y = t.y;
            cone.castShadow = true;
            group.add(cone);
        });

        return group;
    }

    // Granite Boulder / Rock
    createBoulder() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x585c63, roughness: 0.9, flatShading: true });
        const geo = new THREE.DodecahedronGeometry(1.4 + Math.random() * 0.8, 1);
        const rock = new THREE.Mesh(geo, rockMat);
        rock.position.y = 1.0;
        rock.castShadow = true;
        rock.receiveShadow = true;
        return rock;
    }

    // Military Wooden Crate
    createMilitaryCrate() {
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x6e5843, roughness: 0.85 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), crateMat);
        mesh.position.y = 0.75;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    // Supply Airdrop Crate with Flashing Beacon & Parachute
    createSupplyDrop() {
        const group = new THREE.Group();
        const dropMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4, metalness: 0.3 });
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x181a1c, roughness: 0.6 });
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

        const crate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), dropMat);
        crate.position.y = 1.2;
        crate.castShadow = true;
        group.add(crate);

        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), frameMat);
        frame.position.y = 1.2;
        group.add(frame);

        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8), lightMat);
        beacon.position.y = 2.5;
        group.add(beacon);

        // Canopy Parachute
        const parachuteGeo = new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const parachuteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const parachute = new THREE.Mesh(parachuteGeo, parachuteMat);
        parachute.position.y = 7.5;
        group.add(parachute);

        // Parachute suspension lines
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 5.5, 4);
            const line = new THREE.Mesh(lineGeo, frameMat);
            line.position.set(Math.cos(angle) * 1.5, 4.8, Math.sin(angle) * 1.5);
            line.rotation.z = Math.cos(angle) * 0.35;
            line.rotation.x = Math.sin(angle) * 0.35;
            group.add(line);
        }

        return group;
    }
}

window.modelFactory = new ModelFactory();
