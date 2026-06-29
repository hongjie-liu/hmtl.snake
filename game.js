const bgm = document.getElementById("bgm");
const dieSound = document.getElementById("dieSound");

bgm.volume = 0.3;       // 背景音量（0~1）
dieSound.volume = 0.6;  // 死亡音量
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 16;              
const tileCount = 40;            
canvas.width = gridSize * tileCount;   // 自动算宽
canvas.height = gridSize * tileCount;  // 自动算高

let snake = [{ x: 10, y: 10 }];
let stones = [];
let stoneTimer = null;
let food = { x: 15, y: 15 };
let dx = 0, dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let level = 1;
const normalSpeed = 300;  // 正常速度
const fastSpeed   = 100;  
let speed = normalSpeed; 
let gameLoop;
let isPaused = false;
let isGameOver = true;


document.getElementById("highScore").textContent = highScore;

function draw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画蛇身
    snake.forEach((seg, i) => {
        const alpha = 1 - i * 0.02;
        ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`;

        ctx.beginPath();
        ctx.roundRect(
            seg.x * gridSize + 2,
            seg.y * gridSize + 2,
            gridSize - 4,
            gridSize - 4,
            6
        );
        ctx.fill();
    });
    // 卡通豆子
    const fx = food.x * gridSize + gridSize / 2;
    const fy = food.y * gridSize + gridSize / 2;

    // 豆子身体
    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(fx, fy, gridSize / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 蛇头
    const head = snake[0];
    const cx = head.x * gridSize + gridSize / 2;
    const cy = head.y * gridSize + gridSize / 2;

    // 头
    ctx.fillStyle = "#66bb6a";
    ctx.beginPath();
    ctx.arc(cx, cy, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 4, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // 画石头
// 画箱子
stones.forEach(s => {
    const bx = s.x * gridSize;
    const by = s.y * gridSize;
    const size = gridSize - 2;

    // 箱子主体（棕色）
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(bx + 1, by + 1, size, size);

    // 箱子边框（深棕色）
    ctx.strokeStyle = "#5D3A1A";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, by + 1, size, size);

    // 箱子上的“十字”捆带（米黄色）
    ctx.strokeStyle = "#D2B48C";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + 1, by + size / 2);
    ctx.lineTo(bx + size + 1, by + size / 2);
    ctx.moveTo(bx + size / 2, by + 1);
    ctx.lineTo(bx + size / 2, by + size + 1);
    ctx.stroke();

});
}
function update() {
    if (isPaused || isGameOver) return;
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 只检测撞墙
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= tileCount ||
        head.y >= tileCount
    ) {
        endGame();
        return;
    }
    // 撞到石头
    if (stones.some(s => s.x === head.x && s.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        level = Math.floor(score / 5) + 1;
        document.getElementById("score").textContent = score;
        document.getElementById("level").textContent = level;
        clearInterval(stoneTimer);
        stoneTimer = setInterval(generateStone, getStoneInterval());
        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
}

function generateStone() {
    let newStone;
    do {
        newStone = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (
        snake.some(seg => seg.x === newStone.x && seg.y === newStone.y) ||
        (food.x === newStone.x && food.y === newStone.y) ||
        stones.some(s => s.x === newStone.x && s.y === newStone.y)
    );
    stones.push(newStone);
}

function getStoneInterval() {
    // 基础 5 秒，蛇每长 3 节减 0.5 秒，最低 1.5 秒
    const base = 5000;
    const reduction = Math.floor(snake.length / 3) * 500;
    return Math.max(1500, base - reduction);
}

function gameStep() {
    update();
    draw();
}

function startGame() {
    clearInterval(gameLoop); //  清掉旧定时器
    clearInterval(stoneTimer);
    resetGame();
    dx =1;
    isGameOver = false;
    isPaused = false;
    toggleScreens(false);
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("pauseScreen").classList.add("hidden");
    bgm.currentTime = 0;
    bgm.play();
    gameLoop = setInterval(gameStep, speed);
    stoneTimer = setInterval(generateStone, getStoneInterval());
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById("pauseScreen").classList.toggle("hidden", !isPaused);
    if (isPaused) {
    clearInterval(stoneTimer);
    bgm.pause();
    } else {
        stoneTimer = setInterval(generateStone, 5000);
        bgm.play();
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById("pauseScreen").classList.add("hidden");
    bgm.play();
    stoneTimer = setInterval(generateStone, 5000);
}

function endGame() {
    clearInterval(stoneTimer);
    stones = [];
    isGameOver = true;
    clearInterval(gameLoop);
    bgm.pause();
    dieSound.currentTime = 0;
    dieSound.play();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
    }
    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOverScreen").classList.remove("hidden");
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    level = 1;
    document.getElementById("score").textContent = 0;
    document.getElementById("level").textContent = 1;
    generateFood();
    stones = [];
}

function restartGame() {
    clearInterval(gameLoop); // 清掉旧定时器
    clearInterval(stoneTimer);
    resetGame();
    startGame();
    bgm.currentTime = 0;
    bgm.play();
}

function toggleScreens(hideAll) {
    document.getElementById("startScreen").classList.toggle("hidden", hideAll);
    document.getElementById("gameOverScreen").classList.add("hidden");
    document.getElementById("pauseScreen").classList.add("hidden");
}

document.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp":
        case "w":
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
        case "s":
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
        case "a":
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
        case "d":
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
        case " ":
            togglePause();
            break;
    }
});
document.addEventListener("keydown", e => {
    if (e.key === "Shift" && !isGameOver && speed !== fastSpeed) {
        speed = fastSpeed;
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
    }
});

document.addEventListener("keyup", e => {
    if (e.key === "Shift" && !isGameOver && speed !== normalSpeed) {
        speed = normalSpeed;
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
    }
});
function setDirection(dir) {
    const map = {
        up:    { x: 0, y: -1 },
        down:  { x: 0, y: 1 },
        left:  { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };
    if (!map[dir]) return;

    // 防 180° 回头
    if (
        (dir === "up"    && dy === 1) ||
        (dir === "down"  && dy === -1) ||
        (dir === "left"  && dx === 1) ||
        (dir === "right" && dx === -1)
    ) return;

    dx = map[dir].x;
    dy = map[dir].y;
}
// ======================
// 移动端滑动控制
// ======================
const swipeArea = document;

let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 15;    

swipeArea.addEventListener("touchstart", e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
}, { passive: true });

swipeArea.addEventListener("touchend", e => {
    if (isGameOver || isPaused) return;

    const t = e.changedTouches[0];
    const dxTouch = t.clientX - touchStartX;
    const dyTouch = t.clientY - touchStartY;

    // 忽略太小的滑动（防止误触）
    if (Math.abs(dxTouch) < minSwipeDistance && Math.abs(dyTouch) < minSwipeDistance) {
        return;
    }

    // 水平滑动优先
    if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
        if (dxTouch > 0) {
            setDirection("right");
        } else {
            setDirection("left");
        }
    } else {
        if (dyTouch > 0) {
            setDirection("down");
        } else {
            setDirection("up");
        }
    }
}, { passive: true });

draw();