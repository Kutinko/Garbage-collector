let CANVAS_WIDTH = 1024;
let CANVAS_HEIGHT = 576;

const SAFE_EDGE = 40;
const CHARACTER_HEIGHT = 60;

const HUD_LEFT = 10;
const HUD_GUTTER = 160;
const BAR_W = 220;
const BAR_H = 12;

let gameState = 'menu';

let mainMenuImg, startImg, startImgPress, gameLostImg, victoryWindowImg;
const START_SCALE = 0.5;
let startBtnBounds = { x:0, y:0, w:0, h:0 };
let startPressed = false;
let replayBtnBounds = { x:0, y:0, w:0, h:0 };

/* zvuky */
let sfxBonus, sfxMilestone, sfxWin, sfxLose;
let sfxPickup, sfxDrop, sfxPress, sfxAmbient;

let imgCity, imgWalkMask;
let playerSheet, npcSheets = [];
let smallTrashImages = [], bigTrashImage, litterImage, bonusImage;
let treeSmallImg, treeBigImg;

let milestoneSheet;
const MILESTONE_SIZE = 128;
const MILESTONE_DRAW = 40;
let milestoneFlashTimer = 0;

let player, trash = [], bins = [], npcs = [], bonuses = [], trees = [];
let score = 0, pollution = 0, gameOver = false, gameWon = false;
let stars = 0, currentMilestoneIndex = 0;

/* linearne milestone s krokom 300 od 160 */
const MILESTONES = [160, 460, 760, 1060, 1360, 1660, 1960, 2260, 2560, 2860];

/* znecistenie a bonusy */
const POLLUTION_MAX = 100;
const POLLUTE_SMALL = 3;
const POLLUTE_LARGE = 5;

const BONUS_DURATION_FRAMES = 60 * 10;
const BONUS_SPEED_MULT = 1.5;
const BONUS_RADIUS_MULT = 3.2;
const BONUS_SPAWN_CHANCE = 0.08;
let lastBonusKind = null;
const DOUBLE_BONUS_PROB = 0.12;

const SMALL_TRASH_TARGET_PX = 24;
const LARGE_TRASH_TARGET_PX = 42;

/* spawn odpadu rychlejsi po milestone */
const TRASH_INTERVAL_MIN = 900;
const TRASH_INTERVAL_MAX = 1400;
const TRASH_INTERVAL_FACTOR = 0.85;
const TRASH_INTERVAL_MIN_CAP = 300;

function nextTrashInterval(){
  const base = random(TRASH_INTERVAL_MIN, TRASH_INTERVAL_MAX);
  const scaled = base * Math.pow(TRASH_INTERVAL_FACTOR, stars);
  return max(TRASH_INTERVAL_MIN_CAP, floor(scaled));
}

const treeConfigs = [
  { x: 574, y: 300, url: 'https://raw.githubusercontent.com/Kutinko/Garbage-collector/86d78e18b38fc28de4087ef1c141080559ed880d/tree-small.png', scale: 1 },
  { x: 255, y: 255, url: 'https://raw.githubusercontent.com/Kutinko/Garbage-collector/86d78e18b38fc28de4087ef1c141080559ed880d/tree-big.png',   scale: 1 }
];

