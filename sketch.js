let player;
let gravity = 0.8;

let projectiles = [];
let specialProjectiles = [];
let bombs = [];

let groundY = 500;
let keys = {};
let powerUps = [];
let deathZoneX;
let deathZoneY = 600;
let controlsP1, controlsP2;

let spriteSheets = {};

function preload() {
  //sprite download
  spriteSheets.backgrounds= loadImage("assets/Mario-Background.png");
  spriteSheets.characters = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset = loadImage("assets/Mario-Tileset.png");

}
class Background {
  constructor(dayImg, nightImg) {
    this.bgDay = dayImg;
    this.bgNight = nightImg;
    this.mode = 'day';
    this.currentImg = this.bgDay;
    this.tileW = dayImg.width;
    this.tileH = dayImg.height;
  }

  setMode(mode) {
    if (mode === "day") {
      this.mode = "day";
      this.currentImg = this.bgDay;
    } 
    else if (mode === "night") {
      this.mode = "night";
      this.currentImg = this.bgNight;
    } 
    else {
      console.log("error");
    }
  }
  modeChange(){
    this.setMode(this.mode === "day" ? "night" : "day");
  }
  draw() {
    for (let y = 0; y < height; y += this.tileH) {
      for (let x = 0; x < width; x += this.tileW) {
        image(this.currentImg, x, y);
      }
    }
  }
}

class Player {
  constructor(x,y, imgSet, controls){
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 32;

    this.onGround = false;
    this.jumpCount = 0;
    this.deathCount = 10;
    this.imgSet = imgSet;
    
    this.controls = controls;//custom keyset
    this.keys = {};// key pressed 상태 추적적

    this.bombHoldStartTime = null;
    this.skill = {
      resist: false,
      fastFire: false,
      isGiant: false,
      itemCount: 0
    }
    this.facing = "right";
    this.state = "idle";
    this.frame = 0;
  }

  update() {
    // moving
    if (this.keys[this.controls.left]) {
      this.vx = -5;
      this.facing = "left";
    }
    else if (this.keys[this.controls.right]) {
      this.vx = 5;
      this.facing = "right";
    }
    else {
      this.vx = 0;
    }
    
    //ground judge
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.jumpCount = 0;
    } 
    else {
      this.onGround = false;
      this.state = "jump";
    }

    //낙사
    if (this.y > deathZoneY) {
      this.deathCount--;
      this.state = "dead";
      this.respawn();
    }

    this.animationCnt++;
  }

  respawn(){
    this.x = 100;
    this.y = 100;
    this.vx = 0;
    this.vy = 0;
  }

  jump() {
    if(this.jumpCount < 2) {
      this.vy = -15;
      this.jumpCount++;
    }
  }

  //3 attack logic
  shoot() {
    if (this.skill.fastFire || frameCount % 20 === 0) {
      const direction = this.facing === "right" ? 20 : -20;
      projectiles.push(new Projectile(this.x, this.y, direction));
    }  
  }

  dropBomb() {
    const bombX = this.x + this.width / 2;
    const bombY = this.y;
    bombs.push(new Bomb(bombX, bombY));
  }

  fireBigMissile() {
    console.log("받아라 비장의무기~~");
    const dir = this.facing === "right" ? 5 : -5;
    specialProjectiles.push(new BigMissile(this.x, this.y, dir));
    this.skill.itemCount = this.skill.itemCount - 3;
  }
  //end..

  handleKeyPressed(k) {
    this.keys[k] = true;
    if (k === this.controls.jump) this.jump();
    if (k === this.controls.attack) this.shoot();
    if (k === this.controls.bomb) {
      if (this.skill.itemCount >= 3 && this.bombHoldStartTime === null) {
        this.bombHoldStartTime = millis();
      }
      else {
        this.dropBomb();
      }
    }
  }

  handleKeyReleased(k) {
    this.keys[k] = false;
  
    if (k === this.controls.bomb && this.bombHoldStartTime !== null) {
      const heldDuration = millis() - this.bombHoldStartTime;
  
      if (heldDuration >= 2000 && this.skill.itemCount >= 3) {
        this.fireBigMissile();       // 대형 미사일 발사
        this.skill.itemCount  = this.skill.itemCount - 3;    // 카운트 초기화
      }
  
      // 초기화 (2초 미만이어도 시간 초기화)
      this.bombHoldStartTime = null;
    }
  }

  draw() {
    const img = this.imgSet[this.state][this.frame];
    push();                      // 1) 상태 저장
    if (this.facing === 'left') {
      // (선택) 기준점을 옮긴 뒤 뒤집으면 좀 더 직관적입니다.
      translate(this.x + this.width, this.y);
      scale(-1,1);
      image(img, 0, 0, this.width, this.height);
    } else {
      image(img, this.x, this.y, this.width, this.height);
    }
    pop();                       // 2) 좌표계 원상복구
  }
  
}

