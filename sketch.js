let player;
let gravity = 0.8;
let projectiles = [];
let bombs = [];
let groundY = 500;
let keys = {};
let powerUps = [];
let deathZoneX;
let deathZoneY = 600;
let controlsP1, controlsP2;
let P1img = [];
let P2img = [];


let spriteSheets = {};

function preload() {
  //sprite download
  spriteSheets.backgrounds= loadImage("assets/Mario-Background.png");
  spriteSheets.characters = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset = loadImage("assets/Mario-Tileset.png");

  //player contoller
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

  //character sprite
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
  constructor(x,y, imgSet, controls, spawnX){
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumpCount = 0;
    this.deathCount = 10;
    this.imgSet = imgSet;


    //animation
    this.frame = 0;
    this.animationCnt = 0;
    this.facing = "right";
    this.state = "idle"; // idle, walk, jump, shoot, dead
    
    this.controls = controls;//custom keyset
    this.keys = {};// key pressed 상태 추적적

    this.skill = {
      resist: false,
      fastFire: false,
      bigMode: false,
      itemCount: 0
    }
    this.bombHoldStartTime = null;
  }

  update() {
    if (this.keys[this.controls.left]) {
      this.vx = -5;
      this.facing = "left";
      this.state = "walk";
    }
    else if (this.keys[this.controls.right]) {
      this.vx = 5;
      this.facing = "right";
      this.state = "walk";
    }
    else {
      this.vx = 0;
      this.state = "idle";
    }
    

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + 50 >= groundY) {
      this.y = groundY - 50;
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
      this.jumpCount;
    }
  }

  shoot() {
    if (this.power.fastFire || frameCount % 20 === 0) {
      const direction = this.facing === "right" ? 10 : -10;
      projectiles.push(new Projectile(this.x, this.y, direction));
    }
  }

  dropBomb() {
    bombs.push(new Bomb(this.x, this.y));
  }

  fireBigMissile() {
    console.log("받아라 비장의무기~~");
    const dir = this.facing === "right" ? 20 : -20;
    specialProjectiles.push(new BigMissile(this.x, this.y, dir));
  }

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
        this.skill.itemCount = 0;    // 카운트 초기화
      }
  
      // 초기화 (2초 미만이어도 시간 초기화)
      this.bombHoldStartTime = null;
    }
  }

  draw() {
    //그리기기
    const img = this.imgSet[this.state][this.frame];

    push();
    if(this.facing === "left"){
      scale(-1, 1);
      image(img, -this.x - 30, this.y, 30, 50);
    }
    else{
      image(img, this.x, this.y)
    }

    //목숨표시시
    fill(0);
  }
}



let backgroundManager; 
function setup() {
  createCanvas(800,600);
  const bgsource = spriteSheets.backgrounds;
  const bgDay = createImage(512, 512);
  bgDay.copy(bgsource, 
    514, 1565, 
    512, 512, 
    0, 0, 
    512, 512);
  const bgNight = createImage(512, 512);
  bgNight.copy(bgsource, 
    514, 5721, 
    512, 512, 
    0, 0, 
    512, 512);
  backgroundManager = new Background(bgDay, bgNight);
  //background setup done...




}

function draw() {
  backgroundManager.draw();

  // 임시 바닥
  fill(100);
  rect(0, groundY, width, 100);
}

function keyPressed(){
  if(key === ' '){//spacebar(임시시)
    backgroundManager.modeChange();
  }
}