function preload(){
  imgCity = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/main/city.png');
  imgWalkMask = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/main/city_cesty.jpg');

  playerSheet = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/32448dd762fc91a44faecb1d39df02a814b30cd5/player-walking.png');
  npcSheets = [
    loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/979b9c0c7c2b7ee79ceaf3db61f05936280e7b7f/char_01.png'),
    loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/979b9c0c7c2b7ee79ceaf3db61f05936280e7b7f/char_02.png'),
    loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/979b9c0c7c2b7ee79ceaf3db61f05936280e7b7f/char_03.png')
  ];

  const smallFiles = ['T01.png','T02.png','T03.png','T04.png'];
  for (const f of smallFiles) smallTrashImages.push(loadImage(`https://raw.githubusercontent.com/Kutinko/Garbage-collector/main/${f}`));
  bigTrashImage = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/main/T_big.png');

  /* aktualizovane assety */
  litterImage = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/75392b5c2b769513be189e668da895682a20d1ce/litter.png?v=20250809');
  bonusImage = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/main/powerup.png');

  treeSmallImg = loadImage(treeConfigs[0].url);
  treeBigImg   = loadImage(treeConfigs[1].url);

  milestoneSheet = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/845969e2a053e0f3f12024d8252b1160d73caefe/milestones.png');

  mainMenuImg   = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/89387426b3ddb5073fe21be7adbed7a6decc417f/main%20menu.png');
  startImg      = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/89387426b3ddb5073fe21be7adbed7a6decc417f/button---start-game.png');
  startImgPress = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/89387426b3ddb5073fe21be7adbed7a6decc417f/button---start-game-press.png');

  /* aktualizovane okna prehry a vyhry */
  gameLostImg = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/75392b5c2b769513be189e668da895682a20d1ce/game%20lost.png?v=20250809');
  victoryWindowImg = loadImage('https://raw.githubusercontent.com/Kutinko/Garbage-collector/75392b5c2b769513be189e668da895682a20d1ce/victory%20window.png?v=20250809');

  /* zvuky */
  sfxBonus = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/d441c78f498d24a704cd362f272e5d2144dedb3f/game-bonus-02-294436.mp3');
  sfxMilestone = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/d441c78f498d24a704cd362f272e5d2144dedb3f/level%20up.mp3');
  sfxWin = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/d441c78f498d24a704cd362f272e5d2144dedb3f/victory.mp3');
  sfxLose = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/d441c78f498d24a704cd362f272e5d2144dedb3f/you%20lost.mp3');

  sfxPickup = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/9ed3fa64db537b17a4e988e8e2b09010e0c7220e/pickup%20trash.mp3');
  /* aktualizovany zvuk vyhodenia */
  sfxDrop   = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/75392b5c2b769513be189e668da895682a20d1ce/drop%20trash.mp3?v=20250809');
  sfxPress  = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/9ed3fa64db537b17a4e988e8e2b09010e0c7220e/press%20button.mp3');

  sfxAmbient = loadSound('https://raw.githubusercontent.com/Kutinko/Garbage-collector/8460ed41d4cf70dc8e4d44327155844222ec65d3/street%20ambient.mp3');
}

function setup(){
  pixelDensity(1);
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  if (imgWalkMask) imgWalkMask.loadPixels();
  resetGame();

  if (sfxBonus) sfxBonus.setVolume(0.9);
  if (sfxMilestone) sfxMilestone.setVolume(0.9);
  if (sfxWin) sfxWin.setVolume(0.9);
  if (sfxLose) sfxLose.setVolume(0.9);
  if (sfxPickup) sfxPickup.setVolume(0.7);
  if (sfxDrop) sfxDrop.setVolume(0.8);
  if (sfxPress) sfxPress.setVolume(0.8);
  if (sfxAmbient) { sfxAmbient.setVolume(0.5); sfxAmbient.setLoop(true); }
}

function getStartPos(){
  return { x: width * 0.5, y: height * (420 / 576) };
}

function resetGame(){
  player = new Player(width/2, height/2);
  trash = [];
  bins = [ new Bin(width*0.5 - 50, height*0.5 + 50) ];
  npcs = []; bonuses = []; trees = [];

  for (let i=0;i<17;i++){
    const p = findNearestWalkable(random(width), random(height), 200);
    const sprite = npcSheets.length ? random(npcSheets) : null;
    const n = new NPC(p.x, p.y, i*0.1, sprite);
    n.pickNewTarget();
    npcs.push(n);
  }

  for (const cfg of treeConfigs){
    const img = cfg.url.includes('tree-big') ? treeBigImg : treeSmallImg;
    trees.push(new Tree(cfg.x, cfg.y, img, cfg.scale || 1));
  }

  score = 0;
  pollution = 0;
  stars = 0;
  currentMilestoneIndex = 0;
  milestoneFlashTimer = 0;
  gameOver = false;
  gameWon = false;

  gameState = 'menu';
  startPressed = false;
  updateStartBounds();
}

function stopAllAudioForNewRun(){
  if (sfxAmbient && sfxAmbient.isPlaying()) sfxAmbient.stop();
  if (sfxLose && sfxLose.isPlaying()) sfxLose.stop();
  if (sfxWin && sfxWin.isPlaying()) sfxWin.stop();
  if (sfxMilestone && sfxMilestone.isPlaying()) sfxMilestone.stop();
  if (sfxBonus && sfxBonus.isPlaying()) sfxBonus.stop();
  if (sfxPickup && sfxPickup.isPlaying()) sfxPickup.stop();
  if (sfxDrop && sfxDrop.isPlaying()) sfxDrop.stop();
}

