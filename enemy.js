// Decepticon AI Enemy Unit Controller

class EnemyBot {
    constructor(scene, spawnPos, type = 'trooper') {
        this.scene = scene;
        this.type = type;

        if (type === 'heavy') {
            this.maxHealth = 160;
            this.speed = 4.8;
            this.fireCooldown = 1.6;
            this.damage = 18;
            this.color = 0x660088;
            this.name = 'Decepticon Titan';
            this.scale = 1.35;
        } else if (type === 'scout') {
            this.maxHealth = 65;
            this.speed = 10.5;
            this.fireCooldown = 0.55;
            this.damage = 9;
            this.color = 0x882200;
            this.name = 'Decepticon Scout';
            this.scale = 0.9;
        } else {
            this.maxHealth = 85;
            this.speed = 7.0;
            this.fireCooldown = 0.85;
            this.damage = 12;
            this.color = 0x8b0000;
            this.name = 'Decepticon Trooper';
            this.scale = 1.05;
        }

        this.health = this.maxHealth;
        this.position = spawnPos.clone();
        this.isDead = false;
        this.lastShotTime = 0;
        this.state = 'PATROL';

        this.patrolTarget = new THREE.Vector3(
            this.position.x + (Math.random() - 0.5) * 40,
            1.8,
            this.position.z + (Math.random() - 0.5) * 40
        );
        this.patrolTimer = 0;

        // Visual Mesh & Body Hitbox
        this.mesh = this.buildBotMesh();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        this.headMesh = this.mesh.getObjectByName('head');

        this.box = new THREE.Box3();
        this.updateBoundingBox();

        // Health bar overhead sprite
        this.healthSprite = this.createHealthBarSprite();
        this.mesh.add(this.healthSprite);
    }

