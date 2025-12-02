const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const Colors = {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    RED: '#DC3232',
    GREEN: '#32C850',
    BLUE: '#4682DC',
    YELLOW: '#FFD700',
    DARK_GREEN: '#228B22',
    PURPLE: '#8A2BE2',
    ORANGE: '#FF8C00',
    DARK_RED: '#8B0000',
    GRAY: '#808080',
    LIGHT_GRAY: '#C8C8C8',
    DARK_GRAY: '#323232',
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF'
};
const WeaponType = {
    SWORD: 'SWORD',
    BOW: 'BOW',
    STAFF: 'STAFF',
    HAMMER: 'HAMMER',
    DUAL_BLADES: 'DUAL_BLADES'
};
const EnemyType = {
    GRUNT: 'GRUNT',
    ARCHER: 'ARCHER',
    TANK: 'TANK',
    BOSS: 'BOSS'
};
class Weapon {
    constructor(name, weaponType, damage, range, attackSpeed, color) {
        this.name = name;
        this.weaponType = weaponType;
        this.damage = damage;
        this.range = range;
        this.attackSpeed = attackSpeed;
        this.color = color;
    }
    getDisplayName() {
        return this.name;
    }
}
class Particle {
    constructor(x, y, color, velocityX, velocityY, lifetime) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.size = Math.random() * 3 + 2; // Random size between 2-5
    }
    update(dt) {
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.lifetime -= dt;
        this.velocityY += 200 * dt;
    }
    draw(cameraX, cameraY) {
        const alpha = this.lifetime / this.maxLifetime;
        const size = Math.floor(this.size * alpha);
        if (size > 0) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x - cameraX, this.y - cameraY, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    isDead() {
        return this.lifetime <= 0;
    }
}
class Projectile {
    constructor(x, y, targetX, targetY, damage, speed, color, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.isPlayer = isPlayer;
        this.radius = 5;
        this.lifetime = 3.0;
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            this.velocityX = (dx / distance) * speed;
            this.velocityY = (dy / distance) * speed;
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }
    update(dt) {
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.lifetime -= dt;
    }
    draw(cameraX, cameraY) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
            const offset = (i + 1) * 5;
            const trailX = this.x - this.velocityX * 0.01 * offset;
            const trailY = this.y - this.velocityY * 0.01 * offset;
            const alpha = 1 - (i / 3);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(trailX - cameraX, trailY - cameraY,
                Math.max(1, this.radius - i), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    isDead() {
        return this.lifetime <= 0;
    }
}
class HealthZone {
    constructor(x, y, width, height, healRate) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.healRate = healRate;
        this.pulse = 0;
    }
    update(dt) {
        this.pulse += dt * 3;
    }
    draw(cameraX, cameraY) {
        const pulseOffset = Math.sin(this.pulse) * 10;
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            this.x - cameraX,
            this.y - cameraY,
            this.width,
            this.height
        );
        ctx.fillStyle = 'rgba(50, 200, 50, 0.2)';
        ctx.fillRect(
            this.x - cameraX + pulseOffset,
            this.y - cameraY + pulseOffset,
            this.width - pulseOffset * 2,
            this.height - pulseOffset * 2
        );
        for (let i = 0; i < 5; i++) {
            const particleX = this.x + Math.random() * this.width;
            const particleY = this.y + Math.random() * this.height;
            const size = Math.random() * 2 + 2;
            ctx.fillStyle = Colors.GREEN;
            ctx.beginPath();
            ctx.arc(particleX - cameraX, particleY - cameraY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }
}
class WeaponPickup {
    constructor(x, y, weapon) {
        this.x = x;
        this.y = y;
        this.weapon = weapon;
        this.width = 30;
        this.height = 30;
        this.bob = 0;
        this.rotation = 0;
    }
    update(dt) {
        this.bob += dt * 3;
        this.rotation += dt * 2;
    }
    draw(cameraX, cameraY) {
        const bobOffset = Math.sin(this.bob) * 5;
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY + bobOffset;
        ctx.strokeStyle = this.weapon.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX - 15, drawY - 15, 30, 30);
        ctx.fillStyle = this.weapon.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Colors.WHITE;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.weapon.name[0], drawX, drawY);
    }
    getRect() {
        return {
            x: this.x - 15,
            y: this.y - 15,
            width: 30,
            height: 30
        };
    }
}
class Entity {
    constructor(x, y, width, height, health, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxHealth = health;
        this.health = health;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200;
        this.isAlive = true;
    }
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
        return !this.isAlive;
    }
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    drawHealthBar(cameraX, cameraY) {
        const barWidth = this.width;
        const barHeight = 6;
        const barX = this.x - cameraX;
        const barY = this.y - cameraY - 15;
        ctx.fillStyle = Colors.RED;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillStyle = Colors.GREEN;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        ctx.strokeStyle = Colors.BLACK;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, 100, Colors.BLUE);
        this.weapon = new Weapon('Sword', WeaponType.SWORD, 15, 60, 0.5, Colors.YELLOW);
        this.attackCooldown = 0;
        this.experience = 0;
        this.level = 1;
        this.kills = 0;
    }
    update(dt, keys, worldWidth, worldHeight) {
        this.velocityX = 0;
        this.velocityY = 0;
        if (keys['w'] || keys['ArrowUp']) {
            this.velocityY = -this.speed;
        }
        if (keys['s'] || keys['ArrowDown']) {
            this.velocityY = this.speed;
        }
        if (keys['a'] || keys['ArrowLeft']) {
            this.velocityX = -this.speed;
        }
        if (keys['d'] || keys['ArrowRight']) {
            this.velocityX = this.speed;
        }
        if (this.velocityX !== 0 && this.velocityY !== 0) {
            this.velocityX *= 0.707;
            this.velocityY *= 0.707;
        }
        let newX = this.x + this.velocityX * dt;
        let newY = this.y + this.velocityY * dt;
        newX = Math.max(0, Math.min(newX, worldWidth - this.width));
        newY = Math.max(0, Math.min(newY, worldHeight - this.height));
        this.x = newX;
        this.y = newY;
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }
    canAttack() {
        return this.attackCooldown <= 0;
    }
    attack(targetX, targetY) {
        if (this.canAttack()) {
            this.attackCooldown = this.weapon.attackSpeed;
            return true;
        }
        return false;
    }
    addExperience(amount) {
        this.experience += amount;
        const expNeeded = this.level * 100;
        if (this.experience >= expNeeded) {
            this.levelUp();
        }
    }
    levelUp() {
        this.level++;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.speed += 10;
    }
    draw(cameraX, cameraY) {
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY;
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY, this.width, this.height);
        ctx.strokeStyle = Colors.WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, this.width, this.height);
        const eyeSize = 6;
        ctx.fillStyle = Colors.WHITE;
        ctx.beginPath();
        ctx.arc(drawX + 12, drawY + 12, eyeSize, 0, Math.PI * 2);
        ctx.arc(drawX + 28, drawY + 12, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Colors.BLACK;
        ctx.beginPath();
        ctx.arc(drawX + 12, drawY + 12, 3, 0, Math.PI * 2);
        ctx.arc(drawX + 28, drawY + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        this.drawHealthBar(cameraX, cameraY);
        const weaponOffset = 15;
        if (this.weapon.weaponType === WeaponType.SWORD) {
            ctx.strokeStyle = this.weapon.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drawX + this.width, drawY + this.height / 2);
            ctx.lineTo(drawX + this.width + weaponOffset, drawY + this.height / 2);
            ctx.stroke();
        } else if (this.weapon.weaponType === WeaponType.BOW) {
            ctx.strokeStyle = this.weapon.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX + this.width - 5, drawY + 20, 10, -Math.PI / 4, Math.PI / 4, false);
            ctx.stroke();
        }
    }
}
class Enemy extends Entity {
    constructor(x, y, enemyType) {
        let width, height, health, color;
        switch (enemyType) {
            case EnemyType.GRUNT:
                width = 35;
                height = 35;
                health = 30;
                color = Colors.RED;
                break;
            case EnemyType.ARCHER:
                width = 30;
                height = 30;
                health = 20;
                color = Colors.PURPLE;
                break;
            case EnemyType.TANK:
                width = 50;
                height = 50;
                health = 80;
                color = Colors.GRAY;
                break;
            case EnemyType.BOSS:
                width = 80;
                height = 80;
                health = 300;
                color = Colors.DARK_RED;
                break;
        }
        super(x, y, width, height, health, color);
        this.enemyType = enemyType;
        if (enemyType === EnemyType.GRUNT) {
            this.speed = 100;
            this.damage = 10;
            this.attackRange = 50;
            this.attackCooldownMax = 1.0;
            this.expValue = 20;
        } else if (enemyType === EnemyType.ARCHER) {
            this.speed = 80;
            this.damage = 8;
            this.attackRange = 300;
            this.attackCooldownMax = 2.0;
            this.expValue = 30;
        } else if (enemyType === EnemyType.TANK) {
            this.speed = 60;
            this.damage = 20;
            this.attackRange = 60;
            this.attackCooldownMax = 1.5;
            this.expValue = 50;
        } else if (enemyType === EnemyType.BOSS) {
            this.speed = 120;
            this.damage = 25;
            this.attackRange = 200;
            this.attackCooldownMax = 0.8;
            this.expValue = 200;
        }
        this.attackCooldown = 0;
        this.state = 'idle';
    }
    update(dt, player, worldWidth, worldHeight) {
        if (!this.isAlive) return;
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        const playerCenter = player.getCenter();
        const selfCenter = this.getCenter();
        const dx = playerCenter.x - selfCenter.x;
        const dy = playerCenter.y - selfCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.attackRange) {
            if (distance > 0) {
                this.velocityX = (dx / distance) * this.speed;
                this.velocityY = (dy / distance) * this.speed;
            }
            let newX = this.x + this.velocityX * dt;
            let newY = this.y + this.velocityY * dt;
            newX = Math.max(0, Math.min(newX, worldWidth - this.width));
            newY = Math.max(0, Math.min(newY, worldHeight - this.height));
            this.x = newX;
            this.y = newY;
            this.state = 'chasing';
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
            this.state = 'attacking';
        }
    }
    canAttack() {
        return this.attackCooldown <= 0;
    }
    performAttack() {
        if (this.canAttack()) {
            this.attackCooldown = this.attackCooldownMax;
            return true;
        }
        return false;
    }
    draw(cameraX, cameraY) {
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY;
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY, this.width, this.height);
        ctx.strokeStyle = Colors.BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, this.width, this.height);
        if (this.enemyType === EnemyType.BOSS) {
            ctx.strokeStyle = Colors.YELLOW;
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX + 5, drawY + 5, this.width - 10, this.height - 10);
        }
        const eyeOffset = this.width / 4;
        const eyeSize = this.enemyType === EnemyType.BOSS ? 6 : 4;
        ctx.fillStyle = Colors.YELLOW;
        ctx.beginPath();
        ctx.arc(drawX + eyeOffset, drawY + eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.arc(drawX + this.width - eyeOffset, drawY + eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        this.drawHealthBar(cameraX, cameraY);
    }
}
class Game {
    constructor() {
        this.worldWidth = WORLD_WIDTH;
        this.worldHeight = WORLD_HEIGHT;
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.healthZones = [];
        this.weaponPickups = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.wave = 1;
        this.enemiesKilledThisWave = 0;
        this.enemiesInWave = 5;
        this.gameState = 'playing'; // 'playing' or 'game_over'
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.setupWorld();
        this.spawnWave();
        this.setupEventListeners();
        this.lastTime = Date.now();
        this.gameLoop();
    }
    setupWorld() {
        this.healthZones.push(new HealthZone(200, 200, 150, 150, 10));
        this.healthZones.push(new HealthZone(this.worldWidth - 350, 200, 150, 150, 10));
        this.healthZones.push(new HealthZone(200, this.worldHeight - 350, 150, 150, 10));
        this.healthZones.push(new HealthZone(this.worldWidth - 350, this.worldHeight - 350, 150, 150, 10));
        const weapons = [
            new Weapon('Bow', WeaponType.BOW, 12, 400, 1.0, Colors.CYAN),
            new Weapon('Staff', WeaponType.STAFF, 20, 300, 1.5, Colors.MAGENTA),
            new Weapon('Hammer', WeaponType.HAMMER, 30, 80, 2.0, Colors.GRAY),
            new Weapon('Dual Blades', WeaponType.DUAL_BLADES, 10, 70, 0.3, Colors.ORANGE)
        ];
        weapons.forEach(weapon => {
            const x = Math.random() * (this.worldWidth - 200) + 100;
            const y = Math.random() * (this.worldHeight - 200) + 100;
            this.weaponPickups.push(new WeaponPickup(x, y, weapon));
        });
    }
    spawnWave() {
        this.enemiesKilledThisWave = 0;
        if (this.wave % 5 === 0) {
            const bossX = Math.random() * (this.worldWidth - 200) + 100;
            const bossY = Math.random() * (this.worldHeight - 200) + 100;
            this.enemies.push(new Enemy(bossX, bossY, EnemyType.BOSS));
            this.enemiesInWave = 1;
        } else {
            this.enemiesInWave = 5 + (this.wave - 1) * 2;
            for (let i = 0; i < this.enemiesInWave; i++) {
                const edge = Math.floor(Math.random() * 4);
                let x, y;
                if (edge === 0) { // Top
                    x = Math.random() * this.worldWidth;
                    y = 0;
                } else if (edge === 1) { // Right
                    x = this.worldWidth;
                    y = Math.random() * this.worldHeight;
                } else if (edge === 2) { // Bottom
                    x = Math.random() * this.worldWidth;
                    y = this.worldHeight;
                } else { // Left
                    x = 0;
                    y = Math.random() * this.worldHeight;
                }
                const rand = Math.random();
                let enemyType;
                if (rand < 0.5) {
                    enemyType = EnemyType.GRUNT;
                } else if (rand < 0.8) {
                    enemyType = EnemyType.ARCHER;
                } else {
                    enemyType = EnemyType.TANK;
                }
                this.enemies.push(new Enemy(x, y, enemyType));
            }
        }
    }
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.key] = true;
            if (e.key.toLowerCase() === 'r' && this.gameState === 'game_over') {
                this.restartGame();
            }
            if (e.key === 'Escape') {
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.key] = false;
        });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                if (this.gameState === 'playing') {
                    this.handleAttack();
                } else if (this.gameState === 'game_over') {
                    this.restartGame();
                }
            }
        });
    }
    handleAttack() {
        const worldX = this.mouseX + this.cameraX;
        const worldY = this.mouseY + this.cameraY;
        const playerCenter = this.player.getCenter();
        const dx = worldX - playerCenter.x;
        const dy = worldY - playerCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (this.player.weapon.weaponType === WeaponType.BOW ||
            this.player.weapon.weaponType === WeaponType.STAFF) {
            if (this.player.attack(worldX, worldY)) {
                const projectile = new Projectile(
                    playerCenter.x, playerCenter.y,
                    worldX, worldY,
                    this.player.weapon.damage,
                    500,
                    this.player.weapon.color,
                    true
                );
                this.projectiles.push(projectile);
                this.createParticles(playerCenter.x, playerCenter.y, this.player.weapon.color, 5);
            }
        } else {
            if (distance <= this.player.weapon.range) {
                if (this.player.attack(worldX, worldY)) {
                    this.enemies.forEach(enemy => {
                        const enemyCenter = enemy.getCenter();
                        const exDx = enemyCenter.x - playerCenter.x;
                        const exDy = enemyCenter.y - playerCenter.y;
                        const enemyDist = Math.sqrt(exDx * exDx + exDy * exDy);
                        if (enemyDist <= this.player.weapon.range) {
                            if (enemy.takeDamage(this.player.weapon.damage)) {
                                this.onEnemyKilled(enemy);
                            }
                            this.createParticles(enemyCenter.x, enemyCenter.y, Colors.RED, 10);
                        }
                    });
                }
            }
        }
    }
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = Math.random() * 0.5 + 0.3;
            this.particles.push(new Particle(x, y, color, vx, vy, lifetime));
        }
    }
    onEnemyKilled(enemy) {
        this.player.addExperience(enemy.expValue);
        this.player.kills++;
        this.enemiesKilledThisWave++;
        if (Math.random() < 0.15) {
            const weapons = [
                new Weapon('Bow', WeaponType.BOW, 12, 400, 1.0, Colors.CYAN),
                new Weapon('Staff', WeaponType.STAFF, 20, 300, 1.5, Colors.MAGENTA),
                new Weapon('Hammer', WeaponType.HAMMER, 30, 80, 2.0, Colors.GRAY),
                new Weapon('Dual Blades', WeaponType.DUAL_BLADES, 10, 70, 0.3, Colors.ORANGE),
                new Weapon('Sword', WeaponType.SWORD, 15, 60, 0.5, Colors.YELLOW)
            ];
            const weapon = weapons[Math.floor(Math.random() * weapons.length)];
            this.weaponPickups.push(new WeaponPickup(enemy.x, enemy.y, weapon));
        }
    }
    updateCamera() {
        const targetX = this.player.x + this.player.width / 2 - SCREEN_WIDTH / 2;
        const targetY = this.player.y + this.player.height / 2 - SCREEN_HEIGHT / 2;
        const clampedX = Math.max(0, Math.min(targetX, this.worldWidth - SCREEN_WIDTH));
        const clampedY = Math.max(0, Math.min(targetY, this.worldHeight - SCREEN_HEIGHT));
        this.cameraX += (clampedX - this.cameraX) * 0.1;
        this.cameraY += (clampedY - this.cameraY) * 0.1;
    }
    update(dt) {
        if (this.gameState !== 'playing') return;
        this.player.update(dt, this.keys, this.worldWidth, this.worldHeight);
        this.healthZones.forEach(zone => {
            zone.update(dt);
            const playerCenter = this.player.getCenter();
            if (zone.containsPoint(playerCenter.x, playerCenter.y)) {
                this.player.heal(zone.healRate * dt);
                if (Math.random() < 0.1) {
                    this.createParticles(playerCenter.x, playerCenter.y, Colors.GREEN, 2);
                }
            }
        });
        this.weaponPickups.forEach((pickup, index) => {
            pickup.update(dt);
            if (this.checkCollision(this.player.getRect(), pickup.getRect())) {
                this.player.weapon = pickup.weapon;
                this.weaponPickups.splice(index, 1);
                this.createParticles(pickup.x, pickup.y, pickup.weapon.color, 15);
            }
        });
        this.enemies.forEach((enemy, index) => {
            if (enemy.isAlive) {
                enemy.update(dt, this.player, this.worldWidth, this.worldHeight);
                if (enemy.state === 'attacking') {
                    const playerCenter = this.player.getCenter();
                    const enemyCenter = enemy.getCenter();
                    if (enemy.enemyType === EnemyType.ARCHER) {
                        if (enemy.performAttack()) {
                            const projectile = new Projectile(
                                enemyCenter.x, enemyCenter.y,
                                playerCenter.x, playerCenter.y,
                                enemy.damage,
                                300,
                                Colors.PURPLE,
                                false
                            );
                            this.projectiles.push(projectile);
                        }
                    } else {
                        const dx = playerCenter.x - enemyCenter.x;
                        const dy = playerCenter.y - enemyCenter.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= enemy.attackRange) {
                            if (enemy.performAttack()) {
                                this.player.takeDamage(enemy.damage);
                                this.createParticles(playerCenter.x, playerCenter.y, Colors.RED, 8);
                                if (!this.player.isAlive) {
                                    this.gameState = 'game_over';
                                }
                            }
                        }
                    }
                }
            } else {
                this.enemies.splice(index, 1);
            }
        });
        this.projectiles.forEach((projectile, index) => {
            projectile.update(dt);
            if (projectile.isPlayer) {
                for (let enemy of this.enemies) {
                    if (enemy.isAlive) {
                        const enemyRect = enemy.getRect();
                        if (this.pointInRect(projectile.x, projectile.y, enemyRect)) {
                            if (enemy.takeDamage(projectile.damage)) {
                                this.onEnemyKilled(enemy);
                            }
                            this.createParticles(projectile.x, projectile.y, projectile.color, 8);
                            this.projectiles.splice(index, 1);
                            break;
                        }
                    }
                }
            } else {
                const playerRect = this.player.getRect();
                if (this.pointInRect(projectile.x, projectile.y, playerRect)) {
                    this.player.takeDamage(projectile.damage);
                    this.createParticles(projectile.x, projectile.y, Colors.RED, 8);
                    this.projectiles.splice(index, 1);
                    if (!this.player.isAlive) {
                        this.gameState = 'game_over';
                    }
                }
            }
            if (projectile.isDead()) {
                this.projectiles.splice(index, 1);
            }
        });
        this.particles.forEach((particle, index) => {
            particle.update(dt);
            if (particle.isDead()) {
                this.particles.splice(index, 1);
            }
        });
        if (this.enemiesKilledThisWave >= this.enemiesInWave && this.enemies.length === 0) {
            this.wave++;
            this.spawnWave();
        }
        this.updateCamera();
    }
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }
    pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height;
    }
    drawWorld() {
        ctx.fillStyle = '#28293d';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        const gridSize = 100;
        ctx.strokeStyle = '#3c3c50';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.worldWidth; x += gridSize) {
            const screenX = x - this.cameraX;
            if (screenX >= -gridSize && screenX <= SCREEN_WIDTH + gridSize) {
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, SCREEN_HEIGHT);
                ctx.stroke();
            }
        }
        for (let y = 0; y < this.worldHeight; y += gridSize) {
            const screenY = y - this.cameraY;
            if (screenY >= -gridSize && screenY <= SCREEN_HEIGHT + gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, screenY);
                ctx.lineTo(SCREEN_WIDTH, screenY);
                ctx.stroke();
            }
        }
        ctx.strokeStyle = '#646478';
        ctx.lineWidth = 5;
        ctx.strokeRect(-this.cameraX, -this.cameraY, this.worldWidth, this.worldHeight);
    }
    draw() {
        this.drawWorld();
        this.healthZones.forEach(zone => zone.draw(this.cameraX, this.cameraY));
        this.weaponPickups.forEach(pickup => pickup.draw(this.cameraX, this.cameraY));
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(this.cameraX, this.cameraY);
            }
        });
        this.player.draw(this.cameraX, this.cameraY);
        this.projectiles.forEach(projectile => projectile.draw(this.cameraX, this.cameraY));
        this.particles.forEach(particle => particle.draw(this.cameraX, this.cameraY));
        this.drawUI();
        if (this.gameState === 'game_over') {
            this.drawGameOver();
        }
    }
    drawUI() {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, 80);
        ctx.fillStyle = Colors.WHITE;
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Health: ${Math.floor(this.player.health)}/${this.player.maxHealth}`, 20, 30);
        const healthBarWidth = 200;
        const healthBarHeight = 20;
        ctx.fillStyle = Colors.RED;
        ctx.fillRect(20, 40, healthBarWidth, healthBarHeight);
        const healthWidth = (this.player.health / this.player.maxHealth) * healthBarWidth;
        ctx.fillStyle = Colors.GREEN;
        ctx.fillRect(20, 40, healthWidth, healthBarHeight);
        ctx.strokeStyle = Colors.WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, healthBarWidth, healthBarHeight);
        ctx.fillStyle = Colors.WHITE;
        ctx.fillText(`Weapon: ${this.player.weapon.name}`, 250, 30);
        ctx.fillStyle = Colors.YELLOW;
        ctx.fillText(`Damage: ${this.player.weapon.damage}`, 250, 55);
        ctx.fillStyle = Colors.CYAN;
        ctx.fillText(`Level: ${this.player.level}`, 450, 30);
        const expNeeded = this.player.level * 100;
        ctx.fillText(`EXP: ${this.player.experience}/${expNeeded}`, 450, 55);
        ctx.font = '36px Arial';
        ctx.fillStyle = Colors.ORANGE;
        ctx.textAlign = 'center';
        ctx.fillText(`Wave ${this.wave}`, SCREEN_WIDTH / 2, 45);
        ctx.font = '24px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = Colors.WHITE;
        ctx.fillText(`Kills: ${this.player.kills}`, SCREEN_WIDTH - 20, 30);
        ctx.fillStyle = Colors.RED;
        ctx.fillText(`Enemies: ${this.enemiesKilledThisWave}/${this.enemiesInWave}`, SCREEN_WIDTH - 20, 55);
    }
    drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.font = '48px Arial';
        ctx.fillStyle = Colors.RED;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);
        ctx.font = '36px Arial';
        ctx.fillStyle = Colors.WHITE;
        const stats = [
            `Wave Reached: ${this.wave}`,
            `Total Kills: ${this.player.kills}`,
            `Final Level: ${this.player.level}`
        ];
        stats.forEach((stat, index) => {
            ctx.fillText(stat, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20 + index * 40);
        });
        ctx.fillStyle = Colors.GREEN;
        ctx.fillText('Click or Press R to Restart', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 150);
    }
    restartGame() {
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.healthZones = [];
        this.weaponPickups = [];
        this.wave = 1;
        this.enemiesKilledThisWave = 0;
        this.enemiesInWave = 5;
        this.gameState = 'playing';
        this.setupWorld();
        this.spawnWave();
    }
    gameLoop() {
        const currentTime = Date.now();
        const dt = (currentTime - this.lastTime) / 1000; // Delta time in seconds
        this.lastTime = currentTime;
        this.update(dt);
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}
window.addEventListener('load', () => {
    new Game();
});
