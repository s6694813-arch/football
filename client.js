const canvas=document.getElementById('field'),g=canvas.getContext('2d');
const W=900,FLOOR=365,keys={left:false,right:false,jump:false,pass:false};
let player={x:180,y:FLOOR,vx:0,vy:0,ground:true,hasBall:true,dir:1};
let bot={x:680,y:FLOOR,vx:0,vy:0,ground:true,hasBall:false,dir:-1};
let ball={x:180,y:FLOOR-24,vx:0,vy:0,owner:'player'};
let score=[0,0],message='You have the ball! Run to the right end zone!',gameOver=false,lastPass=false;
const status=document.getElementById('status');status.textContent='VS BOT';
document.getElementById('message').textContent=message;
function setKey(k,v){keys[k]=v}
const map={a:'left',arrowleft:'left',d:'right',arrowright:'right',w:'jump',arrowup:'jump',' ':'pass'};
onkeydown=e=>{let k=map[e.key.toLowerCase()];if(k){if(k==='pass'&&!keys.pass)throwBall();setKey(k,true);e.preventDefault()}};
onkeyup=e=>{let k=map[e.key.toLowerCase()];if(k){setKey(k,false);e.preventDefault()}};
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;const down=e=>{e.preventDefault();if(k==='pass'&&!keys.pass)throwBall();setKey(k,true)},up=e=>{e.preventDefault();setKey(k,false)};b.onpointerdown=down;b.onpointerup=up;b.onpointerleave=up;b.onpointercancel=up});
function msg(t){message=t;document.getElementById('message').textContent=t}
function reset(who){player={x:who==='player'?180:720,y:FLOOR,vx:0,vy:0,ground:true,hasBall:who==='player',dir:1};bot={x:who==='bot'?180:720,y:FLOOR,vx:0,vy:0,ground:true,hasBall:who==='bot',dir:-1};ball={x:player.x,y:FLOOR-24,vx:0,vy:0,owner:who};gameOver=false;lastPass=false;msg(who==='player'?'Your ball! Get to the right end zone!':'Bot has the ball! Stop it!')}
function throwBall(){if(ball.owner!=='player'||gameOver)return;ball.owner=null;ball.x=player.x+player.dir*20;ball.y=player.y-25;ball.vx=player.dir*8;ball.vy=-3;lastPass=true;msg('PASS! Go catch it!')}
function move(p,left,right,speed){if(left){p.vx=-speed;p.dir=-1}else if(right){p.vx=speed;p.dir=1}else p.vx*=.78;p.x=Math.max(55,Math.min(845,p.x+p.vx));p.y+=p.vy;p.vy+=.65;if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.ground=true}else p.ground=false}
function scorePoint(who){score[who==='player'?0:1]++;document.getElementById('s0').textContent=score[0];document.getElementById('s1').textContent=score[1];msg(who==='player'?'TOUCHDOWN! YOU SCORED!':'BOT SCORES!');gameOver=true;setTimeout(()=>reset(who==='player'?'bot':'player'),1500)}
function update(){if(!gameOver){move(player,keys.left,keys.right,3.8);if(keys.jump&&player.ground){player.vy=-11;player.ground=false;keys.jump=false}
// Bot chases the ball carrier or loose ball, and tries to tackle.
let target=ball.owner===null?ball:player;
let dir=ball.owner==='bot'?-1:Math.sign(target.x-bot.x);move(bot,dir<0,dir>0,2.55);if(bot.ground&&Math.abs(target.x-bot.x)<115&&Math.random()<.025)bot.vy=-8;
if(ball.owner==='player'){ball.x=player.x+player.dir*17;ball.y=player.y-24;if(Math.abs(player.x-bot.x)<27&&Math.abs(player.y-bot.y)<38){reset('bot');msg('TACKLED! Bot gets the ball!')}}else if(ball.owner==='bot'){ball.x=bot.x- bot.dir*17;ball.y=bot.y-24;if(Math.abs(player.x-bot.x)<28&&Math.abs(player.y-bot.y)<38){reset('player');msg('GREAT TACKLE! You got the ball!')}}else{ball.x+=ball.vx;ball.y+=ball.vy;ball.vy+=.35;ball.vx*=.99;if(ball.y>FLOOR-8){ball.y=FLOOR-8;ball.vy*=-.45}if(Math.abs(ball.x-player.x)<25&&Math.abs(ball.y-(player.y-22))<35){ball.owner='player';lastPass=false;msg('CATCH! Run for the end zone!')}else if(Math.abs(ball.x-bot.x)<25&&Math.abs(ball.y-(bot.y-22))<35){ball.owner='bot';msg('Bot intercepted the pass!')}}
if(ball.owner==='player'&&player.x>830)scorePoint('player');if(ball.owner==='bot'&&bot.x<70)scorePoint('bot');}
draw();requestAnimationFrame(update)}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)}
function drawPlayer(p,isBot){let x=p.x,y=p.y;rect(x-12,y-30,24,25,isBot?'#286bd0':'#d93434');rect(x-10,y-38,20,10,'#f0c49a');rect(x-13,y-41,26,7,'#242b36');rect(x-10,y-5,8,17,'#eee');rect(x+3,y-5,8,17,'#eee');rect(x-11,y+10,9,5,'#252b35');rect(x+3,y+10,10,5,'#252b35');rect(x-16,y-26,7,15,isBot?'#174c9d':'#a91f2c');rect(x+9,y-26,7,15,isBot?'#174c9d':'#a91f2c');if(!isBot){rect(x-19,y-53,38,3,'#ffe36c');g.fillStyle='#fff';g.font='bold 12px monospace';g.textAlign='center';g.fillText('YOU',x,y-60)}else{g.fillStyle='#fff';g.font='bold 12px monospace';g.textAlign='center';g.fillText('BOT',x,y-50)}}
function draw(){rect(0,0,900,500,'#35964b');rect(0,0,900,48,'#253047');rect(0,452,900,48,'#253047');for(let x=8;x<900;x+=18){rect(x,10,8,8,'#e7e7e7');rect(x,470,8,8,'#ffcf62')}for(let x=0;x<900;x+=100)rect(x,48,100,404,x%200===0?'#3ca653':'#35964b');rect(0,48,55,404,'#286bd0');rect(845,48,55,404,'#a72d36');for(let x=100;x<900;x+=50)rect(x,48,3,404,'#d8efd2');rect(55,48,790,3,'#fff');rect(55,449,790,3,'#fff');g.fillStyle='#fff';g.font='bold 20px monospace';g.textAlign='center';g.save();g.translate(27,250);g.rotate(-Math.PI/2);g.fillText('BOT END ZONE',0,0);g.restore();g.save();g.translate(873,250);g.rotate(Math.PI/2);g.fillText('YOUR END ZONE',0,0);g.restore();drawPlayer(player,false);drawPlayer(bot,true);rect(ball.x-10,ball.y-5,20,10,'#7a3f1b');rect(ball.x-5,ball.y-2,10,3,'#fff')}
update();
