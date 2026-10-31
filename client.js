const canvas=document.getElementById('field'),g=canvas.getContext('2d');
const W=900,FLOOR=365,keys={left:false,right:false,jump:false};
let player,bot,receivers,ball,score=[0,0],message='',gameOver=false,playClock=0,passFlight=null;
const status=document.getElementById('status');status.textContent='VS CPU';
function makeReceiver(id,x,y,route){return {id,x,y,baseY:y,vx:0,route,phase:Math.random()*6,open:false,hasBall:false};}
function reset(){player={x:170,y:FLOOR,vx:0,vy:0,ground:true,dir:1};bot={x:700,y:FLOOR,vx:0,vy:0,ground:true,dir:-1};receivers=[makeReceiver(1,330,270,'deep'),makeReceiver(2,430,320,'middle'),makeReceiver(3,530,245,'wide')];ball={x:player.x,y:player.y-24,owner:'player',vx:0,vy:0};passFlight=null;gameOver=false;playClock=0;msg('Move left and right. TAP A TEAMMATE when they are OPEN to pass!');}
function msg(t){message=t;document.getElementById('message').textContent=t;}
function setKey(k,v){keys[k]=v;}
const keymap={a:'left',arrowleft:'left',d:'right',arrowright:'right',w:'jump',arrowup:'jump'};
onkeydown=e=>{const k=keymap[e.key.toLowerCase()];if(k){setKey(k,true);e.preventDefault()}if(e.key===' '){passToBest();e.preventDefault()}};
onkeyup=e=>{const k=keymap[e.key.toLowerCase()];if(k){setKey(k,false);e.preventDefault()}};
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;const down=e=>{e.preventDefault();setKey(k,true)},up=e=>{e.preventDefault();setKey(k,false)};b.onpointerdown=down;b.onpointerup=up;b.onpointerleave=up;b.onpointercancel=up;});
function canvasPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*500/r.height};}
canvas.addEventListener('pointerdown',e=>{const p=canvasPoint(e);let r=receivers.find(q=>Math.hypot(q.x-p.x,(q.y-22)-p.y)<45);if(r)throwTo(r);});
function move(p,left,right,speed){if(left){p.vx=-speed;p.dir=-1}else if(right){p.vx=speed;p.dir=1}else p.vx*=.78;p.x=Math.max(55,Math.min(845,p.x+p.vx));p.y+=p.vy;p.vy+=.65;if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.ground=true}else p.ground=false;}
function receiverOpen(r){const defenderGap=Math.abs(bot.x-r.x);return defenderGap>105 && Math.abs(r.x-player.x)>65;}
function throwTo(r){if(ball.owner!=='player'||gameOver||passFlight)return;const accurate=r.open;const targetX=r.x+(accurate?0:(Math.random()-.5)*150);const targetY=r.y-25+(accurate?0:(Math.random()-.5)*85);const dx=targetX-player.x,dy=targetY-(player.y-24);const frames=34;passFlight={target:r,accurate,frames,left:frames,startX:player.x+15,startY:player.y-28,endX:targetX,endY:targetY};ball.owner=null;ball.x=passFlight.startX;ball.y=passFlight.startY;msg(accurate?'PERFECT TIMING! Pass is on the way!':'RUSHED PASS! The throw may be off target!');}
function passToBest(){if(ball.owner!=='player')return;const r=[...receivers].sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];if(r)throwTo(r);}
function scorePoint(who){score[who==='you'?0:1]++;document.getElementById('s0').textContent=score[0];document.getElementById('s1').textContent=score[1];msg(who==='you'?'TOUCHDOWN! YOUR TEAM SCORES!':'CPU TOUCHDOWN!');gameOver=true;setTimeout(reset,1800);}
function update(){if(!gameOver){playClock++;move(player,keys.left,keys.right,3.8);if(keys.jump&&player.ground){player.vy=-11;player.ground=false;keys.jump=false;}
// Teammates run different routes and turn green when a safe passing window opens.
receivers.forEach((r,i)=>{r.phase+=.035+i*.008;r.x+=r.route==='deep'?1.05:r.route==='middle'?.7:1.25;r.y=r.baseY+Math.sin(r.phase)*18;if(r.x>820)r.x=260+i*65;r.open=receiverOpen(r);if(ball.owner===`r${r.id}`){r.x=Math.min(845,r.x+2.4);r.y=FLOOR;}});
// CPU defender tracks the ball or nearest receiver.
let target=player;if(ball.owner==='bot')target=bot;else if(ball.owner&&String(ball.owner).startsWith('r'))target=receivers.find(r=>`r${r.id}`===ball.owner)||player;else if(passFlight)target=passFlight.target;else if(ball.owner===null)target={x:ball.x,y:ball.y};
let dx=target.x-bot.x;move(bot,dx<0,dx>0,2.65);if(bot.ground&&Math.abs(dx)<120&&Math.random()<.018)bot.vy=-8;
if(ball.owner==='player'){ball.x=player.x+player.dir*17;ball.y=player.y-24;if(Math.abs(player.x-bot.x)<27&&Math.abs(player.y-bot.y)<38){msg('TACKLED! You lost the ball.');resetAfterMessage();}}
else if(ball.owner==='bot'){ball.x=bot.x-bot.dir*17;ball.y=bot.y-24;if(Math.abs(player.x-bot.x)<28&&Math.abs(player.y-bot.y)<38){msg('GREAT TACKLE! You got it back!');ball.owner='player';}}
else if(ball.owner&&String(ball.owner).startsWith('r')){const r=receivers.find(q=>`r${q.id}`===ball.owner);if(r){ball.x=r.x+12;ball.y=r.y-25;if(Math.abs(r.x-bot.x)<27){msg('CPU tackled your receiver!');resetAfterMessage();}}}
else if(passFlight){const p=passFlight;p.left--;let t=1-p.left/p.frames;ball.x=p.startX+(p.endX-p.startX)*t;ball.y=p.startY+(p.endY-p.startY)*t-65*Math.sin(Math.PI*t);if(p.left<=0){let r=p.target;if(p.accurate&&Math.abs(bot.x-r.x)>35){ball.owner=`r${r.id}`;r.y=FLOOR;msg('CAUGHT! Your teammate has it! Keep moving!');}else{ball.owner= Math.abs(bot.x-ball.x)<90?'bot':null;msg(ball.owner==='bot'?'INTERCEPTED BY CPU!':'INCOMPLETE PASS!');}passFlight=null;}}
else{ball.x+=ball.vx;ball.y+=ball.vy;ball.vy+=.35;}
if(ball.owner==='player'&&player.x>830)scorePoint('you');if(ball.owner&&String(ball.owner).startsWith('r')){let r=receivers.find(q=>`r${q.id}`===ball.owner);if(r&&r.x>830)scorePoint('you');}if(ball.owner==='bot'&&bot.x<70)scorePoint('bot');
}draw();requestAnimationFrame(update);}
let resetTimer=false;function resetAfterMessage(){if(resetTimer)return;resetTimer=true;gameOver=true;setTimeout(()=>{resetTimer=false;reset();},900);}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);}
function drawPlayer(p,kind,label){let x=p.x,y=p.y;const c=kind==='bot'?'#286bd0':'#d93434';rect(x-12,y-30,24,25,c);rect(x-10,y-38,20,10,'#f0c49a');rect(x-13,y-41,26,7,'#242b36');rect(x-10,y-5,8,17,'#eee');rect(x+3,y-5,8,17,'#eee');rect(x-11,y+10,9,5,'#252b35');rect(x+3,y+10,10,5,'#252b35');rect(x-16,y-26,7,15,kind==='bot'?'#174c9d':'#a91f2c');rect(x+9,y-26,7,15,kind==='bot'?'#174c9d':'#a91f2c');g.fillStyle='#fff';g.font='bold 12px monospace';g.textAlign='center';g.fillText(label,x,y-50);}
function draw(){rect(0,0,900,500,'#35964b');rect(0,0,900,48,'#253047');rect(0,452,900,48,'#253047');for(let x=8;x<900;x+=18){rect(x,10,8,8,'#e7e7e7');rect(x,470,8,8,'#ffcf62');}for(let x=0;x<900;x+=100)rect(x,48,100,404,x%200===0?'#3ca653':'#35964b');rect(0,48,55,404,'#286bd0');rect(845,48,55,404,'#a72d36');for(let x=100;x<900;x+=50)rect(x,48,3,404,'#d8efd2');rect(55,48,790,3,'#fff');rect(55,449,790,3,'#fff');g.fillStyle='#fff';g.font='bold 20px monospace';g.textAlign='center';g.save();g.translate(27,250);g.rotate(-Math.PI/2);g.fillText('CPU END ZONE',0,0);g.restore();g.save();g.translate(873,250);g.rotate(Math.PI/2);g.fillText('YOUR END ZONE',0,0);g.restore();
receivers.forEach(r=>{const color=r.open?'#55ff9a':'#ffdb65';g.strokeStyle=color;g.lineWidth=4;g.beginPath();g.arc(r.x,r.y-22,24,0,Math.PI*2);g.stroke();drawPlayer({x:r.x,y:r.y},'you',r.open?'OPEN!':'#'+r.id);});drawPlayer(player,'you','YOU');drawPlayer(bot,'bot','CPU');rect(ball.x-10,ball.y-5,20,10,'#7a3f1b');rect(ball.x-5,ball.y-2,10,3,'#fff');g.fillStyle='#fff';g.font='bold 13px monospace';g.textAlign='left';g.fillText('TAP A TEAMMATE TO PASS',18,70);}
reset();update();