class Projectile {
  constructor(x, y, vx, width, height) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.width = width;
    this.height = height;
    this.spawnTime = millis();
    this.lifetime = 10000;
    this.shouldDestroy = false;
  }

  update(targets) {
    this.x += this.vx;

    for (const t of targets) {
      if(this.hits(t)) {
        const knockback = this.vx;
        t.vx += knockback;
        this.shouldDestroy = true;
      }
    }
    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }

  draw() {
    fill(255, 100, 0);
    ellipse(this.x, this.y, this.width, this.height);
  }

  destroy() {
    return this.shouldDestroy;
  }

  // 충돌 체크 메서드
  hits(target) {
    return (
      this.x < target.x + target.width &&
      this.x + this.width > target.x &&
      this.y < target.y + target.height &&
      this.y + this.height > target.y
    );
  }
}


class Bomb {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.timer = 120;
  }

  update() {
    this.timer --;
    if(this.timer <=0){
      this.explode();
    }
  }

  explode() {
    console.log("exploded");
  }

  draw() {
    fill(255,0,0);
    rect(this.x, this.y, this.width, this.height);
  }
}

class BigMissile {
  constructor(x,y,vx) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.width = 64;
    this.height = 64

    this.spawnTime = millis();
    this.lifetime = 20000;
    this.shouldDestroy = false;
  }
  update(targets) {
    this.x += this.vx;
    for (const t of targets) {
      if (this.hits(t)) {
        const knockback = this.vx * 0.1;
        t.vx += knockback;
      }
    }
    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }
  draw() {
    fill(255, 0, 255);
    rect(this.x, this.y, this.width, this.height);
  }
  destroy() {
    return this.shouldDestroy;
  }
}

class Item {

}



function handleProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update([player1, player2]);
    projectiles[i].draw();
    if (projectiles[i].destroy()) {
      projectiles.splice(i, 1);
    }
  }
}

function handleBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.update();
    b.draw();
    if (b.exploded) {
      bombs.splice(i, 1); // 제거
    }
  }
}
function handleSpecialProjectiles() {
  for (let i = specialProjectiles.length - 1; i >= 0; i--) {
    specialProjectiles[i].update([player1, player2]);
    specialProjectiles[i].draw();
    if (specialProjectiles[i].destroy()) {
      specialProjectiles.splice(i, 1);
    }
  }
}

