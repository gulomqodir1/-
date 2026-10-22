// Player Controller: Autobot Commando (Robot FPS Mode <-> Cyber Vehicle Mode)

class PlayerController {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;

        // Mode: 'ROBOT' (FPS) or 'VEHICLE' (TPS)
        this.mode = 'ROBOT';
        this.isTransforming = false;

        // Player Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxArmor = 100;
        this.armor = 100;
        this.isDead = false;
        this.kills = 0;
        this.score = 0;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1.8, 55);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.moveSpeed = 16.0;
        this.carSpeed = 0;
        this.maxCarSpeed = 42.0;
        this.carAcceleration = 36.0;
        this.carHandling = 2.6;
        this.carHeading = 0;
        this.isGrounded = true;
        this.jumpForce = 12.0;
        this.gravity = 30.0;

        // Camera Look (Euler pitch & yaw)
        this.pitch = 0;
        this.yaw = Math.PI;
        this.mouseSensitivity = 0.0022;
        this.isPointerLocked = false;
        this.isScoped = false;

        // Weapons
        this.weapons = [
            {
                name: 'CYBER-RIFLE (M4-NEON)',
                type: 'rifle',
                mag: 30,
                maxMag: 30,
                reserve: 120,
                damage: 34,
                headshotMult: 2.8,
                fireRate: 0.11,
                lastFired: 0,
                spread: 0.015,
                recoil: 0.035,
                reloadTime: 1.6,
                isReloading: false
            },
            {
                name: 'PLASMA-AWP (SNIPER)',
                type: 'sniper',
                mag: 10,
                maxMag: 10,
                reserve: 30,
                damage: 130,
                headshotMult: 3.0,
                fireRate: 1.15,
                lastFired: 0,
                spread: 0.001,
                recoil: 0.12,
                reloadTime: 2.4,
                isReloading: false
            },
            {
                name: 'ENERGON-BLADE',
                type: 'knife',
                mag: 1,
                maxMag: 1,
                reserve: 1,
                damage: 85,
                headshotMult: 1.5,
                fireRate: 0.45,
                lastFired: 0,
                spread: 0,
                recoil: 0,
                reloadTime: 0,
                isReloading: false
            }
        ];
        this.currentWeaponIndex = 0;

        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            fire: false
        };

        // Weapon Viewmodels
        this.fpsGunGroup = new THREE.Group();
        this.weaponMeshes = [];
        this.buildFPSWeapons();
        this.camera.add(this.fpsGunGroup);

        // Vehicle Model
        this.vehicleMesh = this.buildVehicleMesh();
        this.scene.add(this.vehicleMesh);
        this.vehicleMesh.visible = false;

        // Visual bobbing and recoil
        this.bobTime = 0;
        this.gunRecoilZ = 0;
        this.gunRecoilRotX = 0;

        // Nitro
        this.nitro = 100;
        this.maxNitro = 100;
        this.isBoosting = false;

        this.initControls();
    }

    buildFPSWeapons() {
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.85, roughness: 0.25 });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.6, roughness: 0.4 });
        const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const bladeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });

        // --- Weapon 0: Cyber Rifle ---
        const rifleGroup = new THREE.Group();
        const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.8), darkMat);
        rifleGroup.add(rBody);

        const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12), darkMat);
        rBarrel.rotation.x = Math.PI / 2;
        rBarrel.position.set(0, 0.02, -0.65);
        rifleGroup.add(rBarrel);

        const rSight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.2), yellowMat);
        rSight.position.set(0, 0.14, -0.15);
        rifleGroup.add(rSight);

        const rNeon = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 0.65), glowCyanMat);
        rNeon.position.set(0, 0.04, -0.05);
        rifleGroup.add(rNeon);

        const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), yellowMat);
        rMag.position.set(0, -0.18, -0.1);
        rMag.rotation.x = 0.2;
        rifleGroup.add(rMag);

        this.fpsGunGroup.add(rifleGroup);
        this.weaponMeshes.push(rifleGroup);

        // --- Weapon 1: Plasma AWP ---
        const awpGroup = new THREE.Group();
        const aBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 1.1), darkMat);
        awpGroup.add(aBody);

        const aBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 12), yellowMat);
        aBarrel.rotation.x = Math.PI / 2;
        aBarrel.position.set(0, 0.03, -0.95);
        awpGroup.add(aBarrel);

        const aScope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), darkMat);
        aScope.rotation.x = Math.PI / 2;
        aScope.position.set(0, 0.18, -0.2);
        awpGroup.add(aScope);

        this.fpsGunGroup.add(awpGroup);
        awpGroup.visible = false;
        this.weaponMeshes.push(awpGroup);

        // --- Weapon 2: Energon Blade ---
        const knifeGroup = new THREE.Group();
        const kHilt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), darkMat);
        knifeGroup.add(kHilt);

        const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.65), bladeMat);
        kBlade.position.set(0, 0.05, -0.4);
        knifeGroup.add(kBlade);

        this.fpsGunGroup.add(knifeGroup);
        knifeGroup.visible = false;
        this.weaponMeshes.push(knifeGroup);

        // Muzzle Light
        this.muzzleLight = new THREE.PointLight(0x00ffff, 0, 15);
        this.muzzleLight.position.set(0, 0.02, -1.1);
        this.fpsGunGroup.add(this.muzzleLight);

        this.fpsGunDefaultPos = new THREE.Vector3(0.32, -0.26, -0.65);
        this.fpsGunGroup.position.copy(this.fpsGunDefaultPos);
    }

    buildVehicleMesh() {
        const carGroup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0.8, roughness: 0.2 });
        const redArmorMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, metalness: 0.7, roughness: 0.3 });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
        const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const exhaustGlowMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

        // Chassis
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 4.8), bodyMat);
        chassis.position.y = 0.8;
        chassis.castShadow = true;
        carGroup.add(chassis);

        // Cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 2.2), redArmorMat);
        cabin.position.set(0, 1.45, -0.2);
        cabin.castShadow = true;
        carGroup.add(cabin);

        // Bumper
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.8), redArmorMat);
        bumper.position.set(0, 0.7, -2.6);
        bumper.castShadow = true;
        carGroup.add(bumper);

        // Stripes
        const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 4.2), glowCyanMat);
        stripe1.position.set(1.22, 0.8, 0);
        carGroup.add(stripe1);
        const stripe2 = stripe1.clone();
        stripe2.position.x = -1.22;
        carGroup.add(stripe2);

        // Twin Hood Cannons
        const gunGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12);
        gunGeo.rotateX(Math.PI / 2);
        const leftGun = new THREE.Mesh(gunGeo, redArmorMat);
        leftGun.position.set(0.7, 1.15, -1.8);
        carGroup.add(leftGun);

        const rightGun = leftGun.clone();
        rightGun.position.x = -0.7;
        carGroup.add(rightGun);

        // 4 Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        this.wheels = [];
        const wheelPositions = [
            [-1.3, 0.55, -1.6],
            [1.3, 0.55, -1.6],
            [-1.3, 0.55, 1.6],
            [1.3, 0.55, 1.6]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, tireMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            carGroup.add(wheel);
            this.wheels.push(wheel);
        });

        // Twin Thrusters
        const exhaustGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 16);
        exhaustGeo.rotateX(Math.PI / 2);
        this.leftExhaust = new THREE.Mesh(exhaustGeo, exhaustGlowMat);
        this.leftExhaust.position.set(-0.6, 0.75, 2.5);
        carGroup.add(this.leftExhaust);

        this.rightExhaust = new THREE.Mesh(exhaustGeo, exhaustGlowMat);
        this.rightExhaust.position.set(0.6, 0.75, 2.5);
        carGroup.add(this.rightExhaust);

        return carGroup;
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isPointerLocked) return;
            switch (e.code) {
                case 'KeyW': this.keys.forward = true; break;
                case 'KeyS': this.keys.backward = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Space':
                    if (this.mode === 'ROBOT' && this.isGrounded) {
                        this.velocity.y = this.jumpForce;
                        this.isGrounded = false;
                    }
                    this.keys.jump = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.sprint = true;
                    break;
                case 'KeyT':
                case 'KeyE':
                    this.toggleTransformation();
                    break;
                case 'Digit1':
                    this.switchWeapon(0);
                    break;
                case 'Digit2':
                    this.switchWeapon(1);
                    break;
                case 'Digit3':
                    this.switchWeapon(2);
                    break;
                case 'KeyR':
                    this.reload();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.keys.forward = false; break;
                case 'KeyS': this.keys.backward = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
                case 'Space': this.keys.jump = false; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.keys.sprint = false; break;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;
            const sens = this.isScoped ? this.mouseSensitivity * 0.35 : this.mouseSensitivity;
            this.yaw -= e.movementX * sens;
            this.pitch -= e.movementY * sens;

            const maxPitch = Math.PI / 2 - 0.05;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        });

        document.addEventListener('mousedown', (e) => {
            if (!this.isPointerLocked) return;
            if (e.button === 0) {
                this.keys.fire = true;
                this.fire();
            } else if (e.button === 2) {
                e.preventDefault();
                this.toggleScope();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.keys.fire = false;
            }
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    toggleScope() {
        if (this.mode !== 'ROBOT') return;
        const currentWep = this.weapons[this.currentWeaponIndex];
        if (currentWep.type === 'sniper') {
            this.isScoped = !this.isScoped;
            const scopeOverlay = document.getElementById('sniper-scope');
            if (scopeOverlay) {
                scopeOverlay.style.display = this.isScoped ? 'block' : 'none';
            }
            this.camera.fov = this.isScoped ? 25 : 75;
            this.camera.updateProjectionMatrix();
            this.fpsGunGroup.visible = !this.isScoped;
        }
    }

    switchWeapon(index) {
        if (this.mode !== 'ROBOT' || index === this.currentWeaponIndex) return;
        if (this.isScoped) this.toggleScope();

        this.currentWeaponIndex = index;
        this.weaponMeshes.forEach((mesh, idx) => {
            mesh.visible = (idx === index);
        });

        window.soundEngine.playReload();
        this.updateHUDWeapons();
    }

    toggleTransformation() {
        if (this.isTransforming || this.isDead) return;
        this.isTransforming = true;

        if (this.isScoped) this.toggleScope();
        window.soundEngine.playTransform();

        const flash = document.getElementById('transform-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 450);
        }

        setTimeout(() => {
            if (this.mode === 'ROBOT') {
                this.mode = 'VEHICLE';
                this.fpsGunGroup.visible = false;
                this.vehicleMesh.visible = true;
                this.vehicleMesh.position.copy(this.position);
                this.carHeading = this.yaw;
                window.soundEngine.startEngine();
            } else {
                this.mode = 'ROBOT';
                this.fpsGunGroup.visible = true;
                this.vehicleMesh.visible = false;
                window.soundEngine.stopEngine();
            }
            this.isTransforming = false;
            this.updateHUDMode();
        }, 320);
    }

    reload() {
        if (this.mode !== 'ROBOT') return;
        const wep = this.weapons[this.currentWeaponIndex];
        if (wep.type === 'knife' || wep.isReloading || wep.mag === wep.maxMag || wep.reserve <= 0) return;

        wep.isReloading = true;
        window.soundEngine.playReload();

        this.gunRecoilRotX = -0.5;
        this.gunRecoilZ = 0.2;

        setTimeout(() => {
            const needed = wep.maxMag - wep.mag;
            const toAdd = Math.min(needed, wep.reserve);
            wep.mag += toAdd;
            wep.reserve -= toAdd;
            wep.isReloading = false;
            this.updateHUDAmmo();
        }, wep.reloadTime * 1000);
    }

    fire() {
        if (this.isDead || this.isTransforming) return;
        const now = performance.now() / 1000;

        if (this.mode === 'ROBOT') {
            const wep = this.weapons[this.currentWeaponIndex];
            if (wep.isReloading) return;
            if (now - wep.lastFired < wep.fireRate) return;

            if (wep.type !== 'knife' && wep.mag <= 0) {
                this.reload();
                return;
            }

            wep.lastFired = now;
            if (wep.type !== 'knife') wep.mag--;
            this.updateHUDAmmo();

            if (wep.type === 'rifle') window.soundEngine.playRifleShot();
            else if (wep.type === 'sniper') window.soundEngine.playSniperShot();
            else if (wep.type === 'knife') window.soundEngine.playKnifeSlash();

            if (this.muzzleLight && wep.type !== 'knife') {
                this.muzzleLight.intensity = 5;
                setTimeout(() => { if (this.muzzleLight) this.muzzleLight.intensity = 0; }, 40);
            }

            this.gunRecoilZ = wep.type === 'knife' ? -0.2 : 0.15;
            this.gunRecoilRotX = wep.type === 'knife' ? -0.4 : 0.12;
            this.pitch += wep.recoil * (0.8 + Math.random() * 0.4);
            this.yaw += (Math.random() - 0.5) * wep.recoil * 0.6;

            const ch = document.getElementById('crosshair');
            if (ch) {
                ch.classList.add('firing');
                setTimeout(() => ch.classList.remove('firing'), 120);
            }

            this.performRaycastShot(wep);

        } else if (this.mode === 'VEHICLE') {
            if (now - (this.lastCarShot || 0) < 0.12) return;
            this.lastCarShot = now;

            window.soundEngine.playRifleShot();
            this.performVehicleShot();
        }
    }

    performRaycastShot(wep) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * (this.isScoped ? 0.0005 : wep.spread);
        const spreadY = (Math.random() - 0.5) * (this.isScoped ? 0.0005 : wep.spread);

        const screenCenter = new THREE.Vector2(spreadX, spreadY);
        raycaster.setFromCamera(screenCenter, this.camera);

        if (window.gameInstance) {
            window.gameInstance.processBulletHit(raycaster.ray, wep);
        }
    }

    performVehicleShot() {
        const dir = new THREE.Vector3(-Math.sin(this.carHeading), 0, -Math.cos(this.carHeading));
        const leftGunPos = this.position.clone().add(new THREE.Vector3(-0.7, 1.15, -1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carHeading));
        const rightGunPos = this.position.clone().add(new THREE.Vector3(0.7, 1.15, -1.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carHeading));

        const vehicleWep = {
            damage: 42,
            headshotMult: 1.5,
            name: 'CAR-CANNONS',
            type: 'vehicle_cannon'
        };

        const rayL = new THREE.Ray(leftGunPos, dir);
        const rayR = new THREE.Ray(rightGunPos, dir);

        if (window.gameInstance) {
            window.gameInstance.processBulletHit(rayL, vehicleWep);
            window.gameInstance.processBulletHit(rayR, vehicleWep);
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.5);
            this.armor -= absorbed;
            this.health -= (amount - absorbed);
        } else {
            this.health -= amount;
        }

        const hurt = document.getElementById('damage-indicator');
        if (hurt) {
            hurt.style.opacity = '0.85';
            setTimeout(() => { hurt.style.opacity = '0'; }, 220);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        this.updateHUDHealth();
    }

    die() {
        this.isDead = true;
        window.soundEngine.playDefeat();
        window.soundEngine.stopEngine();

        if (this.isScoped) this.toggleScope();

        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
            document.getElementById('final-kills').innerText = this.kills;
            document.getElementById('final-score').innerText = this.score;
        }
        document.exitPointerLock();
    }

    respawn(spawnPos) {
        this.health = this.maxHealth;
        this.armor = this.maxArmor;
        this.isDead = false;
        this.position.copy(spawnPos);
        this.velocity.set(0, 0, 0);
        this.mode = 'ROBOT';
        this.fpsGunGroup.visible = true;
        this.vehicleMesh.visible = false;
        this.weapons[0].mag = this.weapons[0].maxMag;
        this.weapons[0].reserve = 120;
        this.weapons[1].mag = this.weapons[1].maxMag;
        this.weapons[1].reserve = 30;

        this.updateHUDHealth();
        this.updateHUDAmmo();
        this.updateHUDMode();

        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.style.display = 'none';

        const winScreen = document.getElementById('victory-screen');
        if (winScreen) winScreen.style.display = 'none';
    }

    update(delta, map) {
        if (this.isDead) return;

        if (this.keys.fire) {
            const currentWep = this.weapons[this.currentWeaponIndex];
            if (this.mode === 'VEHICLE' || currentWep.type === 'rifle') {
                this.fire();
            }
        }

        if (this.mode === 'ROBOT') {
            this.updateRobotMovement(delta, map);
        } else {
            this.updateVehicleMovement(delta, map);
        }

        this.updateViewmodel(delta);
    }

    updateRobotMovement(delta, map) {
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        let moveDir = new THREE.Vector3();
        if (this.keys.forward) moveDir.add(forward);
        if (this.keys.backward) moveDir.sub(forward);
        if (this.keys.right) moveDir.add(right);
        if (this.keys.left) moveDir.sub(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.bobTime += delta * 12;
        }

        const speed = this.keys.sprint ? this.moveSpeed * 1.5 : this.moveSpeed;
        const targetVelX = moveDir.x * speed;
        const targetVelZ = moveDir.z * speed;

        this.velocity.x += (targetVelX - this.velocity.x) * 15 * delta;
        this.velocity.z += (targetVelZ - this.velocity.z) * 15 * delta;
        this.velocity.y -= this.gravity * delta;

        const nextX = this.position.clone();
        nextX.x += this.velocity.x * delta;
        if (!map.checkCollision(nextX, 0.8)) {
            this.position.x = nextX.x;
        } else {
            this.velocity.x = 0;
        }

        const nextZ = this.position.clone();
        nextZ.z += this.velocity.z * delta;
        if (!map.checkCollision(nextZ, 0.8)) {
            this.position.z = nextZ.z;
        } else {
            this.velocity.z = 0;
        }

        this.position.y += this.velocity.y * delta;
        const groundHeight = 1.8;
        if (this.position.y <= groundHeight) {
            this.position.y = groundHeight;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        this.camera.position.copy(this.position);
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }

    updateVehicleMovement(delta, map) {
        const isAccelerating = this.keys.forward;
        const isBraking = this.keys.backward;
        this.isBoosting = this.keys.sprint && this.nitro > 0;

        let maxSpeed = this.maxCarSpeed;
        if (this.isBoosting) {
            maxSpeed *= 1.6;
            this.nitro = Math.max(0, this.nitro - delta * 35);
            window.soundEngine.playNitro();
        } else {
            this.nitro = Math.min(this.maxNitro, this.nitro + delta * 12);
        }

        if (isAccelerating) {
            this.carSpeed += this.carAcceleration * (this.isBoosting ? 1.8 : 1.0) * delta;
            if (this.carSpeed > maxSpeed) this.carSpeed = maxSpeed;
        } else if (isBraking) {
            this.carSpeed -= this.carAcceleration * 1.5 * delta;
            if (this.carSpeed < -maxSpeed * 0.4) this.carSpeed = -maxSpeed * 0.4;
        } else {
            this.carSpeed *= Math.max(0, 1 - delta * 1.8);
        }

        if (Math.abs(this.carSpeed) > 0.5) {
            const steerDir = this.carSpeed >= 0 ? 1 : -1;
            if (this.keys.left) this.carHeading += this.carHandling * steerDir * delta;
            if (this.keys.right) this.carHeading -= this.carHandling * steerDir * delta;
        }

        const forward = new THREE.Vector3(-Math.sin(this.carHeading), 0, -Math.cos(this.carHeading));
        const moveDist = this.carSpeed * delta;
        const targetPos = this.position.clone().add(forward.clone().multiplyScalar(moveDist));

        if (!map.checkCollision(targetPos, 1.6)) {
            this.position.copy(targetPos);
        } else {
            this.carSpeed = -this.carSpeed * 0.3;
            window.soundEngine.playHitMarker();
        }

        this.position.y = 0.8;
        this.vehicleMesh.position.copy(this.position);
        this.vehicleMesh.rotation.y = this.carHeading;

        this.wheels.forEach(w => {
            w.rotation.x += this.carSpeed * delta * 2;
        });

        const thrusterColor = this.isBoosting ? 0x00f0ff : 0xff5500;
        this.leftExhaust.material.color.setHex(thrusterColor);
        this.rightExhaust.material.color.setHex(thrusterColor);

        const speedRatio = Math.abs(this.carSpeed) / this.maxCarSpeed;
        window.soundEngine.updateEngine(speedRatio, this.isBoosting);

        const camDistance = 8.5;
        const camHeight = 3.6;
        const targetCamPos = new THREE.Vector3(
            this.position.x + Math.sin(this.carHeading) * camDistance,
            this.position.y + camHeight,
            this.position.z + Math.cos(this.carHeading) * camDistance
        );

        this.camera.position.lerp(targetCamPos, 0.18);
        this.camera.lookAt(this.position.x, this.position.y + 1.2, this.position.z);
        this.yaw = this.carHeading;

        const nitroBar = document.getElementById('nitro-bar');
        if (nitroBar) nitroBar.style.width = `${(this.nitro / this.maxNitro) * 100}%`;
    }

    updateViewmodel(delta) {
        if (this.mode !== 'ROBOT') return;

        this.gunRecoilZ = THREE.MathUtils.lerp(this.gunRecoilZ, 0, delta * 14);
        this.gunRecoilRotX = THREE.MathUtils.lerp(this.gunRecoilRotX, 0, delta * 14);

        const bobX = Math.cos(this.bobTime) * 0.015;
        const bobY = Math.abs(Math.sin(this.bobTime)) * 0.015;

        this.fpsGunGroup.position.set(
            this.fpsGunDefaultPos.x + bobX,
            this.fpsGunDefaultPos.y + bobY,
            this.fpsGunDefaultPos.z + this.gunRecoilZ
        );
        this.fpsGunGroup.rotation.x = this.gunRecoilRotX;
    }

    updateHUDHealth() {
        const hpEl = document.getElementById('hud-hp');
        const armEl = document.getElementById('hud-armor');
        const hpBar = document.getElementById('hp-bar');
        if (hpEl) hpEl.innerText = Math.max(0, Math.ceil(this.health));
        if (armEl) armEl.innerText = Math.max(0, Math.ceil(this.armor));
        if (hpBar) hpBar.style.width = `${Math.max(0, this.health)}%`;
    }

    updateHUDAmmo() {
        const wep = this.weapons[this.currentWeaponIndex];
        const ammoEl = document.getElementById('hud-ammo');
        if (ammoEl) {
            if (wep.type === 'knife') {
                ammoEl.innerText = '∞';
            } else {
                ammoEl.innerText = `${wep.mag} / ${wep.reserve}`;
            }
        }
    }

    updateHUDMode() {
        const modeBadge = document.getElementById('mode-badge');
        const nitroContainer = document.getElementById('nitro-container');
        if (modeBadge) {
            if (this.mode === 'ROBOT') {
                modeBadge.innerText = 'MODE: AUTOBOT CS-TROOPER';
                modeBadge.className = 'mode-robot';
            } else {
                modeBadge.innerText = 'MODE: CYBER-CRUISER [CAR]';
                modeBadge.className = 'mode-car';
            }
        }
        if (nitroContainer) {
            nitroContainer.style.display = this.mode === 'VEHICLE' ? 'block' : 'none';
        }
    }

    updateHUDWeapons() {
        this.updateHUDAmmo();
        const wepName = document.getElementById('weapon-name');
        if (wepName) {
            wepName.innerText = this.weapons[this.currentWeaponIndex].name;
        }
    }
}

window.PlayerController = PlayerController;
