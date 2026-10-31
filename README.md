# 1v1 Football Online

A small real-time browser football game for two players.

## Run it on your computer
1. Install Node.js (LTS).
2. Open a terminal in this folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000` in your browser.

To play with a friend over the internet, deploy this folder to a Node.js hosting service that supports WebSockets, then share the hosted URL. Both players open the same URL. The first two connections become Player 1 and Player 2.

## Controls
- Move: WASD or arrow keys
- Sprint: Shift
- Pass: Space
- Phones/tablets: on-screen buttons

## Current prototype rules
- Player 1 attacks the right end zone.
- Player 2 attacks the left end zone.
- Carry the ball into the opponent's end zone for a touchdown.
- Get close to the ball carrier to make a tackle.
- Space passes the ball forward; either player can catch it.

This is a starter prototype, not a finished competitive game. It currently has no accounts, matchmaking, anti-cheat, or persistent stats.
