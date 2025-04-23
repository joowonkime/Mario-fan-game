let player;
let gravity = 0.8;
let projectiles = [];
let bombs = [];
let groundY = 500;
let keys = {};
let powerUps = [];
let deathZoneY = 600;

let spriteSheets = {};

function preload() {
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

let backgroundManager;
function setup() {
  createCanvas(800, 600);
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