function draw(){
  imageMode(CORNER);
  noTint();

  updateAmbient();

  if (gameState === 'menu'){
    drawMenu(false);
    return;
  }
  if (gameState === 'victory'){
    drawVictory();
    return;
  }

  if (gameOver){
    drawGameOver();
    return;
  }

  if (imgCity) image(imgCity,0,0,width,height); else background(100);

  player.update();

  for (let i=npcs.length-1;i>=0;i--){
    const n=npcs[i];
    n.update();
    n.throwTrashAndMaybeBonus();
    if(n.offMap){
      npcs.splice(i,1);
      const p=findNearestWalkable(random(width),random(height),200);
      const sprite = npcSheets.length ? random(npcSheets) : null;
      const nn=new NPC(p.x,p.y,random(), sprite);
      nn.pickNewTarget();
      npcs.push(nn);
    }
  }

  const Q = [];
  for (const t of trash) Q.push({ z: t.y, draw: () => t.show() });
  for (const b of bonuses) Q.push({ z: b.y, draw: () => b.show() });
  for (const n of npcs) Q.push({ z: n.y, draw: () => n.show() });
  Q.push({ z: player.y, draw: () => player.show() });
  for (const bin of bins) Q.push({ z: bin.y, draw: () => bin.show() });
  for (const tr of trees) Q.push({ z: tr.baseY, draw: () => tr.show() });
  Q.sort((a,b) => a.z - b.z);
  for (const it of Q) it.draw();

  for (let i=trash.length-1;i>=0;i--){
    if (player.collectTrash(trash[i])) trash.splice(i,1);
  }
  for (let i=bonuses.length-1;i>=0;i--){
    if (player.collectBonus(bonuses[i])) bonuses.splice(i,1);
  }

  for (let bin of bins){
    if (player.emptyInventory(bin)) {
      if (sfxDrop && getAudioContext().state === 'running') sfxDrop.play();
      score += player.inventoryLoad;
      player.inventoryLoad = 0;
      player.inventoryItems = [];
      checkMilestones();
    }
  }

  textSize(20);
  textAlign(LEFT);

  const scoreY = 30;
  fill(0);
  text('Score: ' + score, HUD_LEFT, scoreY);
  drawMilestoneProgressBarAt(HUD_LEFT + HUD_GUTTER, scoreY - BAR_H / 2, BAR_W, BAR_H);
  drawMilestoneIconAt(HUD_LEFT + HUD_GUTTER + BAR_W + 8, scoreY - 10);

  /* posun o desat pixelov vyssie */
  const polY = 70;
  fill(0);
  text('Pollution: ' + pollution.toFixed(0) + '%', HUD_LEFT, polY);
  drawPollutionBarAt(HUD_LEFT + HUD_GUTTER, polY - BAR_H / 2, BAR_W, BAR_H);

  if (!gameOver && pollution >= POLLUTION_MAX) {
    gameOver = true;
    if (sfxLose && getAudioContext().state === 'running') sfxLose.play();
  }

  if (milestoneFlashTimer > 0){
    milestoneFlashTimer--;
    push();
    noStroke();
    fill(255, 215, 0, map(milestoneFlashTimer, 0, 90, 0, 160));
    rect(0, 0, width, 64);
    fill(0);
    textAlign(CENTER);
    textSize(20);
    text('Milestone reached', width / 2, 40);
    pop();
  }

  drawActiveBonusesHUD();
}

/* ambient podla stavu hry */
function updateAmbient(){
  const wantAmbient = (gameState === 'menu' || gameState === 'playing') && !gameOver;
  if (!sfxAmbient || getAudioContext().state !== 'running') return;
  if (wantAmbient){
    if (!sfxAmbient.isPlaying()) sfxAmbient.play();
  } else {
    if (sfxAmbient.isPlaying()) sfxAmbient.stop();
  }
}

/* menu */
function drawMenu(isReplay){
  background(0);
  if (mainMenuImg){
    image(mainMenuImg, 0, 0, width, height);
  }
  fill(255);
textSize(20);
textAlign(LEFT, BOTTOM);

let instructions = [
  "Instructions",
  "• Use W A S D to move",
  "• Collect garbage and put it into the bin",
  "• Reach milestone 10 to earn your reward"
];

// 30 px od ľavého okraja a 30 px od spodku
let x = 30;
let y = height - 30;

// vykresľuj odspodu nahor
for (let i = instructions.length - 1; i >= 0; i--) {
  text(instructions[i], x, y);
  y -= 28; // posun o riadok hore
}

  const img = startPressed ? startImgPress : startImg;
  if (img){
    const pos = getStartPos();
    const w = img.width * START_SCALE;
    const h = img.height * START_SCALE;
    const x = pos.x - w / 2;
    const y = pos.y - h / 2;
    image(img, x, y, w, h);
    startBtnBounds = { x, y, w, h };

    if (isReplay){
      push();
      textAlign(CENTER, CENTER);
      textSize(20);
      fill(0);
      text('Replay', pos.x + 1, pos.y + 1);
      fill(255);
      text('Replay', pos.x, pos.y);
      pop();
    }
  }
  if (isMouseOverStart()) cursor(HAND); else cursor(ARROW);
}

