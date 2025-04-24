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
    // moving
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

    //shoot anim
    if (this.state === 'shoot' && millis() - this.lastFrameChange > this.attackFrameDuration) {
      this.state = this.onGround ? 'idle' : 'jump'; // 공격 끝나면 원래 상태로
      this.frame = 0;
    }
    
    //ground judge
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

      this.lastFrameChange = millis();
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



}

function draw() {
  // 🔲 배경 및 바닥
  backgroundManager.draw();
  fill(100);
  rect(0, groundY, width, 100);

  // 🟩 디버그용 이미지 시각화 (캐릭터 및 아이템)
  let margin = 20;
  let size = 48; // 출력 이미지 크기
  let y = 600; // 출력 시작 위치

  textSize(14);
  fill(0);
  noStroke();

  // Player 1 이미지
  text("Player 1", margin, y);
  y += margin;
  for (const state in P1imgs) {
    text(state, margin, y + size / 2);
    for (let i = 0; i < P1imgs[state].length; i++) {
      image(P1imgs[state][i], margin + 80 + i * (size + 10), y, size, size);
    }
    y += size + 20;
  }

  // Player 2 이미지
  y += margin;
  text("Player 2", margin, y);
  y += margin;
  for (const state in P2imgs) {
    text(state, margin, y + size / 2);
    for (let i = 0; i < P2imgs[state].length; i++) {
      image(P2imgs[state][i], margin + 80 + i * (size + 10), y, size, size);
    }
    y += size + 20;
  }

  // 아이템 이미지
  y += margin * 2;
  text("Items (raw list)", margin, y);
  y += margin;

  const rawItems = [
    { name: "Mushroom", img: mushImg },
    { name: "Poison", img: poisonImg },
    { name: "Giant", img: giantImg },
    { name: "Fire Normal", img: fireImg_normal },
    { name: "Bomb", img: bombImg },
    { name: "Fire Inchant", img: fireImg_inchant },
    { name: "Missile", img: missile }
  ];

  for (let i = 0; i < rawItems.length; i++) {
    const x = margin + i * (size + 30);
    image(rawItems[i].img, x, y, size, size);
    textAlign(CENTER);
    text(rawItems[i].name, x + size / 2, y + size + 14);
  }

  // 🟦 itemimgs 객체 기반 출력
  y += size + 50;
  text("Items (from itemimgs)", margin, y);
  y += margin;

  let i = 0;
  for (const key in itemimgs) {
    const x = margin + i * (size + 30);
    image(itemimgs[key][0], x, y, size, size);
    textAlign(CENTER);
    text(key, x + size / 2, y + size + 14);
    i++;
  }
}



function keyPressed(){
  if(key === ' '){//spacebar(임시시)
    backgroundManager.modeChange();
  }
}
