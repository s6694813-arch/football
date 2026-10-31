const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  const file = req.url === "/" ? "index.html" : req.url.split("?")[0].slice(1);
  const full = path.join(__dirname, file);
  if (!full.startsWith(__dirname)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const ext = path.extname(full);
    res.writeHead(200, { "Content-Type": ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html" });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const players = new Map();
let nextId = 1;
const FIELD = { w: 900, h: 520 };
const state = {
  players: {},
  ball: { x: 450, y: 260, carrier: null, vx: 0, vy: 0 },
  score: { home: 0, away: 0 },
  message: "Waiting for another player..."
};

function sendAll() {
  const payload = JSON.stringify({ type: "state", state });
  for (const ws of wss.clients) if (ws.readyState === WebSocket.OPEN) ws.send(payload);
}
function resetPlay() {
  const ids = [...players.keys()];
  state.ball = { x: 450, y: 260, carrier: ids[0] || null, vx: 0, vy: 0 };
  for (const id of ids) {
    const p = state.players[id];
    if (p) { p.x = id === ids[0] ? 300 : 600; p.y = 260; p.hasBall = id === ids[0]; }
  }
  state.message = "New play! Player 1 attacks right; Player 2 attacks left.";
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

wss.on("connection", ws => {
  if (players.size >= 2) {
    ws.send(JSON.stringify({ type: "full" }));
    ws.close();
    return;
  }
  const id = String(nextId++);
  const slot = players.size;
  players.set(id, ws);
  state.players[id] = {
    id, slot, x: slot === 0 ? 300 : 600, y: 260,
    color: slot === 0 ? "#e33b3b" : "#3478e5",
    name: slot === 0 ? "PLAYER 1" : "PLAYER 2",
    hasBall: slot === 0, facing: slot === 0 ? 1 : -1,
    input: { up:false, down:false, left:false, right:false, sprint:false, action:false }
  };
  if (players.size === 1) state.ball.carrier = id;
  if (players.size === 2) resetPlay();

  ws.send(JSON.stringify({ type: "welcome", id, slot }));
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const p = state.players[id];
    if (!p) return;
    if (msg.type === "input") {
      p.input = {
        up: !!msg.input.up, down: !!msg.input.down,
        left: !!msg.input.left, right: !!msg.input.right,
        sprint: !!msg.input.sprint, action: !!msg.input.action
      };
    }
    if (msg.type === "name" && typeof msg.name === "string") {
      p.name = msg.name.slice(0, 14).toUpperCase();
    }
  });
  ws.on("close", () => {
    players.delete(id);
    delete state.players[id];
    if (state.ball.carrier === id) state.ball.carrier = null;
    state.message = "A player disconnected. Waiting for another player...";
    sendAll();
  });
  sendAll();
});

setInterval(() => {
  const ids = [...players.keys()];
  for (const id of ids) {
    const p = state.players[id];
    if (!p) continue;
    const i = p.input;
    let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
    let dy = (i.down ? 1 : 0) - (i.up ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    const speed = i.sprint ? 4.2 : 2.8;
    p.x = clamp(p.x + dx / len * speed, 35, FIELD.w - 35);
    p.y = clamp(p.y + dy / len * speed, 65, FIELD.h - 35);
    if (dx) p.facing = Math.sign(dx);
  }

  const carrierId = state.ball.carrier;
  const carrier = carrierId && state.players[carrierId];
  if (carrier) {
    carrier.hasBall = true;
    state.ball.x = carrier.x + carrier.facing * 15;
    state.ball.y = carrier.y - 4;
    // Press action to throw a forward pass. The ball travels briefly and can be caught.
    if (carrier.input.action && !carrier._actionWasDown) {
      state.ball.carrier = null;
      state.ball.vx = carrier.facing * 8;
      state.ball.vy = 0;
      state.ball.x = carrier.x + carrier.facing * 20;
      state.ball.y = carrier.y;
      state.message = "Pass in the air!";
    }
    carrier._actionWasDown = carrier.input.action;
  }

  if (!state.ball.carrier) {
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;
    state.ball.vx *= 0.985;
    state.ball.vy *= 0.985;
    for (const id of ids) {
      const p = state.players[id];
      if (p && Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < 25) {
        state.ball.carrier = id; p.hasBall = true;
        state.ball.vx = state.ball.vy = 0;
        state.message = `${p.name} caught the ball!`;
        break;
      }
    }
    if (state.ball.x < 0 || state.ball.x > FIELD.w || state.ball.y < 0 || state.ball.y > FIELD.h) {
      resetPlay();
    }
  }

  // Tag/tackle: defender gets close to the ball carrier to end the play.
  if (carrier && ids.length === 2) {
    const defender = ids.map(id => state.players[id]).find(p => p && p.id !== carrierId);
    if (defender && Math.hypot(defender.x - carrier.x, defender.y - carrier.y) < 25) {
      carrier.hasBall = false;
      state.ball.carrier = null;
      state.message = `${defender.name} made the tackle!`;
      setTimeout(() => { if (players.size === 2) resetPlay(); }, 900);
    }
  }

  // Touchdowns: each player attacks the opposite end zone.
  if (carrier && ((carrier.slot === 0 && carrier.x > 850) || (carrier.slot === 1 && carrier.x < 50))) {
    state.score[carrier.slot === 0 ? "home" : "away"]++;
    state.message = `TOUCHDOWN ${carrier.name}!`;
    carrier.hasBall = false;
    state.ball.carrier = null;
    setTimeout(() => { if (players.size === 2) resetPlay(); }, 1200);
  }
  sendAll();
}, 1000 / 30);

server.listen(PORT, () => console.log(`Football game running on http://localhost:${PORT}`));
