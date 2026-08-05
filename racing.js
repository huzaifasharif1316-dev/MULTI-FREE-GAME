let raceMode = 'single'; let garageLevels = { accel: 1, speed: 1 }; const maxGarageLevel = 5;
let activeEquippedCarKey = "alpha";
let carShowroomRegistry = {
    alpha: { name: "Viper Interceptor", color: "#ff0055", cost: 0, unlocked: true, baseSpeed: 5, baseAccel: 0.12 },
    beta: { name: "Neon Shadow GT", color: "#cc00ff", cost: 300, unlocked: false, baseSpeed: 6.5, baseAccel: 0.15 },
    omega: { name: "Hyperion X-1", color: "#ffea00", cost: 750, unlocked: false, baseSpeed: 8, baseAccel: 0.20 }
};
let sandboxCars = []; let waypointTarget = { x: 400, y: 200, radius: 15 }; let sandboxScore = 0;

function updateGarageUI() {
    document.getElementById("stat-accel-lvl").innerText = garageLevels.accel;
    document.getElementById("stat-speed-lvl").innerText = garageLevels.speed;
    document.getElementById("cost-accel").innerText = garageLevels.accel >= maxGarageLevel ? "MAXED" : `Cost: ${garageLevels.accel * 150} 🪙`;
    document.getElementById("cost-speed").innerText = garageLevels.speed >= maxGarageLevel ? "MAXED" : `Cost: ${garageLevels.speed * 200} 🪙`;
}
function upgradeCarComponent(type) {
    let currentLvl = garageLevels[type]; if (currentLvl >= maxGarageLevel) return;
    let baseCost = type === 'accel' ? 150 : 200; let computedCost = currentLvl * baseCost;
    if (wallet.coins >= computedCost) { wallet.coins -= computedCost; garageLevels[type]++; updateWalletUI(); updateGarageUI(); }
}
function renderCarShopUI() {
    const grid = document.getElementById("car-shop-grid"); grid.innerHTML = "";
    for (let key in carShowroomRegistry) {
        let car = carShowroomRegistry[key]; let card = document.createElement("div"); card.className = "card";
        let actionBtnText = car.unlocked ? (activeEquippedCarKey === key ? "EQUIPPED" : "SELECT") : `BUY (${car.cost}🪙)`;
        card.innerHTML = `<div><strong style="color:${car.color}">${car.name}</strong><br>Speed: ${car.baseSpeed} | Accel: ${car.baseAccel}</div><button class="action-btn" style="background:${car.color}" onclick="handleCarShopAction('${key}')">${actionBtnText}</button>`;
        grid.appendChild(card);
    }
}
function handleCarShopAction(key) {
    let car = carShowroomRegistry[key];
    if (car.unlocked) { activeEquippedCarKey = key; renderCarShopUI(); } 
    else if (wallet.coins >= car.cost) { wallet.coins -= car.cost; car.unlocked = true; activeEquippedCarKey = key; updateWalletUI(); renderCarShopUI(); }
}
function startRacing(mode) {
    raceMode = mode; document.getElementById("racing-master-menu").classList.add("hidden");
    activeSystemEngine = "RACING_MASTER"; gameActive = true; sandboxScore = 0; randomizeWaypoint();
    let activeCarConfig = carShowroomRegistry[activeEquippedCarKey];
    let tunedMaxSpeed = activeCarConfig.baseSpeed + (garageLevels.speed - 1) * 0.6;
    let tunedAccel = activeCarConfig.baseAccel + (garageLevels.accel - 1) * 0.04;
    
    sandboxCars = [
        { id: 1, name: "P1 Red", x: 200, y: 200, angle: 0, speed: 0, maxSpeed: tunedMaxSpeed, accel: tunedAccel, friction: 0.05, color: activeCarConfig.color, isAI: false, controls: { forward: "KeyW", reverse: "KeyS", left: "KeyA", right: "KeyD" } },
        { id: 2, name: mode === 'multi' ? "P2 Blue" : "AI Racer", x: 600, y: 200, angle: Math.PI, speed: 0, maxSpeed: 3.2, accel: 0.05, friction: 0.05, color: "#0077ff", isAI: mode === 'single', controls: { forward: "ArrowUp", reverse: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" } }
    ];
    raceLoop(); // Calls unique racing function
}
function randomizeWaypoint() { waypointTarget.x = 80 + Math.random() * 640; waypointTarget.y = 80 + Math.random() * 240; }

function runRacingMasterEngine() {
    ctx.fillStyle = "#0c0c16"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255, 0, 85, 0.1)";
    for(let x=0; x<canvas.width; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for(let y=0; y<canvas.height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

    let pulseSize = waypointTarget.radius + Math.sin(Date.now() * 0.01) * 4;
    ctx.shadowBlur = 20; ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "rgba(0, 255, 255, 0.4)"; ctx.beginPath(); ctx.arc(waypointTarget.x, waypointTarget.y, pulseSize, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;

    sandboxCars.forEach(car => {
        if (!car.isAI) {
            if (keys[car.controls.left]) car.angle -= 0.06;
            if (keys[car.controls.right]) car.angle += 0.06;
            if (keys[car.controls.forward]) car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
            else if (keys[car.controls.reverse]) car.speed = Math.max(-car.maxSpeed/2, car.speed - car.accel);
            else {
                if (car.speed > 0) car.speed = Math.max(0, car.speed - car.friction);
                if (car.speed < 0) car.speed = Math.min(0, car.speed + car.friction);
            }
        } else {
            let dx = waypointTarget.x - car.x; let dy = waypointTarget.y - car.y; let targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - car.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -0.02) car.angle -= 0.02; 
            if (angleDiff > 0.02) car.angle += 0.02;
            car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
        }
        car.x += Math.cos(car.angle) * car.speed; car.y += Math.sin(car.angle) * car.speed;

        if (car.x < 15) { car.x = 15; car.speed *= -0.5; }
        if (car.x > canvas.width - 15) { car.x = canvas.width - 15; car.speed *= -0.5; }
        if (car.y < 15) { car.y = 15; car.speed *= -0.5; }
        if (car.y > canvas.height - 15) { car.y = canvas.height - 15; car.speed *= -0.5; }

        let distToTarget = Math.hypot(waypointTarget.x - car.x, waypointTarget.y - car.y);
        if (distToTarget < pulseSize + 10) { sandboxScore++; randomizeWaypoint(); }

        ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
        ctx.fillStyle = car.color; ctx.fillRect(-22, -11, 44, 22);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(8, -8, 6, 16);
        ctx.fillStyle = "#000000"; ctx.fillRect(-15, -14, 10, 3); ctx.fillRect(5, -14, 10, 3); ctx.fillRect(-15, 11, 10, 3); ctx.fillRect(5, 11, 10, 3);
        ctx.restore();
    });
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px sans-serif";
    ctx.fillText(`CHECKPOINTS CLAIMED: ${sandboxScore}`, 20, 40);
}

function raceLoop() {
    if (!gameActive || activeSystemEngine !== "RACING_MASTER") return;
    runRacingMasterEngine();
    requestAnimationFrame(raceLoop);
}