function updateStartBounds(){
  if (startImg){
    const pos = getStartPos();
    const w = startImg.width * START_SCALE;
    const h = startImg.height * START_SCALE;
    startBtnBounds = {
      x: pos.x - w / 2,
      y: pos.y - h / 2,
      w, h
    };
  }
}

function isMouseOverStart(){
  return mouseX >= startBtnBounds.x && mouseX <= startBtnBounds.x + startBtnBounds.w &&
         mouseY >= startBtnBounds.y && mouseY <= startBtnBounds.y + startBtnBounds.h;
}

function mousePressed(){
  userStartAudio();

  if ((gameState === 'menu') && isMouseOverStart()){
    if (sfxPress && getAudioContext().state === 'running') sfxPress.play();
    startPressed = true;
  } else if ((gameState === 'victory' || gameOver) && isMouseOverReplay()){
    if (sfxPress && getAudioContext().state === 'running') sfxPress.play();
  }
}

function beginNewRunFromMenu(){
  score = 0;
  pollution = 0;
  stars = 0;
  currentMilestoneIndex = 0;
  milestoneFlashTimer = 0;
  gameOver = false;
  gameWon = false;

  trash = [];
  bonuses = [];
  npcs = [];
  for (let i=0;i<17;i++){
    const p = findNearestWalkable(random(width), random(height), 200);
    const sprite = npcSheets.length ? random(npcSheets) : null;
    const n = new NPC(p.x, p.y, i*0.1, sprite);
    n.pickNewTarget();
    npcs.push(n);
  }
}

function mouseReleased(){
  if (gameState === 'menu'){
    const wasPressed = startPressed;
    startPressed = false;
    if (wasPressed && isMouseOverStart()){
      stopAllAudioForNewRun();
      beginNewRunFromMenu();
      gameState = 'playing';
    }
  } else if (gameState === 'victory'){
    if (isMouseOverReplay()){
      stopAllAudioForNewRun();
      resetGame();
      beginNewRunFromMenu();
      gameState = 'playing';
    }
  } else if (gameOver){
    if (isMouseOverReplay()){
      stopAllAudioForNewRun();
      resetGame();
      beginNewRunFromMenu();
      gameState = 'playing';
    }
  }
}

/* game over vrstva bez duplicitneho titulku */
function drawGameOver(){
  if (gameLostImg) image(gameLostImg, 0, 0, width, height);
  else background(220,40,40);

  drawScoreAndMedal(width / 2, height / 2 - 40);

  const btnW = 220;
  const btnH = 64;
  const btnX = width / 2 - btnW / 2;
  const btnY = height / 2 + 40;

  const over = mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH;

  push();
  noStroke();
  fill(0, 120, 0, over ? 240 : 200);
  rect(btnX, btnY, btnW, btnH, 12);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text('Replay', btnX + btnW / 2, btnY + btnH / 2 + 2);
  pop();

  replayBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
  if (over) cursor(HAND); else cursor(ARROW);
}

/* okno vyhry so score a medailou */
function drawVictory(){
  background(0);
  if (victoryWindowImg){
    image(victoryWindowImg, 0, 0, width, height);
  }
  drawScoreAndMedal(width / 2, height / 2 - 20);

  const btnW = 220;
  const btnH = 64;
  const btnX = width / 2 - btnW / 2;
  const btnY = height / 2 + 60;

  const over = mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH;

  push();
  noStroke();
  fill(0, 120, 0, over ? 240 : 200);
  rect(btnX, btnY, btnW, btnH, 12);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text('Replay', btnX + btnW / 2, btnY + btnH / 2 + 2);
  pop();

  replayBtnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
  if (over) cursor(HAND); else cursor(ARROW);
}

/* pomocna kresba score a medaily pouziva milestoneSheet a pocet stars */
function drawScoreAndMedal(cx, cy){
  push();
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 140);
  textSize(28);
  text('Score: ' + score, cx + 1, cy + 1);
  fill(255);
  text('Score: ' + score, cx, cy);
  // malá ikonka milníka 10 vedľa score iba vo victory okne
