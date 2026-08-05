const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let activeSystemEngine = null; 
let gameActive = false;
let wallet = { coins: 500, diamonds: 0 }; 

const keys = {};
window.addEventListener("keydown", (e) => { keys[e.code] = true; handleJumpTrigger(e); });
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
canvas.addEventListener("mousedown", () => { if(activeSystemEngine === 'BLOCK_DASH' && gameActive) jumpBD(); });

function handleJumpTrigger(e) {
    if (activeSystemEngine === 'BLOCK_DASH' && gameActive && (e.code === "Space" || e.code === "ArrowUp") && playerBD.isGrounded) jumpBD();
}

function switchGameMode(targetMenuId) {
    const overlays = ["hub-launcher", "block-dash-menu", "racing-master-menu", "shop-screen", "inventory-screen", "racing-tutorial", "racing-garage", "racing-showroom"];
    overlays.forEach(id => document.getElementById(id).classList.add("hidden"));
    document.getElementById(targetMenuId).classList.remove("hidden");
    if(targetMenuId === 'inventory-screen') renderInventoryUI();
    if(targetMenuId === 'racing-garage') updateGarageUI();
    if(targetMenuId === 'racing-showroom') renderCarShopUI();
}

function exitToLauncher() { 
    if(activeSystemEngine === 'RACING_MASTER') wallet.coins += 20; 
    gameActive = false; activeSystemEngine = null; ctx.clearRect(0,0,canvas.width,canvas.height); 
    updateWalletUI(); switchGameMode("hub-launcher"); 
}
function updateWalletUI() { document.getElementById("coin-count").innerText = wallet.coins; document.getElementById("diamond-count").innerText = wallet.diamonds; }
function showSubScreen(id) { switchGameMode(id); }

// =========================================================================
// BLOCK DASH ENGINE
// =========================================================================
const GRAVITY = 0.65; const JUMP_FORCE = -12.5; let speedBD = 6; const GROUND_Y = canvas.height - 60;
let playerBD = { x: 120, y: GROUND_Y - 40, width: 40, height: 40, velocityY: 0, isGrounded: false, rotation: 0, activeTrail: "green" };
let inventory = {
    green: { name: "Neon Green", color: "rgba(0, 255, 204, 0.5)", unlocked: true },
    pink: { name: "Pink Plasma", color: "rgba(255, 0, 255, 0.6)", unlocked: false },
    cyan: { name: "Electric Cyan", color: "rgba(0, 255, 255, 0.6)", unlocked: false }
};
let obstacles = []; let coinsBD = []; let particles = []; let scoreBD = 0; let bgOffset = 0; let spawnTimerBD = 0; let nextSpawnDelayBD = 120;

function jumpBD() { playerBD.velocityY = JUMP_FORCE; playerBD.isGrounded = false; }
function buyDiamonds(amt, cost) { if(wallet.coins >= cost) { wallet.coins -= cost; wallet.diamonds += amt; updateWalletUI(); } else alert("No coins!"); }
function buyTrail(key, cost) {
    if(inventory[key].unlocked) return;
    if(wallet.diamonds >= cost) { wallet.diamonds -= cost; inventory[key].unlocked = true; updateWalletUI(); switchGameMode('shop-screen'); } else alert("No diamonds!");
}
function renderInventoryUI() {
    const grid = document.getElementById("inventory-grid"); grid.innerHTML = "";
    for (let k in inventory) {
        if (!inventory[k].unlocked) continue;
        let card = document.createElement("div"); card.className = "card";
        let isEq = (playerBD.activeTrail === k);
        card.innerHTML = `<div>${inventory[k].name}</div><button class="action-btn" onclick="equipTrail('${k}')">${isEq ? 'ACTIVE' : 'EQUIP'}</button>`;
        grid.appendChild(card);
    }
}
function equipTrail(k) { playerBD.activeTrail = k; renderInventoryUI(); }

function startBlockDash() {
    document.getElementById("block-dash-menu").classList.add("hidden");
    activeSystemEngine = "BLOCK_DASH"; gameActive = true;
    obstacles = []; coinsBD = []; particles = []; scoreBD = 0;
    playerBD.y = GROUND_Y - playerBD.height; playerBD.velocityY = 0; playerBD.isGrounded = true;
    loop();
}

