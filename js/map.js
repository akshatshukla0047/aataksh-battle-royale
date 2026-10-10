/**
 * AATAKSH - Battle Royale Island Map & Loot System
 * 400x400 island with Central City, Military Outpost, Industrial Warehouses,
 * rolling terrain, roads, nature cover, and interactive 3D loot spawns.
 */

class IslandMap {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Array of { box: THREE.Box3, type: string }
        this.lootItems = [];  // Array of active loot pickups in the world
        this.airDrops = [];
        this.mapBounds = 200; // Half-size (-200 to +200)

        this.initTerrain();
        this.initLandmarks();
        this.initNatureAndProps();
        this.initLootSpawns();
    }

    // Terrain Elevation Function
    getTerrainHeight(x, z) {
        // Island falloff towards water boundary
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter > 190) return -2; // Water submerged

        const edgeFactor = Math.max(0, 1 - (distFromCenter / 185));

        // Smooth rolling hills and plateaus
        const hill1 = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 4.5;
        const hill2 = Math.sin(x * 0.045 + 1.2) * Math.sin(z * 0.045 + 0.8) * 2.5;
        const baseHeight = (hill1 + hill2) * edgeFactor;

        // Flatten major landmark locations
        // City at (0, 0)
        const cityDist = Math.sqrt(x * x + z * z);
        if (cityDist < 45) {
            return baseHeight * (cityDist / 45) * 0.2;
        }

        // Military Base at (75, 75)
        const milDist = Math.sqrt((x - 75) * (x - 75) + (z - 75) * (z - 75));
        if (milDist < 40) {
            return baseHeight * (milDist / 40) * 0.2;
        }

        // Warehouse District at (-75, 60)
        const whDist = Math.sqrt((x + 75) * (x + 75) + (z - 60) * (z - 60));
        if (whDist < 40) {
            return baseHeight * (whDist / 40) * 0.2;
        }

        return Math.max(0, baseHeight);
    }

    initTerrain() {
        // High-density Island Terrain Grid
        const size = 420;
        const segments = 90;
        const geo = new THREE.PlaneGeometry(size, size, segments, segments);
        geo.rotateX(-Math.PI / 2);

        const posAttr = geo.attributes.position;
        const colors = [];

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const y = this.getTerrainHeight(x, z);
            posAttr.setY(i, y);

            // Procedural Terrain Vertex Coloring
            const dist = Math.sqrt(x * x + z * z);
            if (y <= 0.2 || dist > 175) {
                // Beach Sand
                colors.push(0.85, 0.78, 0.58);
            } else if (y > 4.5) {
                // Mountain Rock
                colors.push(0.48, 0.49, 0.52);
            } else {
                // Tactical Grass
                // Add subtle road asphalt color along main highway
                const isRoad = (Math.abs(x) < 4 && Math.abs(z) < 140) || (Math.abs(z) < 4 && Math.abs(x) < 140);
                if (isRoad) {
                    colors.push(0.24, 0.25, 0.27); // Asphalt
                } else {
                    colors.push(0.22, 0.42, 0.22); // Lush grass
                }
            }
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.85,
            metalness: 0.1
        });

        this.terrainMesh = new THREE.Mesh(geo, mat);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);

        // Surrounding Ocean Water Plane
        const waterGeo = new THREE.PlaneGeometry(800, 800);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x114466,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });
        const ocean = new THREE.Mesh(waterGeo, waterMat);
        ocean.position.y = -0.3;
        this.scene.add(ocean);
    }

    addCollider(mesh, type = 'solid') {
        const box = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({ box, type, mesh });
    }

    initLandmarks() {
        const mf = window.modelFactory;

        // ---------------------------------------------------
        // 1. CENTRAL CITY (Apex Plaza)
        // ---------------------------------------------------
        const housePositions = [
            { x: -22, z: -20, rot: 0 },
            { x: 22, z: -20, rot: Math.PI },
            { x: -22, z: 22, rot: Math.PI / 2 },
            { x: 22, z: 22, rot: -Math.PI / 2 }
        ];

        housePositions.forEach((pos, idx) => {
            const house = mf.createTacticalHouse();
            house.position.set(pos.x, this.getTerrainHeight(pos.x, pos.z), pos.z);
            house.rotation.y = pos.rot;
            this.scene.add(house);
            this.addCollider(house, 'building');
        });

        // City Center Monument & Cover Barricades
        const monument = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2.0, 5, 8),
            new THREE.MeshStandardMaterial({ color: 0x33363b, roughness: 0.5 })
        );
        monument.position.set(0, 2.5, 0);
        this.scene.add(monument);
        this.addCollider(monument, 'cover');

        // Concrete Barricades on cross roads
        [-10, 10].forEach(x => {
            const barrier = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1.2, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x707378, roughness: 0.9 })
            );
            barrier.position.set(x, 0.6, 8);
            this.scene.add(barrier);
            this.addCollider(barrier, 'cover');
        });

        // ---------------------------------------------------
        // 2. MILITARY OUTPOST (Camp Titan) at (75, 75)
        // ---------------------------------------------------
        const campX = 75;
        const campZ = 75;

        // 2 Watchtowers
        const tower1 = mf.createWatchtower();
        tower1.position.set(campX - 16, this.getTerrainHeight(campX - 16, campZ - 16), campZ - 16);
        this.scene.add(tower1);
        this.addCollider(tower1, 'tower');

        const tower2 = mf.createWatchtower();
        tower2.position.set(campX + 16, this.getTerrainHeight(campX + 16, campZ + 16), campZ + 16);
        this.scene.add(tower2);
        this.addCollider(tower2, 'tower');

        // Perimeter Shipping Containers
        const containerColors = [0x2e5077, 0x8b263e, 0x3b6e47, 0x47494e];
        const containerOffsets = [
            { x: -14, z: 0, rot: 0, col: containerColors[0] },
            { x: 14, z: 0, rot: 0, col: containerColors[1] },
            { x: 0, z: -14, rot: Math.PI / 2, col: containerColors[2] },
            { x: 0, z: 14, rot: Math.PI / 2, col: containerColors[3] }
        ];

        containerOffsets.forEach(co => {
            const cont = mf.createShippingContainer(co.col);
            const cx = campX + co.x;
            const cz = campZ + co.z;
            cont.position.set(cx, this.getTerrainHeight(cx, cz) + 1.6, cz);
            cont.rotation.y = co.rot;
            this.scene.add(cont);
            this.addCollider(cont, 'container');
        });

        // Sandbag Bunkers
        const bunker = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1.2, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x6e6353, roughness: 0.95 })
        );
        bunker.position.set(campX, this.getTerrainHeight(campX, campZ) + 0.6, campZ);
        this.scene.add(bunker);
        this.addCollider(bunker, 'cover');

        // ---------------------------------------------------
        // 3. INDUSTRIAL WAREHOUSE DISTRICT (Omega Bay) at (-75, 60)
        // ---------------------------------------------------
        const whX = -75;
        const whZ = 60;

        const warehouse1 = mf.createWarehouse();
        warehouse1.position.set(whX - 18, this.getTerrainHeight(whX - 18, whZ), whZ);
        this.scene.add(warehouse1);
        this.addCollider(warehouse1, 'warehouse');

        const warehouse2 = mf.createWarehouse();
        warehouse2.position.set(whX + 18, this.getTerrainHeight(whX + 18, whZ), whZ);
        this.scene.add(warehouse2);
        this.addCollider(warehouse2, 'warehouse');

        // ---------------------------------------------------
        // 4. COASTAL RUINS (Sunset Ridge) at (60, -70)
        // ---------------------------------------------------
        const ruinX = 60;
        const ruinZ = -70;

        const ruinHouse = mf.createTacticalHouse();
        ruinHouse.position.set(ruinX, this.getTerrainHeight(ruinX, ruinZ), ruinZ);
        ruinHouse.rotation.y = 0.6;
        this.scene.add(ruinHouse);
        this.addCollider(ruinHouse, 'building');
    }

    initNatureAndProps() {
        const mf = window.modelFactory;

        // Spread trees across the island outside buildings
        for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 140;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // Check if too close to main POIs
            if (Math.abs(x) < 35 && Math.abs(z) < 35) continue; // Skip City
            if (Math.hypot(x - 75, z - 75) < 30) continue; // Skip Military
            if (Math.hypot(x + 75, z - 60) < 35) continue; // Skip Warehouse

            const y = this.getTerrainHeight(x, z);
            if (y > 0.4) {
                const tree = mf.createPineTree();
                tree.position.set(x, y, z);
                const scale = 0.8 + Math.random() * 0.5;
                tree.scale.set(scale, scale, scale);
                this.scene.add(tree);

                // Add collider for tree trunk
                const trunkBox = new THREE.Box3(
                    new THREE.Vector3(x - 0.5, y, z - 0.5),
                    new THREE.Vector3(x + 0.5, y + 6, z + 0.5)
                );
                this.colliders.push({ box: trunkBox, type: 'tree' });
            }
        }

        // Spread granite boulders for tactical combat cover
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 145;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const y = this.getTerrainHeight(x, z);
            if (y > 0.3) {
                const rock = mf.createBoulder();
                rock.position.set(x, y + 0.6, z);
                this.scene.add(rock);
                this.addCollider(rock, 'rock');
            }
        }
    }

    // ---------------------------------------------------
    // LOOT SPAWN SYSTEM
    // ---------------------------------------------------
    initLootSpawns() {
        // High-density loot points at City, Military Base, Warehouses, and Field Crates
        const lootLocations = [
            // City
            { x: 0, z: 0, type: 'rifle', ammo: 90 },
            { x: -20, z: -18, type: 'sniper', ammo: 15 },
            { x: 20, z: -18, type: 'shotgun', ammo: 24 },
            { x: -20, z: 24, type: 'medkit', count: 2 },
            { x: 20, z: 24, type: 'armor', level: 3 },
            { x: 8, z: -5, type: 'grenade', count: 2 },
            { x: -8, z: 5, type: 'pistol', ammo: 28 },

            // Military Base
            { x: 75, z: 75, type: 'sniper', ammo: 20 },
            { x: 60, z: 60, type: 'rifle', ammo: 120 },
            { x: 90, z: 90, type: 'armor', level: 3 },
            { x: 75, z: 60, type: 'medkit', count: 2 },
            { x: 60, z: 90, type: 'grenade', count: 3 },

            // Warehouse District
            { x: -75, z: 60, type: 'rifle', ammo: 90 },
            { x: -93, z: 60, type: 'shotgun', ammo: 32 },
            { x: -57, z: 60, type: 'armor', level: 2 },
            { x: -75, z: 45, type: 'medkit', count: 2 },

            // Coastal Ruins
            { x: 60, z: -70, type: 'rifle', ammo: 60 },
            { x: 55, z: -65, type: 'medkit', count: 1 },
            { x: 65, z: -75, type: 'armor', level: 2 },

            // Wilderness supply caches
            { x: -40, z: -50, type: 'shotgun', ammo: 16 },
            { x: 45, z: 20, type: 'medkit', count: 2 },
            { x: -45, z: 10, type: 'rifle', ammo: 60 },
            { x: 25, z: -35, type: 'grenade', count: 2 },
            { x: -20, z: 85, type: 'sniper', ammo: 15 }
        ];

        lootLocations.forEach(loc => {
            this.spawnLootItem(loc);
        });
    }

    // Spawn 3D glowing loot pickup
    spawnLootItem(lootData) {
        const x = lootData.x;
        const z = lootData.z;
        const y = this.getTerrainHeight(x, z) + 0.5;

        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Vertical Glowing Light Beacon
        const beaconGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 6);
        const beaconColor = (lootData.type === 'sniper' || lootData.level === 3) ? 0xffaa00 :
                            (lootData.type === 'rifle' || lootData.type === 'armor') ? 0x00f0ff : 0x22ff66;
        const beaconMat = new THREE.MeshBasicMaterial({
            color: beaconColor,
            transparent: true,
            opacity: 0.45
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 3;
        group.add(beacon);

        // Rotating 3D Model
        let itemMesh = null;
        if (['rifle', 'sniper', 'shotgun', 'pistol', 'grenade'].includes(lootData.type)) {
            itemMesh = window.modelFactory.createWeaponModel(lootData.type);
            itemMesh.scale.set(1.2, 1.2, 1.2);
            itemMesh.position.y = 0.5;
        } else if (lootData.type === 'medkit') {
            // First Aid Kit Bag
            const medGeo = new THREE.BoxGeometry(0.6, 0.45, 0.35);
            const medMat = new THREE.MeshStandardMaterial({ color: 0xee2233 });
            itemMesh = new THREE.Mesh(medGeo, medMat);
            // White cross
            const crossGeo = new THREE.BoxGeometry(0.12, 0.3, 0.37);
            const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            itemMesh.add(new THREE.Mesh(crossGeo, crossMat));
            const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.37), crossMat);
            itemMesh.add(crossH);
            itemMesh.position.y = 0.4;
        } else if (lootData.type === 'armor') {
            // Armor Vest Plate
            const armorGeo = new THREE.BoxGeometry(0.6, 0.7, 0.25);
            const armorMat = new THREE.MeshStandardMaterial({
                color: lootData.level === 3 ? 0xffaa00 : 0x3366aa,
                metalness: 0.7,
                roughness: 0.3
            });
            itemMesh = new THREE.Mesh(armorGeo, armorMat);
            itemMesh.position.y = 0.5;
        }

        if (itemMesh) group.add(itemMesh);
        this.scene.add(group);

        const lootEntry = {
            id: `loot_${Math.random().toString(36).substr(2, 6)}`,
            data: lootData,
            group,
            itemMesh,
            pos: new THREE.Vector3(x, y, z),
            alive: true
        };

        this.lootItems.push(lootEntry);
        return lootEntry;
    }

    // Spawn an Air Drop falling from sky
    spawnSupplyDrop(x, z) {
        const mf = window.modelFactory;
        const drop = mf.createSupplyDrop();
        drop.position.set(x, 120, z); // Start high in sky
        this.scene.add(drop);

        const targetY = this.getTerrainHeight(x, z);

        this.airDrops.push({
            mesh: drop,
            targetY,
            speed: 12,
            hasLanded: false,
            lootSpawned: false
        });
    }

    // Update loot spinning and airdrop descent
    update(delta) {
        const time = performance.now() * 0.002;

        // Spin and bob loot items
        for (let i = this.lootItems.length - 1; i >= 0; i--) {
            const item = this.lootItems[i];
            if (!item.alive) {
                this.scene.remove(item.group);
                this.lootItems.splice(i, 1);
                continue;
            }
            if (item.itemMesh) {
                item.itemMesh.rotation.y = time * 2;
                item.itemMesh.position.y = 0.45 + Math.sin(time * 3) * 0.08;
            }
        }

        // Descend Air Drops
        for (let drop of this.airDrops) {
            if (!drop.hasLanded) {
                drop.mesh.position.y -= drop.speed * delta;
                if (drop.mesh.position.y <= drop.targetY) {
                    drop.mesh.position.y = drop.targetY;
                    drop.hasLanded = true;
                    // Spawn legendary loot
                    this.spawnLootItem({ x: drop.mesh.position.x - 1, z: drop.mesh.position.z, type: 'sniper', ammo: 25 });
                    this.spawnLootItem({ x: drop.mesh.position.x + 1, z: drop.mesh.position.z, type: 'armor', level: 3 });
                    this.spawnLootItem({ x: drop.mesh.position.x, z: drop.mesh.position.z + 1.2, type: 'medkit', count: 3 });
                }
            }
        }
    }
}

window.IslandMap = IslandMap;
