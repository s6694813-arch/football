const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
let myId = null, mySlot = null, gameState = null;
const keys = {up:false,down:false,left:false,right:false,sprint:false,action:false};
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${wsProtocol}//${location.host}`);

socket.addEventListener("open", () => $("connection").textContent = "Connected");
socket.addEventListener("close", () => $("connection").textContent = "Disconnected");
socket.addEventListener("message", ev => {
  const msg = JSON.parse(ev.data);
  if (msg.type === "full") { $("connection").textContent = "Match full (2/2)"; return; }
  if (msg.type === "welcome") { myId = msg.id; mySlot = msg.slot; $("connection").textContent = `You are Player ${mySlot+1}`; }
  if (msg.type === "state") {
    gameState = msg.state;
    $("homeScore").textContent = gameState.score.home;
    $("awayScore").textContent = gameState.score.away;
    $("message").textContent = gameState.message;
  }
});

function sendInput() {
  if (socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({type:"input",input:keys}));
}
window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  const map = {w:"up",arrowup:"up",s:"down",arrowdown:"down",a:"left",arrowleft:"left",d:"right",arrowright:"right",shift:"sprint"," ":"action"};
  if (map[k]) { keys[map[k]]=true; sendInput(); e.preventDefault(); }
});
window.addEventListener("keyup", e => {
  const k = e.key.toLowerCase();
  const map = {w:"up",arrowup:"up",s:"down",arrowdown:"down",a:"left",arrowleft:"left",d:"right",arrowright:"right",shift:"sprint"," ":"action"};
  if (map[k]) { keys[map[k]]=false; sendInput(); e.preventDefault(); }
});
document.querySelectorAll("[data-key]").forEach(btn => {
  const key = btn.dataset.key;
  const down = e => { e.preventDefault(); keys[key]=true; sendInput(); };
  const up = e => { e.preventDefault(); keys[key]=false; sendInput(); };
  btn.addEventListener("pointerdown",down);
  btn.addEventListener("pointerup",up);
  btn.addEventListener("pointerleave",up);
  btn.addEventListener("pointercancel",up);
});

function drawField() {
  ctx.clearRect(0,0,900,520);
  ctx.fillStyle="#197c43";ctx.fillRect(0,0,900,520);
  // Alternating turf stripes
  for(let x=0;x<900;x+=100){ctx.fillStyle=x%200===0?"#21884c":"#197c43";ctx.fillRect(x,0,100,520);}
  // End zones
  ctx.fillStyle="#164d91";ctx.fillRect(0,0,48,520);
  ctx.fillStyle="#9b2525";ctx.fillRect(852,0,48,520);
  ctx.strokeStyle="#fff";ctx.lineWidth=3;
  ctx.strokeRect(48,18,804,484);
  for(let x=100;x<850;x+=50){
    ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,502);ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=1;ctx.stroke();
  }
  for(let y=68;y<500;y+=50){
    ctx.beginPath();ctx.moveTo(48,y);ctx.lineTo(852,y);ctx.strokeStyle="rgba(255,255,255,.13)";ctx.stroke();
  }
  ctx.fillStyle="#fff";ctx.font="bold 18px system-ui";ctx.textAlign="center";
  ctx.save();ctx.translate(24,260);ctx.rotate(-Math.PI/2);ctx.fillText("PLAYER 2 TD",0,0);ctx.restore();
  ctx.save();ctx.translate(876,260);ctx.rotate(Math.PI/2);ctx.fillText("PLAYER 1 TD",0,0);ctx.restore();
  ctx.font="bold 12px system-ui";ctx.fillText("50",450,38);
  if(!gameState)return;
  const ball=gameState.ball;
  if(ball){
    ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(-.25);
    ctx.fillStyle="#8b4b20";ctx.beginPath();ctx.ellipse(0,0,12,7,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();ctx.restore();
  }
  Object.values(gameState.players||{}).forEach(p=>{
    ctx.fillStyle="#07131d55";ctx.beginPath();ctx.ellipse(p.x,p.y+14,18,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,17,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle="#fff";ctx.font="bold 10px system-ui";ctx.textAlign="center";ctx.fillText(p.slot===0?"1":"2",p.x,p.y+4);
    ctx.font="bold 11px system-ui";ctx.fillText(p.name,p.x,p.y-26);
    if(p.id===myId){ctx.strokeStyle="#ffe08a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,23,0,Math.PI*2);ctx.stroke();}
  });
  if(Object.keys(gameState.players||{}).length<2){
    ctx.fillStyle="#fff";ctx.font="bold 24px system-ui";ctx.textAlign="center";ctx.fillText("WAITING FOR PLAYER 2...",450,260);
  }
}
function loop(){drawField();requestAnimationFrame(loop)} loop();
