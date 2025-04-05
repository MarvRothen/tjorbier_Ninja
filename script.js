
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 844;
canvas.height = 390;

const background = new Image(); background.src = 'background.png';
const bier = new Image(); bier.src = 'bierflasche.png';
const wasser = new Image(); wasser.src = 'wasserflasche.png';
const boss = new Image(); boss.src = 'endgegner.png';
const topHalf = new Image(); topHalf.src = 'bierflasche_top.png';
const bottomHalf = new Image(); bottomHalf.src = 'bierflasche_bottom.png';

let bottles = [];
let halves = [];
let slices = [];
let hits = [];
let lives = 3;
let score = 0;
let comboCount = 0;
let comboTimer = null;
let gameOver = false;

canvas.addEventListener('mousemove', sliceHandler);
canvas.addEventListener('touchmove', e => {
    if (e.touches.length > 0) sliceHandler(e.touches[0]);
});

function sliceHandler(e) {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    slices.push({ x, y, time: Date.now() });

    bottles = bottles.filter(b => {
        if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
            if (b.type === 'bier') {
                score++;
                comboCount++;
                if (comboTimer) clearTimeout(comboTimer);
                comboTimer = setTimeout(() => comboCount = 0, 1000);
                if (comboCount >= 2) score += 2;
                hits.push({ x: b.x, y: b.y, opacity: 1.0 });
                halves.push(...createHalves(b));
            } else if (b.type === 'wasser') {
                lives--;
                if (lives <= 0) gameOver = true;
            } else if (b.type === 'endgegner') {
                score = 0;
            }
            return false;
        }
        return true;
    });
}

function createHalves(b) {
    return [
        { x: b.x, y: b.y, vx: -2, vy: -3, angle: 0, img: topHalf, life: 50 },
        { x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 2, vy: -3, angle: 0, img: bottomHalf, life: 50 }
    ];
}

function spawnBottle() {
    if (gameOver) return;
    const types = ['bier', 'wasser', 'endgegner'];
    const rand = Math.random();
    const type = rand < 0.4 ? 'bier' : rand < 0.7 ? 'wasser' : 'endgegner';
    const side = Math.floor(Math.random() * 4); // 0=top, 1=bottom, 2=left, 3=right
    let x = 0, y = 0, vx = 0, vy = 0;
    const speed = Math.random() * 2 + 2;

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -60; vx = (Math.random() - 0.5) * 4; vy = speed; break;
        case 1: x = Math.random() * canvas.width; y = canvas.height + 60; vx = (Math.random() - 0.5) * 4; vy = -speed; break;
        case 2: x = -60; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * 4; break;
        case 3: x = canvas.width + 60; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * 4; break;
    }

    let w = 75, h = 180;
    if (type === 'wasser') { w = 65; h = 150; }
    if (type === 'endgegner') { w = 80; h = 160; }

    bottles.push({ x, y, vx, vy, angle: 0, type, w, h });
    setTimeout(spawnBottle, 1000);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    slices = slices.filter(s => now - s.time < 300);

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    slices.forEach((s, i) => i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y));
    ctx.stroke();

    bottles.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        const img = b.type === 'bier' ? bier : b.type === 'wasser' ? wasser : boss;
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
        ctx.rotate(0.05);
        ctx.drawImage(img, -b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
    });

    halves = halves.filter(h => {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.3;
        h.angle += 0.1;
        h.life -= 1;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        ctx.drawImage(h.img, -30, -30, 60, 60);
        ctx.restore();
        return h.life > 0;
    });

    hits = hits.filter(h => {
        ctx.globalAlpha = h.opacity;
        ctx.fillStyle = 'lime';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('+1', h.x, h.y);
        ctx.globalAlpha = 1.0;
        h.y -= 1;
        h.opacity -= 0.03;
        return h.opacity > 0;
    });

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Punkte: ' + score, 10, 30);
    ctx.fillText('Leben: ' + lives, 10, 60);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 120, canvas.height / 2);
        if (score >= 262) {
            ctx.fillStyle = 'gold';
            ctx.font = 'bold 18px Arial';
            ctx.fillText("Jetzt darfst du die goldene Seite im Booklet umdrehen und lesen!", canvas.width / 2 - 180, canvas.height / 2 + 70);
        }
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Zum Neustart klicken', canvas.width / 2 - 80, canvas.height / 2 + 40);
    }

    requestAnimationFrame(draw);
}

spawnBottle();
draw();

