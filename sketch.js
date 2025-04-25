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

function preload() {
  //sprite download
  preloadAssets();
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
    console.log(this.vx);
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
        this.state = "idle";
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
    console.log("shoot");
    const spawnX = this.facing === 'right' ? this.x + this.width : this.x;
    const spawnY = this.y + this.height / 2;
    const dir = this.facing === 'right' ? 20 : -20;
    const proj = new Projectile(spawnX, spawnY, dir);
    projectiles.push(proj);
  }

  dropBomb() {
    console.log("bomb");
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
    push();
    if (this.facing === 'left') {
      translate(this.x + this.width, this.y);
      scale(-1,1);
      image(img, 0, 0, this.width, this.height);
    } else {
      image(img, this.x, this.y, this.width, this.height);
    }
    pop();
  }
  
}

class Projectile {
  constructor(x, y, vx, width = 8, height = 8) {
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
    rect(this.x, this.y, this.width, this.height);
  }

  destroy() {
    return this.shouldDestroy;
  }

  // 충돌 체크 메서드
  hits(target) {
    console.log("shoot hit!");
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
    this.timer = 100;
    this.shouldDestroy = false;
  }

  update() {
    this.timer --;
    if(this.timer <=0){
      this.shouldDestroy = true;
    }
  }

  explode() {
    console.log("exploded");
  
  }

  draw() {
    fill(255,0,0);
    rect(this.x, this.y, this.width, this.height);
  }

  destroy() {
    return this.shouldDestroy;
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
  explode() {
    console.log("explode");
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
      console.log("shootend");
    }
  }
}

function handleBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i];
    bombs[i].update([player1, player2]);
    bombs[i].draw();
    if (bombs[i].destroy()) {
      bombs[i].explode();
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
function setup() {
  createCanvas(800, 1600);
  sliceImages();
  const bgsrc = spriteSheets.backgrounds;
  const w = 512, h = 512;
  const bgDay   = createImage(w, h);
  const bgNight = createImage(w, h);
  bgDay.copy(bgsrc,   514, 1565, w, h, 0, 0, w, h);
  bgNight.copy(bgsrc, 514, 5721, w, h, 0, 0, w, h);
  backgroundManager = new Background(bgDay, bgNight);


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
  if(key === ' '){//spacebar(임시)
    backgroundManager.modeChange();
  }
  player1.handleKeyPressed(key);
  player2.handleKeyPressed(key);
}
function keyReleased() {
  player1.handleKeyReleased(key);
  player2.handleKeyReleased(key);
}

