// Main Game Orchestrator: CYBER-STRIKE: TRANSFORMERS 3D

class CyberStrikeGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Core Objects
        this.map = new GameMap(this.scene);
        this.player = new PlayerController(this.scene, this.camera, this.renderer.domElement);
        this.enemies = [];

        // Particles & Tracers
        this.tracers = [];
        this.particles = [];

        // Game State
        this.wave = 1;
        this.maxWaves = 3;
        this.score = 0;
        this.money = 800;
        this.isPaused = true;
        this.roundTime = 120;

        // Minimap Radar Canvas
        this.radarCanvas = document.getElementById('radar-canvas');
        if (this.radarCanvas) {
            this.radarCtx = this.radarCanvas.getContext('2d');
        }

        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        this.map.build();
        this.spawnWave(this.wave);
        this.setupEventListeners();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    spawnWave(waveNum) {
        this.enemies.forEach(e => {
            if (e.mesh) this.scene.remove(e.mesh);
        });
        this.enemies = [];

        const botCount = 4 + waveNum * 3;
        const spawns = this.map.spawnPoints.enemies;

        for (let i = 0; i < botCount; i++) {
            const spawnPos = spawns[i % spawns.length].clone();
            spawnPos.x += (Math.random() - 0.5) * 8;
            spawnPos.z += (Math.random() - 0.5) * 8;

            let type = 'trooper';
            if (i % 3 === 1) type = 'scout';
            if (i % 4 === 2) type = 'heavy';

            const bot = new EnemyBot(this.scene, spawnPos, type);
            this.enemies.push(bot);
        }

        this.roundTime = 120;
        window.soundEngine.playRoundStart();
        this.updateWaveHUD();
        this.addKillFeedEntry('SYSTEM', `WAVE ${waveNum}: DECEPTICONS DETECTED!`, '#00f0ff');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const startModal = document.getElementById('start-screen');
        const playBtn = document.getElementById('btn-play');

        const requestLock = () => {
            this.renderer.domElement.requestPointerLock();
            window.soundEngine.ensureContext();
        };

        if (playBtn) playBtn.addEventListener('click', requestLock);
        this.container.addEventListener('click', () => {
            if (!this.player.isPointerLocked && !this.player.isDead) {
                requestLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.renderer.domElement) {
                this.player.isPointerLocked = true;
                this.isPaused = false;
                if (startModal) startModal.style.display = 'none';
            } else {
                this.player.isPointerLocked = false;
                if (!this.player.isDead && startModal) {
                    startModal.style.display = 'flex';
                }
            }
        });

        const restartBtn = document.getElementById('btn-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        const winRestartBtn = document.getElementById('btn-win-restart');
        if (winRestartBtn) {
            winRestartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault();
                const scoreboard = document.getElementById('scoreboard-overlay');
                if (scoreboard) scoreboard.style.display = 'flex';
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Tab') {
                const scoreboard = document.getElementById('scoreboard-overlay');
                if (scoreboard) scoreboard.style.display = 'none';
            }
        });
    }

    restartGame() {
        this.wave = 1;
        this.score = 0;
        this.player.kills = 0;
        this.player.score = 0;
        this.player.respawn(this.map.spawnPoints.player);
        this.spawnWave(this.wave);
        this.renderer.domElement.requestPointerLock();
    }

    processBulletHit(ray, weapon) {
        let closestDist = weapon.type === 'knife' ? 3.8 : 250;
        let closestPoint = null;
        let hitType = 'none'; // 'bot', 'barrel', 'wall'
        let targetEntity = null;
        let isHeadshot = false;

        // 1. Check Enemies
        for (let bot of this.enemies) {
            if (bot.isDead) continue;

            // Headshot
            if (bot.headMesh) {
                const headBox = new THREE.Box3().setFromObject(bot.headMesh);
                const headHit = ray.intersectBox(headBox, new THREE.Vector3());
                if (headHit) {
                    const dist = ray.origin.distanceTo(headHit);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPoint = headHit;
                        hitType = 'bot';
                        targetEntity = bot;
                        isHeadshot = true;
                    }
                }
            }

            // Body
            const bodyHit = ray.intersectBox(bot.box, new THREE.Vector3());
            if (bodyHit) {
                const dist = ray.origin.distanceTo(bodyHit);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = bodyHit;
                    hitType = 'bot';
                    targetEntity = bot;
                    isHeadshot = false;
                }
            }
        }

        // 2. Check Barrels
        for (let barrel of this.map.barrels) {
            if (barrel.exploded) continue;
            const bHit = ray.intersectBox(barrel.box, new THREE.Vector3());
            if (bHit) {
                const dist = ray.origin.distanceTo(bHit);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = bHit;
                    hitType = 'barrel';
                    targetEntity = barrel;
                    isHeadshot = false;
                }
            }
        }

        // 3. Check Walls/Map
        for (let col of this.map.colliders) {
            const wHit = ray.intersectBox(col.box, new THREE.Vector3());
            if (wHit) {
                const dist = ray.origin.distanceTo(wHit);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = wHit;
                    hitType = 'wall';
                    targetEntity = null;
                    isHeadshot = false;
                }
            }
        }

        // Visual tracer (unless knife)
        if (weapon.type !== 'knife') {
            const tracerEnd = closestPoint || ray.origin.clone().add(ray.direction.clone().multiplyScalar(100));
            this.spawnLaserTracer(ray.origin, tracerEnd, weapon.type === 'vehicle_cannon' ? 0xff5500 : 0x00f0ff);
        }

        // Apply hit effects
        if (hitType === 'bot' && targetEntity) {
            let dmg = weapon.damage;
            if (isHeadshot) {
                dmg *= weapon.headshotMult;
                window.soundEngine.playHeadshot();
                this.showHitmarker(true);
            } else {
                window.soundEngine.playHitMarker();
                this.showHitmarker(false);
            }
            targetEntity.takeDamage(dmg, isHeadshot, weapon.name || weapon.type);

        } else if (hitType === 'barrel' && targetEntity) {
            targetEntity.health -= weapon.damage;
            window.soundEngine.playHitMarker();
            if (targetEntity.health <= 0) {
                this.explodeBarrel(targetEntity);
            }
        } else if (hitType === 'wall' && closestPoint) {
            this.spawnSparks(closestPoint);
        }
    }

    explodeBarrel(barrel) {
        if (barrel.exploded) return;
        barrel.exploded = true;
        this.scene.remove(barrel.mesh);
        window.soundEngine.playExplosion();

        const barrelPos = barrel.mesh.position;
        this.spawnExplosion(barrelPos, 1.8);

        const blastRadius = 14;
        this.enemies.forEach(bot => {
            if (bot.isDead) return;
            const dist = bot.position.distanceTo(barrelPos);
            if (dist < blastRadius) {
                const dmg = Math.floor((1 - dist / blastRadius) * 160);
                bot.takeDamage(dmg, false, 'BARREL EXPLOSION');
            }
        });

        const playerDist = this.player.position.distanceTo(barrelPos);
        if (playerDist < blastRadius) {
            const pDmg = Math.floor((1 - playerDist / blastRadius) * 80);
            this.player.takeDamage(pDmg);
        }
    }

    onEnemyKilled(bot, isHeadshot, weaponName) {
        this.player.kills++;
        this.score += isHeadshot ? 500 : 300;
        this.money += isHeadshot ? 600 : 300;
        this.player.score = this.score;

        const killMsg = isHeadshot ? `Player [${weaponName} 🎯 HEADSHOT] ${bot.name}` : `Player [${weaponName}] ${bot.name}`;
        this.addKillFeedEntry('AUTOBOT', killMsg, isHeadshot ? '#ff0055' : '#00f0ff');

        this.updateWaveHUD();
        this.updateScoreboard();

        const aliveCount = this.enemies.filter(e => !e.isDead).length;
        if (aliveCount === 0) {
            this.onWaveCleared();
        }
    }

    onWaveCleared() {
        if (this.wave < this.maxWaves) {
            this.wave++;
            window.soundEngine.playVictory();
            this.addKillFeedEntry('SYSTEM', `WAVE ${this.wave - 1} CLEARED! INCOMING WAVE ${this.wave}...`, '#ffaa00');
            setTimeout(() => {
                this.spawnWave(this.wave);
            }, 3000);
        } else {
            window.soundEngine.playVictory();
            const winScreen = document.getElementById('victory-screen');
            if (winScreen) {
                winScreen.style.display = 'flex';
                document.getElementById('win-score').innerText = this.score;
                document.getElementById('win-kills').innerText = this.player.kills;
            }
            document.exitPointerLock();
        }
    }

    showHitmarker(isHeadshot) {
        const hm = document.getElementById('hitmarker');
        if (hm) {
            hm.style.borderColor = isHeadshot ? '#ff0033' : '#00f0ff';
            hm.style.opacity = '1';
            setTimeout(() => { hm.style.opacity = '0'; }, 90);
        }
    }

    addKillFeedEntry(killer, message, color) {
        const feed = document.getElementById('kill-feed');
        if (!feed) return;

        const item = document.createElement('div');
        item.className = 'kill-item';
        item.style.borderLeft = `3px solid ${color}`;
        item.innerText = message;
        feed.appendChild(item);

        setTimeout(() => {
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 400);
        }, 3500);
    }

    spawnLaserTracer(start, end, colorHex) {
        const points = [start, end];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: colorHex,
            linewidth: 3,
            transparent: true,
            opacity: 1.0
        });
        const line = new THREE.Line(geo, mat);
        this.scene.add(line);

        this.tracers.push({
            mesh: line,
            life: 0.08,
            maxLife: 0.08
        });
    }

    spawnSparks(position) {
        const sparkCount = 14;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const velocities = [];

        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 12
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffbb33,
            size: 0.45,
            transparent: true,
            opacity: 1
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particles.push({
            mesh: points,
            velocities,
            positions,
            life: 0.35,
            maxLife: 0.35,
            type: 'sparks'
        });
    }

    spawnExplosion(position, scale = 1.0) {
        const flashLight = new THREE.PointLight(0xff6600, 10 * scale, 30 * scale);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        setTimeout(() => this.scene.remove(flashLight), 120);

        const count = 30;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 20 * scale,
                Math.random() * 15 * scale + 4,
                (Math.random() - 0.5) * 20 * scale
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xff3300,
            size: 1.2 * scale,
            transparent: true,
            opacity: 1
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particles.push({
            mesh: points,
            velocities,
            positions,
            life: 0.65,
            maxLife: 0.65,
            type: 'explosion'
        });
    }

    updateTracers(delta) {
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const tr = this.tracers[i];
            tr.life -= delta;
            tr.mesh.material.opacity = tr.life / tr.maxLife;
            if (tr.life <= 0) {
                this.scene.remove(tr.mesh);
                this.tracers.splice(i, 1);
            }
        }
    }

    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            const posAttr = p.mesh.geometry.attributes.position;
            const positions = p.positions;

            for (let j = 0; j < p.velocities.length; j++) {
                const vel = p.velocities[j];
                vel.y -= 25 * delta;

                positions[j * 3] += vel.x * delta;
                positions[j * 3 + 1] += vel.y * delta;
                positions[j * 3 + 2] += vel.z * delta;
            }

            posAttr.needsUpdate = true;
            p.mesh.material.opacity = p.life / p.maxLife;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    updateMinimapRadar() {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const size = 160;
        const center = size / 2;
        const mapScale = size / 160;

        ctx.clearRect(0, 0, size, size);

        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, center - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8, 14, 24, 0.85)';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, center * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.stroke();

        const aX = center + 45 * mapScale;
        const aZ = center + -45 * mapScale;
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('A', aX - 3, aZ + 3);

        const bX = center + -45 * mapScale;
        const bZ = center + -45 * mapScale;
        ctx.fillStyle = '#ff0055';
        ctx.fillText('B', bX - 3, bZ + 3);

        ctx.fillStyle = '#ff0033';
        this.enemies.forEach(bot => {
            if (bot.isDead) return;
            const bRadarX = center + bot.position.x * mapScale;
            const bRadarZ = center + bot.position.z * mapScale;
            ctx.beginPath();
            ctx.arc(bRadarX, bRadarZ, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        const pRadarX = center + this.player.position.x * mapScale;
        const pRadarZ = center + this.player.position.z * mapScale;
        const heading = this.player.mode === 'ROBOT' ? this.player.yaw : this.player.carHeading;

        ctx.save();
        ctx.translate(pRadarX, pRadarZ);
        ctx.rotate(-heading);

        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fillStyle = '#00ff66';
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    updateWaveHUD() {
        const waveEl = document.getElementById('hud-wave');
        const remainingEl = document.getElementById('hud-remaining');
        const moneyEl = document.getElementById('hud-money');

        const remaining = this.enemies.filter(e => !e.isDead).length;
        if (waveEl) waveEl.innerText = `WAVE ${this.wave} / ${this.maxWaves}`;
        if (remainingEl) remainingEl.innerText = `ENEMIES: ${remaining}`;
        if (moneyEl) moneyEl.innerText = `$${this.money}`;
    }

    updateScoreboard() {
        const pKills = document.getElementById('score-player-kills');
        const pScore = document.getElementById('score-player-points');
        if (pKills) pKills.innerText = this.player.kills;
        if (pScore) pScore.innerText = this.score;
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (!this.isPaused && !this.player.isDead) {
            this.roundTime -= delta;
            if (this.roundTime <= 0) {
                this.roundTime = 0;
                this.player.takeDamage(999);
            }
            const timerEl = document.getElementById('round-timer');
            if (timerEl) {
                const mins = Math.floor(this.roundTime / 60);
                const secs = Math.floor(this.roundTime % 60).toString().padStart(2, '0');
                timerEl.innerText = `${mins}:${secs}`;
            }

            this.player.update(delta, this.map);

            this.enemies.forEach(bot => {
                bot.update(delta, this.player, this.map);
            });

            this.updateTracers(delta);
            this.updateParticles(delta);
            this.updateMinimapRadar();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new CyberStrikeGame();
});