canvas.addEventListener('click', () => {
    if (gameOver) {
        score = 0;
        lives = 3;
        gameOver = false;
        bottles = [];
        halves = [];
        hits = [];
        spawnBottle();
    }
});

let highscore = localStorage.getItem('tjorben_highscore') || 0;

// Power-Ups hinzufügen
const powerUps = [
    { type: 'bonus', color: 'green', effect: () => { score += 3; }, label: '+3 Punkte' },
    { type: 'life', color: 'red', effect: () => { lives++; }, label: '+1 Leben' }
];

function spawnBottle() {
    if (gameOver) return;
    const rand = Math.random();
    let type = 'bier';
    if (rand < 0.2) type = 'wasser';
    else if (rand < 0.35) type = 'endgegner';
    else if (rand < 0.42) type = 'bonus';
    else if (rand < 0.5) type = 'life';

    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0, vx = 0, vy = 0;
    const speed = Math.random() * 2 + 2;

    switch (side) {
        case 0: x = Math.random() * canvas.width; y = -60; vx = (Math.random() - 0.5) * 4; vy = speed; break;
        case 1: x = Math.random() * canvas.width; y = canvas.height + 60; vx = (Math.random() - 0.5) * 4; vy = -speed; break;
        case 2: x = -60; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * 4; break;
        case 3: x = canvas.width + 60; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * 4; break;
    }

    let w = 75, h = 180;
    if (type === 'wasser') { w = 65; h = 150; }
    if (type === 'endgegner') { w = 80; h = 160; }

    bottles.push({ x, y, vx, vy, angle: 0, type, w, h });
    setTimeout(spawnBottle, 1000);
}

sliceHandler = function(e) {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    slices.push({ x, y, time: Date.now() });

    bottles = bottles.filter(b => {
        if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
            if (b.type === 'bier') {
                score++;
                comboCount++;
                hits.push({ x: b.x, y: b.y, opacity: 1.0 });
                if (comboTimer) clearTimeout(comboTimer);
                comboTimer = setTimeout(() => comboCount = 0, 1000);
                if (comboCount >= 2) score += 2;
                halves.push(...createHalves(b));
            } else if (b.type === 'wasser') {
                lives--;
                if (lives <= 0) gameOver = true;
            } else if (b.type === 'endgegner') {
                score = 0;
            } else {
                const p = powerUps.find(p => p.type === b.type);
                if (p) {
                    p.effect();
                    hits.push({ x: b.x, y: b.y, opacity: 1.0, label: p.label });
                }
            }
            return false;
        }
        return true;
    });
};

draw = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    slices = slices.filter(s => now - s.time < 300);

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    slices.forEach((s, i) => i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y));
    ctx.stroke();

    bottles.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        const img = b.type === 'bier' ? bier :
                    b.type === 'wasser' ? wasser :
                    b.type === 'endgegner' ? boss : null;
        if (img) {
            ctx.save();
            ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
            ctx.rotate(0.05);
            ctx.drawImage(img, -b.w / 2, -b.h / 2, b.w, b.h);
            ctx.restore();
        } else {
            const p = powerUps.find(p => p.type === b.type);
            if (p) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    halves = halves.filter(h => {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.3;
        h.angle += 0.1;
        h.life -= 1;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        ctx.drawImage(h.img, -30, -30, 60, 60);
        ctx.restore();
        return h.life > 0;
    });

    hits = hits.filter(h => {
        ctx.globalAlpha = h.opacity;
        ctx.fillStyle = 'lime';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(h.label || '+1', h.x, h.y);
        ctx.globalAlpha = 1.0;
        h.y -= 1;
        h.opacity -= 0.03;
        return h.opacity > 0;
    });

    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Punkte: ' + score, 10, 30);
    ctx.fillText('Leben: ' + lives, 10, 60);
    ctx.fillText('Highscore: ' + highscore, 10, 90);

    if (comboCount >= 2) {
        ctx.fillStyle = 'gold';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('COMBO +3!', canvas.width / 2 - 70, 70);
    }

    if (gameOver) {
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('tjorben_highscore', highscore);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 120, canvas.height / 2);
        if (score >= 262) {
            ctx.fillStyle = 'gold';
            ctx.font = 'bold 18px Arial';
            ctx.fillText("Jetzt darfst du die goldene Seite im Booklet umdrehen und lesen!", canvas.width / 2 - 180, canvas.height / 2 + 70);
        }
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('Zum Neustart klicken', canvas.width / 2 - 80, canvas.height / 2 + 40);
    }

    requestAnimationFrame(draw);
};
