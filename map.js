// Map Generator: Cyber-Strike Tactical Arena (CS De_Dust inspired sci-fi facility)

class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.colliders = []; // Array of { box: THREE.Box3, mesh: THREE.Mesh }
        this.barrels = [];   // Exploding barrels
        this.spawnPoints = {
            player: new THREE.Vector3(0, 1.8, 55),
            enemies: [
                new THREE.Vector3(-45, 1.8, -45),
                new THREE.Vector3(45, 1.8, -45),
                new THREE.Vector3(-30, 1.8, -15),
                new THREE.Vector3(30, 1.8, -15),
                new THREE.Vector3(0, 1.8, -50),
                new THREE.Vector3(-50, 1.8, 15),
                new THREE.Vector3(50, 1.8, 15),
                new THREE.Vector3(-20, 1.8, 0),
                new THREE.Vector3(20, 1.8, 0),
                new THREE.Vector3(0, 1.8, -10),
            ]
        };
    }

    createProceduralCanvasTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (type === 'ground') {
            // High-tech CS metal/desert grid
            ctx.fillStyle = '#1c2026';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#2b3442';
            ctx.lineWidth = 4;
            for (let i = 0; i <= 256; i += 32) {
                ctx.beginPath();
                ctx.moveTo(i, 0); ctx.lineTo(i, 256);
                ctx.moveTo(0, i); ctx.lineTo(256, i);
                ctx.stroke();
            }
            // Weathering dots
            ctx.fillStyle = 'rgba(255, 180, 50, 0.08)';
            for (let i = 0; i < 400; i++) {
                ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
            }
        } else if (type === 'crate') {
            // Classic CS crate texture (yellow/wood/metal edge)
            ctx.fillStyle = '#8a623a';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#4a331c';
            ctx.lineWidth = 14;
            ctx.strokeRect(7, 7, 242, 242);
            // Diagonal braces
            ctx.beginPath();
            ctx.moveTo(14, 14); ctx.lineTo(242, 242);
            ctx.moveTo(14, 242); ctx.lineTo(242, 14);
            ctx.stroke();
            // Cyber accent
            ctx.fillStyle = '#00f0ff';
            ctx.font = 'bold 24px monospace';
            ctx.fillText('CYBER-CS', 65, 135);
        } else if (type === 'metal_wall') {
            ctx.fillStyle = '#222831';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#393e46';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 250, 250);
            ctx.fillStyle = '#00adb5';
            ctx.fillRect(20, 20, 216, 6);
            ctx.fillRect(20, 230, 216, 6);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    build() {
        const groundTex = this.createProceduralCanvasTexture('ground');
        groundTex.repeat.set(24, 24);

        const crateTex = this.createProceduralCanvasTexture('crate');
        const wallTex = this.createProceduralCanvasTexture('metal_wall');
        wallTex.repeat.set(4, 2);

        // Materials
        const groundMat = new THREE.MeshStandardMaterial({
            map: groundTex,
            roughness: 0.8,
            metalness: 0.2
        });

        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTex,
            roughness: 0.6,
            metalness: 0.5
        });

        const crateMat = new THREE.MeshStandardMaterial({
            map: crateTex,
            roughness: 0.7,
            metalness: 0.2
        });

        // 1. Ground Plane
        const groundGeo = new THREE.PlaneGeometry(160, 160);
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 2. Outer Boundary Walls (4 walls)
        const wallHeight = 12;
        const mapSize = 150;
        const outerWalls = [
            { x: 0, z: -mapSize / 2, w: mapSize, h: wallHeight, d: 4 }, // North
            { x: 0, z: mapSize / 2, w: mapSize, h: wallHeight, d: 4 },  // South
            { x: -mapSize / 2, z: 0, w: 4, h: wallHeight, d: mapSize }, // West
            { x: mapSize / 2, z: 0, w: 4, h: wallHeight, d: mapSize }   // East
        ];

        outerWalls.forEach(ow => {
            const geo = new THREE.BoxGeometry(ow.w, ow.h, ow.d);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(ow.x, ow.h / 2, ow.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.addCollider(mesh);
        });

        // 3. Interior Walls & Structures (CS Map Layout: Long A, Middle, B Site)
        const structures = [
            // Middle Archway / Divider
            { x: -15, z: 0, w: 30, h: 8, d: 4 },
            { x: 25, z: 0, w: 30, h: 8, d: 4 },

            // Long Alley Corridor (East side)
            { x: 45, z: 20, w: 4, h: 8, d: 50 },
            { x: 60, z: -10, w: 4, h: 8, d: 50 },

            // B-Apartments / Complex (West side)
            { x: -45, z: -20, w: 25, h: 8, d: 4 },
            { x: -55, z: 15, w: 4, h: 8, d: 45 },
            { x: -35, z: 35, w: 20, h: 8, d: 4 },

            // Sniper Nest / Ramp Raised Platform in Center
            { x: 0, z: -25, w: 20, h: 4, d: 14 }
        ];

        structures.forEach(st => {
            const geo = new THREE.BoxGeometry(st.w, st.h, st.d);
            const mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(st.x, st.h / 2, st.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.addCollider(mesh);
        });

        // 4. CS Crates & Cover Formations
        const crateConfigs = [
            // Mid cover
            { x: 5, y: 1.5, z: 15, s: 3 },
            { x: -6, y: 1.5, z: 20, s: 3 },
            { x: -6, y: 4.5, z: 20, s: 3 }, // stacked 2-high
            { x: 0, y: 1.5, z: -12, s: 3 },

            // A-Site defense crates
            { x: 40, y: 1.5, z: -40, s: 3 },
            { x: 43, y: 1.5, z: -40, s: 3 },
            { x: 41.5, y: 4.5, z: -40, s: 3 },
            { x: 32, y: 1.5, z: -45, s: 3 },

            // B-Site cover
            { x: -40, y: 1.5, z: -35, s: 3 },
            { x: -43, y: 1.5, z: -35, s: 3 },
            { x: -40, y: 4.5, z: -35, s: 3 },
            { x: -50, y: 1.5, z: -45, s: 3 },

            // T-Spawn / Alley corners
            { x: -20, y: 1.5, z: 45, s: 3 },
            { x: 20, y: 1.5, z: 45, s: 3 },
            { x: 48, y: 1.5, z: 35, s: 3 },
            { x: -50, y: 1.5, z: 0, s: 3 }
        ];

        crateConfigs.forEach(cr => {
            const geo = new THREE.BoxGeometry(cr.s, cr.s, cr.s);
            const mesh = new THREE.Mesh(geo, crateMat);
            mesh.position.set(cr.x, cr.y, cr.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.addCollider(mesh);
        });

        // 5. Bomb Sites Hologram Beacons (Site A and Site B)
        this.createBombSite(new THREE.Vector3(45, 0.1, -45), 'A', 0x00f0ff);
        this.createBombSite(new THREE.Vector3(-45, 0.1, -45), 'B', 0xff0055);

        // 6. Exploding Energon Barrels
        const barrelPositions = [
            new THREE.Vector3(12, 1.5, 5),
            new THREE.Vector3(-18, 1.5, 12),
            new THREE.Vector3(38, 1.5, -25),
            new THREE.Vector3(-38, 1.5, -25),
            new THREE.Vector3(48, 1.5, 10),
            new THREE.Vector3(-25, 1.5, -45)
        ];

        barrelPositions.forEach(pos => {
            this.createEnergonBarrel(pos);
        });

        // 7. Ambient Lighting & Sun
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffecd0, 0.95);
        sunLight.position.set(60, 90, 40);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 250;
        const d = 80;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        this.scene.add(sunLight);

        // Atmospheric glowing fog
        this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.009);
        this.scene.background = new THREE.Color(0x0a0e17);

        // Cyber Grid Ceiling / Starfield Particles
        this.createSkyParticles();
    }

    createBombSite(pos, label, colorHex) {
        // Glowing cylinder zone
        const ringGeo = new THREE.RingGeometry(4, 5.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos);
        this.scene.add(ring);

        // Vertical glowing energy pillar
        const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 16);
        const pillarMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pos.x, 4, pos.z);
        this.scene.add(pillar);

        // Floating holographic marker text sprite
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = label === 'A' ? '#00f0ff' : '#ff0055';
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[ ${label} ]`, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(pos.x, 9, pos.z);
        sprite.scale.set(6, 6, 1);
        this.scene.add(sprite);
    }

    createEnergonBarrel(pos) {
        const barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0xff1122,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0xaa0011,
            emissiveIntensity: 0.4
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.copy(pos);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        this.scene.add(barrel);

        const barrelData = {
            mesh: barrel,
            box: new THREE.Box3().setFromObject(barrel),
            health: 25,
            exploded: false
        };
        this.barrels.push(barrelData);
        this.colliders.push({ box: barrelData.box, mesh: barrel, isBarrel: true, barrelData });
    }

    createSkyParticles() {
        const particleCount = 400;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 300;
            positions[i + 1] = 20 + Math.random() * 80;
            positions[i + 2] = (Math.random() - 0.5) * 300;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x00e1ff,
            size: 1.2,
            transparent: true,
            opacity: 0.6
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
    }

    addCollider(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({ box, mesh });
    }

    // Check sphere collision against map boxes
    checkCollision(position, radius = 1.0) {
        const playerSphere = new THREE.Sphere(position, radius);
        for (let i = 0; i < this.colliders.length; i++) {
            const col = this.colliders[i];
            if (col.box.intersectsSphere(playerSphere)) {
                return true;
            }
        }
        return false;
    }
}

window.GameMap = GameMap;