function runBlockDashEngine() {
    ctx.fillStyle = "#09091b"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    bgOffset = (bgOffset - speedBD * 0.3) % 40; ctx.strokeStyle = "rgba(0, 100, 255, 0.12)";
    for(let x=bgOffset; x<canvas.width; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,GROUND_Y); ctx.stroke(); }
    ctx.fillStyle = "#04040a"; ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height-GROUND_Y);
    ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 4; ctx.shadowBlur = 12; ctx.shadowColor = "#00ffcc";
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(canvas.width, GROUND_Y); ctx.stroke(); ctx.shadowBlur = 0;

    if(++spawnTimerBD >= nextSpawnDelayBD) {
        obstacles.push({ x: canvas.width, width: 32, height: 45 });
        if(Math.random() > 0.4) coinsBD.push({ x: canvas.width+100, y: GROUND_Y - 80, radius: 12 });
        spawnTimerBD = 0; nextSpawnDelayBD = 60 + Math.random()*60;
    }

    playerBD.velocityY += GRAVITY; playerBD.y += playerBD.velocityY;
    let trailColor = inventory[playerBD.activeTrail].color;

    if (playerBD.y >= GROUND_Y - playerBD.height) {
        playerBD.y = GROUND_Y - playerBD.height; playerBD.velocityY = 0; playerBD.isGrounded = true;
        playerBD.rotation = Math.round(playerBD.rotation / 90) * 90;
        if(Math.random() > 0.4) particles.push({ x: playerBD.x, y: GROUND_Y-5, vx: -2, vy: -Math.random()*2, alpha: 1, size: 3 });
    } else {
        playerBD.rotation += speedBD * 0.8;
        particles.push({ x: playerBD.x + 10, y: playerBD.y + 20, vx: -1, vy: (Math.random()-0.5)*2, alpha: 1, size: 4 });
    }

    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.04;
        if(p.alpha <=0) { particles.splice(i,1); continue; }
        ctx.fillStyle = trailColor; ctx.globalAlpha = p.alpha; ctx.fillRect(p.x, p.y, p.size, p.size);
    } ctx.globalAlpha = 1.0;

    ctx.save(); ctx.translate(playerBD.x + 20, playerBD.y + 20); ctx.rotate((playerBD.rotation*Math.PI)/180);
    ctx.fillStyle = "#00ffcc"; ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(-16, -16, 32, 32); ctx.restore();

    for(let i=coinsBD.length-1; i>=0; i--) {
        let c = coinsBD[i]; c.x -= speedBD;
        ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2); ctx.fill();
        if(Math.abs(c.x - (playerBD.x+20)) < 32 && Math.abs(c.y - (playerBD.y+20)) < 32) { wallet.coins++; updateWalletUI(); coinsBD.splice(i,1); continue; }
        if(c.x < -20) coinsBD.splice(i,1);
    }

    for(let i=obstacles.length-1; i>=0; i--) {
        let o = obstacles[i]; o.x -= speedBD;
        ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.moveTo(o.x, GROUND_Y); ctx.lineTo(o.x+16, GROUND_Y-o.height); ctx.lineTo(o.x+32, GROUND_Y); ctx.fill();
        if(playerBD.x < o.x+32 && playerBD.x+40 > o.x && playerBD.y+40 > GROUND_Y-o.height) {
            gameActive = false; ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = "#fff"; ctx.font = "bold 30px sans-serif"; ctx.fillText("CRASHED!", 330, 200);
            setTimeout(() => { switchGameMode("block-dash-menu"); }, 1200); return;
        }
        if(o.x < -32) { obstacles.splice(i,1); scoreBD++; }
    }
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif"; ctx.fillText(`SCORE: ${scoreBD}`, 20, 40);
}

function loop() {
    if (!gameActive) return;
    if (activeSystemEngine === "BLOCK_DASH") runBlockDashEngine();
    else if (activeSystemEngine === "RACING_MASTER") runRacingMasterEngine();
    requestAnimationFrame(loop);
}
updateWalletUI();