if (gameState === 'victory' && milestoneSheet){
  const index = 9; // milník 10 je index 9
  const sx = index * MILESTONE_SIZE;
  const sy = 0;
  const drawSize = 32;

  // poloha vpravo od textu score
  textSize(28);
  const label = 'Score: ' + score;
  const halfW = textWidth(label) / 2;
  const iconX = cx + halfW + 12;
  const iconY = cy - drawSize / 2;

  image(milestoneSheet, iconX, iconY, drawSize, drawSize, sx, sy, MILESTONE_SIZE, MILESTONE_SIZE);
}


  if (milestoneSheet && stars > 0){
    const index = constrain(stars, 1, 10);
    const sx = index * MILESTONE_SIZE;
    const sy = 0;
    const drawSize = 80;
    image(milestoneSheet, cx - drawSize / 2, cy + 20, drawSize, drawSize, sx, sy, MILESTONE_SIZE, MILESTONE_SIZE);
    fill(255);
    textSize(16);
    text('Medal ' + index, cx, cy + 20 + drawSize + 18);
  }
  pop();
}

function isMouseOverReplay(){
  return mouseX >= replayBtnBounds.x && mouseX <= replayBtnBounds.x + replayBtnBounds.w &&
         mouseY >= replayBtnBounds.y && mouseY <= replayBtnBounds.y + replayBtnBounds.h;
}

/* milestone logika */
function checkMilestones(){
  let crossed = 0;
  while (currentMilestoneIndex < MILESTONES.length && score >= MILESTONES[currentMilestoneIndex]){
    stars++;
    currentMilestoneIndex++;
    crossed++;
  }

  if (crossed > 0){
    milestoneFlashTimer = 90;

    if (stars >= MILESTONES.length){
      gameWon = true;
      gameState = 'victory';
      if (sfxWin && getAudioContext().state === 'running') sfxWin.play();
      if (sfxAmbient && sfxAmbient.isPlaying()) sfxAmbient.stop();
    } else {
      if (sfxMilestone && getAudioContext().state === 'running') sfxMilestone.play();
    }
  }
}

/* HUD bary */
function drawMilestoneProgressBarAt(x, y, barW, barH){
  push();
  noStroke();
  fill(0,0,0,160);
  rect(x-1, y-1, barW+2, barH+2);

  if (stars >= MILESTONES.length){
    fill(60); rect(x, y, barW, barH);
    fill(0,200,80); rect(x, y, barW, barH);
    pop();
    return;
  }

  const prev = stars > 0 ? MILESTONES[stars - 1] : 0;
  const next = MILESTONES[stars];
  const span = max(1, next - prev);
  const gained = constrain(score - prev, 0, span);
  const ratio = gained / span;

  fill(60); rect(x, y, barW, barH);
  fill(0,200,80); rect(x, y, barW * ratio, barH);
  pop();
}

function drawMilestoneIconAt(dx, dy){
  if (!milestoneSheet) return;
  if (stars <= 0) return;
  let index = constrain(stars - 1, 0, 9);
  const sx = index * MILESTONE_SIZE;
  const sy = 0;
  image(milestoneSheet, dx, dy, MILESTONE_DRAW, MILESTONE_DRAW, sx, sy, MILESTONE_SIZE, MILESTONE_SIZE);
}

function drawPollutionBarAt(x, y, barW, barH){
  push();
  noStroke();
  fill(0,0,0,160);
  rect(x-1, y-1, barW+2, barH+2);

  const ratio = constrain(pollution / POLLUTION_MAX, 0, 1);
  fill(60);
  rect(x, y, barW, barH);
  if (ratio > 0){
    fill(200,0,0);
    rect(x, y, barW * ratio, barH);
  }
  pop();
}

/* bonus HUD posunuty doprostred dolu */
function drawActiveBonusesHUD(){
  const lines = [];
  const now = frameCount;
  if (player.speedBoostEndFrame > now){
    const s = max(0, (player.speedBoostEndFrame - now) / 60);
    lines.push('Speed boost ' + s.toFixed(1) + ' s');
  }
  if (player.radiusBoostEndFrame > now){
    const s = max(0, (player.radiusBoostEndFrame - now) / 60);
    lines.push('Radius boost ' + s.toFixed(1) + ' s');
  }
  if (lines.length === 0) return;

  push();
  textAlign(CENTER, BOTTOM);
  fill(0);
  textSize(16);
  const x = width / 2;
  let y = height - 10;
  for (let i = lines.length - 1; i >= 0; i--){
    text(lines[i], x, y);
    y -= 20;
  }
  pop();
}