let backgroundManager; 
let P1imgs = [];
let P2imgs = [];
let itemimgs = [];
function setup() {
  createCanvas(800, 1600);
  const bgsource = spriteSheets.backgrounds;
  const bgWidth = 512;
  const bgHeight = 512
  const bgDay = createImage(bgWidth, bgHeight);
  bgDay.copy(bgsource, 
    514, 1565, bgWidth, bgHeight, 
    0, 0, bgWidth, bgHeight);
  const bgNight = createImage(bgWidth, bgHeight);
  bgNight.copy(bgsource, 
    514, 5721, bgWidth, bgHeight, 
    0, 0, bgWidth, bgHeight);
  backgroundManager = new Background(bgDay, bgNight);
  console.log("background load done...");
  //background setup done...
  //player key setting
  controlsP1 = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    attack: '[',
    bomb: ']'
  };
  
  controlsP2 = {
    left: 'a',
    right: 'd',
    jump: 'w',
    attack: 't',
    bomb: 'y'
  };
  console.log("player key setting done...");
  //player img setting
  const chracterSource = spriteSheets.characters;
  const chracterWidth = 32;
  const chracterHeight = 32;

  const marioIdle = createImage(chracterWidth, chracterHeight);
  marioIdle.copy(chracterSource, 1, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const marioWalk1 = createImage(chracterWidth, chracterHeight);
  marioWalk1.copy(chracterSource, 75, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const marioWalk2 = createImage(chracterWidth, chracterHeight);
  marioWalk2.copy(chracterSource, 108, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const marioWalk3 = createImage(chracterWidth, chracterHeight);
  marioWalk3.copy(chracterSource, 141, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const marioJump = createImage(chracterWidth, chracterHeight);
  marioJump.copy(chracterSource, 215, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const marioAttack = createImage(chracterWidth, chracterHeight);
  marioAttack.copy(chracterSource, 627, 98, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  P1imgs = {
    idle: [marioIdle],              // idle은 이미지 1장만
    walk: [marioWalk1, marioWalk2, marioWalk3],  // walk는 3장으로 애니메이션
    jump: [marioJump],              // jump는 이미지 1장
    shoot: [marioAttack]             // shoot도 이미지 1장
  }

  const luigiIdle = createImage(chracterWidth, chracterHeight);
  luigiIdle.copy(chracterSource, 1, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const luigiWalk1 = createImage(chracterWidth, chracterHeight);
  luigiWalk1.copy(chracterSource, 75, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const luigiWalk2 = createImage(chracterWidth, chracterHeight);
  luigiWalk2.copy(chracterSource, 108, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const luigiWalk3 = createImage(chracterWidth, chracterHeight);
  luigiWalk3.copy(chracterSource, 141, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const luigiJump = createImage(chracterWidth, chracterHeight);
  luigiJump.copy(chracterSource, 215, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  const luigiAttack = createImage(chracterWidth, chracterHeight);
  luigiAttack.copy(chracterSource, 627, 629, chracterWidth, chracterHeight, 0, 0, chracterWidth, chracterHeight);
  P2imgs = {
    idle: [luigiIdle],              // idle은 이미지 1장만
    walk: [luigiWalk1, luigiWalk2, luigiWalk3],  // walk는 3장으로 애니메이션
    jump: [luigiJump],              // jump는 이미지 1장
    shoot: [luigiAttack]             // shoot도 이미지 1장
  }
  console.log("player image loading done...");
  // chracter image setting done..
  // other sprite loading -> item : character, enemy에 몇개씩 있음음 그림마다 다 달라서 그냥 다 정의할게요 귀찮다..
  const specialSource = spriteSheets.specialweapon;
  const objWidth = 16;
  const objHeight = 16;

  const mushImg = createImage(objWidth, objHeight);
  mushImg.copy(chracterSource, 1, 2126, objWidth, objHeight, 0, 0, objWidth, objHeight);
  const poisonImg = createImage(objWidth, objHeight);
  poisonImg.copy(chracterSource, 1, 2143, objWidth, objHeight, 0, 0, objWidth, objHeight);
  const giantImg = createImage(2 * objWidth, 2 * objHeight);
  giantImg.copy(chracterSource, 35, 2143, 2 * objWidth, 2 * objHeight, 0, 0, 2 * objWidth, 2 * objHeight);
  const fireImg_normal = createImage(objWidth / 2, objHeight / 2);
  fireImg_normal.copy(chracterSource, 101, 2177, objWidth / 2, objHeight / 2, 0, 0, objWidth / 2, objHeight / 2);
  const bombImg = createImage(objWidth, objHeight);
  bombImg.copy(chracterSource, 194, 2143, objWidth, objHeight, 0, 0, objWidth, objHeight);
  const fireImg_inchant = createImage(2 * objWidth, objHeight);
  fireImg_inchant.copy(specialSource, 258, 191, 2 * objWidth, objHeight, 0, 0, 2 * objWidth, objHeight);
  const missile = createImage(4 * objWidth, 4 * objHeight);
  missile.copy(specialSource, 127, 356, 4 * objWidth, 4 * objHeight, 0, 0, 4 * objWidth, 4 * objHeight);

  itemimgs = {
    mush : [mushImg],
    poison : [poisonImg],
    giant : [giantImg],
    fire : [fireImg_normal],
    fire_reinforce : [fireImg_inchant],
    bomb : [bombImg],
    bigmissile : [missile]
  }
  console.log("obj img loading done...");
  //object img loading done...

  player1 = new Player(0, 0, P1imgs, controlsP1);
  player2 = new Player(0, 0, P2imgs, controlsP2);

}


function draw() {

  backgroundManager.draw();
  rect(0, groundY, width, 100);

  player1.update();
  player1.draw();
  player2.update();
  player2.draw();

  handleProjectiles();
  handleBombs();
  handleSpecialProjectiles();

  
}



function keyPressed(){
  if(key === ' '){//spacebar(임시시)
    backgroundManager.modeChange();
  }
  player1.handleKeyPressed(key);
  player2.handleKeyPressed(key);
}
function keyReleased() {
  player1.handleKeyReleased(key);
  player2.handleKeyReleased(key);
}