    buildBotMesh() {
        const root = new THREE.Group();
        this.bodyGroup = new THREE.Group();
        root.add(this.bodyGroup);

        const armorMat = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.85,
            roughness: 0.3
        });
        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x111620,
            metalness: 0.9,
            roughness: 0.4
        });
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

        // Chest
        const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.7), armorMat);
        chest.position.y = 1.7;
        chest.castShadow = true;
        this.bodyGroup.add(chest);

        // Core
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), visorMat);
        core.position.set(0, 1.8, 0.36);
        this.bodyGroup.add(core);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), darkMetalMat);
        head.name = 'head';
        head.position.set(0, 2.7, 0);
        head.castShadow = true;
        this.bodyGroup.add(head);

        // Visor
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.2), visorMat);
        visor.position.set(0, 2.7, 0.3);
        this.bodyGroup.add(visor);

        // Shoulders
        const shoulderGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5);
        const lShoulder = new THREE.Mesh(shoulderGeo, armorMat);
        lShoulder.position.set(-0.85, 2.2, 0);
        this.bodyGroup.add(lShoulder);

        const rShoulder = lShoulder.clone();
        rShoulder.position.x = 0.85;
        this.bodyGroup.add(rShoulder);

        // Arms & Gun
        const armGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);
        const rArm = new THREE.Mesh(armGeo, darkMetalMat);
        rArm.position.set(0.9, 1.5, 0.2);
        rArm.rotation.x = -Math.PI / 4;
        this.bodyGroup.add(rArm);

        const gunGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8);
        gunGeo.rotateX(Math.PI / 2);
        const gun = new THREE.Mesh(gunGeo, darkMetalMat);
        gun.position.set(0.9, 1.3, 0.8);
        this.bodyGroup.add(gun);

        const lArm = new THREE.Mesh(armGeo, darkMetalMat);
        lArm.position.set(-0.9, 1.5, 0);
        this.bodyGroup.add(lArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const lLeg = new THREE.Mesh(legGeo, darkMetalMat);
        lLeg.position.set(-0.4, 0.6, 0);
        lLeg.castShadow = true;
        this.bodyGroup.add(lLeg);

        const rLeg = lLeg.clone();
        rLeg.position.x = 0.4;
        this.bodyGroup.add(rLeg);

        root.scale.set(this.scale, this.scale, this.scale);
        return root;
    }

    createHealthBarSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 16;
        this.healthCanvas = canvas;
        this.healthCtx = canvas.getContext('2d');
        this.drawHealthBar();

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(0, 3.4, 0);
        sprite.scale.set(3, 0.38, 1);
        return sprite;
    }

    drawHealthBar() {
        const ctx = this.healthCtx;
        ctx.clearRect(0, 0, 128, 16);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 128, 16);

        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff66' : healthPercent > 0.25 ? '#ffaa00' : '#ff0033';
        ctx.fillRect(2, 2, (128 - 4) * healthPercent, 12);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 128, 16);

        if (this.healthSprite && this.healthSprite.material.map) {
            this.healthSprite.material.map.needsUpdate = true;
        }
    }

    updateBoundingBox() {
        if (this.bodyGroup) {
            this.box.setFromObject(this.bodyGroup);
        } else {
            this.box.setFromObject(this.mesh);
        }
    }

    takeDamage(amount, isHeadshot = false, sourceWeapon = 'Rifle') {
        if (this.isDead) return;

        this.health -= amount;
        this.drawHealthBar();

        this.mesh.traverse(child => {
            if (child.isMesh && child.material) {
                const origColor = child.material.color.getHex();
                child.material.color.setHex(0xffffff);
                setTimeout(() => {
                    if (child.material) child.material.color.setHex(origColor);
                }, 80);
            }
        });

        if (window.gameInstance) {
            window.gameInstance.spawnSparks(this.position.clone().add(new THREE.Vector3(0, 1.8, 0)));
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die(isHeadshot, sourceWeapon);
        }
    }

    die(isHeadshot, sourceWeapon) {
        if (this.isDead) return;
        this.isDead = true;

        window.soundEngine.playExplosion();

        if (window.gameInstance) {
            window.gameInstance.spawnExplosion(this.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
            window.gameInstance.onEnemyKilled(this, isHeadshot, sourceWeapon);
        }

        this.scene.remove(this.mesh);
    }

    update(delta, player, map) {
        if (this.isDead) return;

        const distToPlayer = this.position.distanceTo(player.position);
        const lookPos = player.position.clone();
        lookPos.y = this.position.y;

        if (distToPlayer < 65) {
            this.state = 'ATTACK';
            this.mesh.lookAt(lookPos);

            if (distToPlayer > 12) {
                const dir = player.position.clone().sub(this.position).normalize();
                const nextPos = this.position.clone().add(dir.multiplyScalar(this.speed * delta));
                if (!map.checkCollision(nextPos, 1.0)) {
                    this.position.copy(nextPos);
                }
            }

            const now = performance.now() / 1000;
            if (now - this.lastShotTime > this.fireCooldown) {
                this.lastShotTime = now;
                this.shootAtPlayer(player);
            }

        } else {
            this.state = 'PATROL';
            this.patrolTimer += delta;
            if (this.patrolTimer > 6 || this.position.distanceTo(this.patrolTarget) < 3) {
                this.patrolTimer = 0;
                this.patrolTarget.set(
                    this.position.x + (Math.random() - 0.5) * 35,
                    1.8,
                    this.position.z + (Math.random() - 0.5) * 35
                );
            }

            const patrolLook = this.patrolTarget.clone();
            patrolLook.y = this.position.y;
            this.mesh.lookAt(patrolLook);

            const dir = this.patrolTarget.clone().sub(this.position).normalize();
            const nextPos = this.position.clone().add(dir.multiplyScalar(this.speed * 0.5 * delta));
            if (!map.checkCollision(nextPos, 1.0)) {
                this.position.copy(nextPos);
            }
        }

        this.mesh.position.copy(this.position);
        this.updateBoundingBox();

        // Car Ramming detection
        if (player.mode === 'VEHICLE' && Math.abs(player.carSpeed) > 14) {
            const carDist = player.position.distanceTo(this.position);
            if (carDist < 3.2) {
                const ramDamage = Math.floor(Math.abs(player.carSpeed) * 3.5);
                this.takeDamage(ramDamage, false, 'CYBER-RAM');
                const knockDir = this.position.clone().sub(player.position).normalize();
                this.position.add(knockDir.multiplyScalar(6));
                window.soundEngine.playHitMarker();
            }
        }
    }

    shootAtPlayer(player) {
        const start = this.position.clone().add(new THREE.Vector3(0.9, 1.5, 0.8));
        const target = player.position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.0,
            (Math.random() - 0.5) * 1.5
        ));

        if (window.gameInstance) {
            window.gameInstance.spawnLaserTracer(start, target, 0xff0033);
        }

        const dist = start.distanceTo(player.position);
        const hitChance = Math.max(0.2, 0.75 - dist * 0.012);

        if (Math.random() < hitChance) {
            player.takeDamage(this.damage);
        }
    }
}

window.EnemyBot = EnemyBot;