/* walk mask a pohyb */
function isWalkable(x,y){
  if(!imgWalkMask) return true;
  if(x<0||y<0||x>=width||y>=height) return false;
  const mx=floor(map(x,0,width,0,imgWalkMask.width-1));
  const my=floor(map(y,0,height,0,imgWalkMask.height-1));
  const i=4*(my*imgWalkMask.width+mx);
  const p=imgWalkMask.pixels;
  const L=0.2126*p[i]+0.7152*p[i+1]+0.0722*p[i+2];
  return L>200;
}
function clampToSafeBounds(x,y){
  return { x: constrain(x, SAFE_EDGE, width-SAFE_EDGE), y: constrain(y, SAFE_EDGE, height-SAFE_EDGE) };
}
function findNearestWalkable(x,y,r){
  const s=clampToSafeBounds(x,y);
  if(isWalkable(s.x,s.y)) return s;
  for(let R=4; R<=r; R+=4){
    for(let a=0;a<360;a+=12){
      const nx=s.x+R*Math.cos(radians(a));
      const ny=s.y+R*Math.sin(radians(a));
      const c=clampToSafeBounds(nx,ny);
      if(isWalkable(c.x,c.y)) return c;
    }
  }
  return { x: width*0.5, y: height*0.5 };
}

/* animator s toleranciou pomeru dvoch snimok */
class TwoFrameAnimator{
  constructor(img){
    this.img = img;
    this.framesAcross = 2;
    this.framesDown = 1;
    this.frameW = 0;
    this.frameH = 0;
    this.frame = 0;
    this.tick = 0;
    this.speed = 6;
    this.detectLayout();
  }
  detectLayout(){
    if (!this.img || !this.img.width || !this.img.height) return;
    const w = this.img.width;
    const h = this.img.height;
    const tol = 0.15;
    const ratioWH = w / h;
    const ratioHW = h / w;

    if (Math.abs(ratioWH - 2) <= tol){
      this.framesAcross = 2;
      this.framesDown = 1;
    } else if (Math.abs(ratioHW - 2) <= tol){
      this.framesAcross = 1;
      this.framesDown = 2;
    } else {
      this.framesAcross = 2;
      this.framesDown = 1;
      console.warn('Spritesheet ratio not two frames', w, h);
    }
    this.frameW = Math.floor(w / this.framesAcross);
    this.frameH = Math.floor(h / this.framesDown);
  }
  step(isMoving){
    if (!isMoving) { this.frame = 0; return; }
    this.tick++;
    if (this.tick % this.speed === 0) this.frame = (this.frame + 1) % 2;
  }
  draw(dstX, dstY, dstW, dstH, flipX){
    if (!this.img || !this.frameW || !this.frameH) return;
    const fw = this.frameW;
    const fh = this.frameH;
    const fx = (this.framesAcross === 1 ? 0 : this.frame) * fw;
    const fy = (this.framesDown === 1 ? 0 : this.frame) * fh;
    push();
    imageMode(CENTER);
    if (flipX){
      scale(-1,1);
      image(this.img, -dstX, dstY, dstW, dstH, fx, fy, fw, fh);
    } else {
      image(this.img, dstX, dstY, dstW, dstH, fx, fy, fw, fh);
    }
    pop();
  }
}

/* Player */
class Player{
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.targetH = CHARACTER_HEIGHT;
    this.anim = new TwoFrameAnimator(playerSheet);
    this.speedBase = 5;
    this.collectRadiusBase = 45;

    this.inventoryLoad = 0;
    this.maxInventory = 150;
    this.inventoryItems = [];

    this.dir = 1;

