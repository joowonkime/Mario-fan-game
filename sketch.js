let player;
let gravity = 0.8;
let projectiles = [];
let bombs = [];
let groundY = 500;
let keys = {};
let powerUps = [];
let deathZoneY = 600;

let spriteSheets = {};
let background_sky;

function preload() {
  // 여기에 sprite들을 preload (ex: mario = loadImage("..."))
  spriteSheets.backgorunds= loadImage("assets/Mario-Background.png");
  spriteSheets.characters = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset = loadImage("assets/Mario-Tileset.png");
}

function setup() {
  createCanvas(800, 600);
  const bgsource = spriteSheets.backgorunds;
  background_sky = createImage(400,300);
  background_sky.copy(bgsource,
     514, 1565, 
     512, 512, 
     0, 0, 
     400,300);
  
  
}

function draw() {
  for (let y = 0; y < height; y += background_sky.height) {
    for (let x = 0; x < width; x += background_sky.width) {
      image(background_sky, x, y);
    }
  }

  // 임시 바닥
  fill(100);
  rect(0, groundY, width, 100);
}
