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
  // 여기에 sprite들을 preload (ex: mario = loadImage("..."))
  spriteSheets.backgorunds= loadImage("assets/Mario-Background.png");
  spriteSheets.characters = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset = loadImage("assets/Mario-Tileset.png");
}

function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(135, 206, 235); // sky blue

  // 임시 바닥
  fill(100);
  rect(0, groundY, width, 100);
}