    this.speedBoostEndFrame = 0;
    this.radiusBoostEndFrame = 0;
  }
  hasSpeedBoost(){ return frameCount < this.speedBoostEndFrame; }
  hasRadiusBoost(){ return frameCount < this.radiusBoostEndFrame; }
  currentSpeed(){ return this.speedBase * (this.hasSpeedBoost() ? BONUS_SPEED_MULT : 1); }
  currentCollectRadius(){ return this.collectRadiusBase * (this.hasRadiusBoost() ? BONUS_RADIUS_MULT : 1); }

  update(){
    let mx = 0, my = 0;
    if (keyIsDown(87)) my -= this.currentSpeed();
    if (keyIsDown(83)) my += this.currentSpeed();
    if (keyIsDown(65)) { mx -= this.currentSpeed(); this.dir = -1; }
    if (keyIsDown(68)) { mx += this.currentSpeed(); this.dir = 1; }
    const moving = mx !== 0 || my !== 0;
    if (moving){
      const mag = Math.hypot(mx,my);
      if (mag>0){
        mx = mx/mag*this.currentSpeed();
        my = my/mag*this.currentSpeed();
      }
      const nx = this.x + mx;
      const ny = this.y + my;
      if (isWalkable(nx, ny + this.targetH*0.2)) {
        this.x = nx;
        this.y = ny;
      }
    }
    this.anim.step(moving);
  }
  show(){
    const img = this.anim.img;
    if (!img || !img.width) {
      fill(0,0,255);
      ellipse(this.x,this.y,20,20);
      return;
    }
    const fw = this.anim.frameW || (img.width / this.anim.framesAcross);
    const fh = this.anim.frameH || (img.height / this.anim.framesDown);
    const dstH = this.targetH;
    const dstW = fw * (dstH / fh);
    this.anim.draw(this.x, this.y, dstW, dstH, this.dir === -1);

    const ratio = constrain(this.inventoryLoad / this.maxInventory, 0, 1);
    const barW = 44;
    const barH = 6;
    const barY = this.y - dstH * 0.7;
    push();
    noStroke();
    fill(0,0,0,160);
    rect(this.x - barW*0.5 - 1, barY - barH*0.5 - 1, barW + 2, barH + 2);
    fill(80);
    rect(this.x - barW*0.5, barY - barH*0.5, barW, barH);
    fill(0,200,80);
    rect(this.x - barW*0.5, barY - barH*0.5, barW * ratio, barH);
    pop();
  }
  collectTrash(t){
    const need = t.type==='large' ? 25 : 10;
    if(this.inventoryLoad + need > this.maxInventory) return false;
    const d=dist(this.x,this.y,t.x,t.y);
    if(d<this.currentCollectRadius()){
      this.inventoryLoad += need;
      this.inventoryItems.push({ type: t.type });

      if (t.type === 'large') pollution = max(0, pollution - POLLUTE_LARGE);
      else pollution = max(0, pollution - POLLUTE_SMALL);

      if (sfxPickup && getAudioContext().state === 'running') sfxPickup.play();

      return true;
    }
    return false;
  }
  collectBonus(b){
    const d=dist(this.x,this.y,b.x,b.y);
    if(d<this.currentCollectRadius()){
      if (b.kind === 'speed'){
        this.speedBoostEndFrame = max(this.speedBoostEndFrame, frameCount + BONUS_DURATION_FRAMES);
      } else if (b.kind === 'radius'){
        this.radiusBoostEndFrame = max(this.radiusBoostEndFrame, frameCount + BONUS_DURATION_FRAMES);
      }
      if (sfxBonus && getAudioContext().state === 'running') sfxBonus.play();
      return true;
    }
    return false;
  }
  emptyInventory(bin){
    return dist(this.x,this.y,bin.x,bin.y)<40 && this.inventoryLoad>0;
  }
}

/* NPC */
class NPC{
  constructor(x,y,noiseOffset,sheet){
    this.x=x;
    this.y=y;
    this.noiseOffset=noiseOffset;
    this.time=random(1000);
    this.speed=0.9;
    this.offMap=false;
    this.target={x:x,y:y};
    this.anim = new TwoFrameAnimator(sheet);
    this.dir = 1;
    this.trashInterval = nextTrashInterval();
    this.lastTrashFrame = frameCount - floor(random(0, this.trashInterval));
  }
  pickNewTarget(){
    const tx=random(SAFE_EDGE,width-SAFE_EDGE);
    const ty=random(SAFE_EDGE,height-SAFE_EDGE);
    const p=findNearestWalkable(tx,ty,200);
    this.target=p;
  }
  update(){
    if(this.offMap) return;
    if(this.x<SAFE_EDGE||this.x>width-SAFE_EDGE||this.y<SAFE_EDGE||this.y>height-SAFE_EDGE) this.pickNewTarget();
    this.time += 0.01;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const jitter = map(noise(this.time + this.noiseOffset), 0, 1, -0.3, 0.3);
    const ang = Math.atan2(dy, dx) + jitter;
    const nx = this.x + Math.cos(ang) * this.speed;
    const ny = this.y + Math.sin(ang) * this.speed;
    if (isWalkable(nx, ny)) {
      this.dir = Math.cos(ang) < 0 ? -1 : 1;
      this.x = nx;
      this.y = ny;
    } else {
      this.pickNewTarget();
    }
    if (dist(this.x,this.y,this.target.x,this.target.y) < 8) this.pickNewTarget();
    this.anim.step(true);
  }
  throwTrashAndMaybeBonus(){
    if(frameCount - this.lastTrashFrame >= this.trashInterval){
      const offX=random(-30,30), offY=random(-30,30);
      const cl=clampToSafeBounds(this.x+offX,this.y+offY);
      const p=findNearestWalkable(cl.x,cl.y,80);

      const t=new Trash(p.x,p.y);
      trash.push(t);

      if (t.type === 'large') pollution = min(POLLUTION_MAX, pollution + POLLUTE_LARGE);
      else pollution = min(POLLUTION_MAX, pollution + POLLUTE_SMALL);

      if (random() < BONUS_SPAWN_CHANCE){
        const bp = findNearestWalkable(cl.x + random(-20,20), cl.y + random(-20,20), 60);

        let kind;
        if (lastBonusKind === 'speed') {
          kind = random() < 0.7 ? 'radius' : 'speed';
        } else if (lastBonusKind === 'radius') {
          kind = random() < 0.7 ? 'speed' : 'radius';
        } else {
          kind = random() < 0.5 ? 'speed' : 'radius';
        }

        lastBonusKind = kind;
        bonuses.push(new Bonus(bp.x, bp.y, kind));

        if (random() < DOUBLE_BONUS_PROB){
          const other = kind === 'speed' ? 'radius' : 'speed';
          const bp2 = findNearestWalkable(bp.x + random(-28,28), bp.y + random(-28,28), 60);
          bonuses.push(new Bonus(bp2.x, bp2.y, other));
        }
      }

      this.lastTrashFrame = frameCount;
      this.trashInterval = nextTrashInterval();
    }
  }
  show(){
    const img = this.anim.img;
    if (!img || !img.width){
      fill(255,0,0);
      ellipse(this.x,this.y,15,15);
      return;
    }
    const fw = this.anim.frameW || (img.width / this.anim.framesAcross);
    const fh = this.anim.frameH || (img.height / this.anim.framesDown);
    const dstH = CHARACTER_HEIGHT;
    const dstW = fw * (dstH / fh);
    this.anim.draw(this.x, this.y, dstW, dstH, this.dir === -1);
  }
}

/* Scena */
class Tree{
  constructor(baseX,baseY,img,scale=1){
    this.baseX=baseX;
    this.baseY=baseY;
    this.img=img;
    this.scale=scale;
  }
  show(){
    const img=this.img;
    if(!img||!img.width) return;
    const w=img.width*this.scale;
    const h=img.height*this.scale;
    const x=this.baseX - w/2;
    const y=this.baseY - h;
    image(img,x,y,w,h);
  }
}

class Bin{
  constructor(x,y){
    this.x=x;
    this.y=y;
    const p=findNearestWalkable(this.x,this.y,200);
    this.x=p.x;
    this.y=p.y;
  }
  show(){
    if(litterImage){
      const iw=litterImage.width||1, ih=litterImage.height||1;
      const target=48;
      const s=target/Math.max(iw,ih);
      image(litterImage,this.x - iw*s*0.5,this.y - ih*s*0.5,iw*s,ih*s);
    }
  }
}

class Trash{
  constructor(x,y){
    this.x=x;
    this.y=y;
    this.type=random()<0.2?'large':'small';
    if(this.type==='small'){
      this.img=random(smallTrashImages);
      this.flip=random()<0.5;
      this.rot=radians(random(-12,12));
    } else {
      this.img=bigTrashImage;
      this.flip=false;
      this.rot=0;
    }
    const pt=findNearestWalkable(this.x,this.y,120);
    this.x=pt.x;
    this.y=pt.y;
  }
  show(){
    if(this.img){
      push();
      imageMode(CENTER);
      translate(this.x,this.y);
      rotate(this.rot);
      if(this.flip) scale(-1,1);
      const iw=this.img.width||1, ih=this.img.height||1;
      const target=this.type==='large'?LARGE_TRASH_TARGET_PX:SMALL_TRASH_TARGET_PX;
      const s=target/Math.max(iw,ih);
      image(this.img,0,0,iw*s,ih*s);
      pop();
    } else {
      if(this.type==='large'){
        fill(255,165,0);
        rect(this.x-8,this.y-8,16,16);
      } else {
        fill(255,255,0);
        rect(this.x-5,this.y-5,10,10);
      }
    }
  }
}

class Bonus{
  constructor(x,y,kind){
    this.x=x;
    this.y=y;
    this.kind=kind;
  }
  show(){
    if(bonusImage){
      image(bonusImage,this.x-17.5,this.y-17.5,35,35);
    } else {
      fill(0,0,255);
      rect(this.x-10,this.y-10,20,20);
    }
  }
}