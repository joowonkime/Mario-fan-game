let player1, player2;
let tiles = [], decoTiles = [];
let projectiles = [], specialProjectiles = [], bombs = [];
let deathZoneY = 700;
let controlsP1, controlsP2;
let breakEffects = [];
let items = [];
let nextItemFrame = 0;
let gravity = 0.8;
let gameOver = false;
let winner   = null;
let victoryPlayed = false;
const TILE_SIZE = 32;
const groundY = [100, 200, 300, 400, 500, 550];
//32, 64, 96, 128, 160, 192, 224, 256, 288, 320,
//352, 384, 416, 
//448, 480, 512, 544, 576, 608, 640, 672, 704, 736, //
const mapLayout = [
  [
    { x1:  224, x2: 544, type: 'breakableblock' },
  ],
  [
    { x1: 128, x2: 224, type: 'breakableblock' },
    { x1: 256, x2: 320, type: 'groundblock1'   },
    { x1: 352, x2: 416, type: null               },
    { x1: 448, x2: 512, type: 'groundblock1'   },
    { x1: 544, x2: 640, type: 'breakableblock' },
  ],
  [
    { x1:  64, x2: 704, type: 'groundblock1' },
  ],
  [
    { x1: 256, x2: 512, type: 'groundblock1' },
  ],
  [
    { x1: 128, x2: 224, type: 'groundblock1'   },
    { x1: 256, x2: 288, type: 'breakableblock' },
    { x1: 320, x2: 448, type: null               },
    { x1: 480, x2: 512, type: 'breakableblock' },
    { x1: 544, x2: 640, type: 'groundblock1'   },
  ],
  [
    { x1:  32, x2: 736, type: 'breakableblock' },
  ],
];
function preload() {
  preloadAssets();
  preloadSounds();
}

function setup() {
  createCanvas(800, 600);
  sliceAssets();
  bgm.bgmGround.setVolume(0.5);
  bgm.bgmGround.setLoop(true)
  bgm.bgmGround.loop();

  controlsP1 = { left:'ArrowLeft', right:'ArrowRight', jump:'ArrowUp', attack:'[', bomb:']', down:'ArrowDown' };
  controlsP2 = { left:'a', right:'d', jump:'w', attack:'t', bomb:'y', down:'s' };

  player1 = new Player(150, 300, P1imgs, controlsP1);
  player2 = new Player(650, 300, P2imgs, controlsP2);

  for (let row = 0; row < groundY.length; row++) {
    const y = groundY[row] - TILE_SIZE;
    for (let seg of mapLayout[row]) {
      if (!seg.type) continue;
      for (let x = seg.x1; x <= seg.x2; x += TILE_SIZE) {
        tiles.push(new Tile(x, y, seg.type));
      }
    }
  }
}

function draw() {
  if (gameOver) {
    bgm.bgmGround.stop();
    if (!victoryPlayed) {
      effectSound.victory.play();
      victoryPlayed = true;
    }
    drawVictoryScreen();
    return;
  }
  backgroundManager.draw();
  decoTiles.forEach(t => t.draw());
  tiles.forEach(t => t.draw());

  player1.update();
  player1.draw();
  player2.update();
  player2.draw();

  
  randomSpawnItem();
  handleProjectiles();
  handleBombs();
  handleSpecialProjectiles();
  breakManager();
  drawUI();
}

function keyPressed() {
  if (key === ' ') backgroundManager.modeChange();
  player1.handleKeyPressed(key);
  player2.handleKeyPressed(key);
}
function keyReleased() {
  player1.handleKeyReleased(key);
  player2.handleKeyReleased(key);
}

class Tile {
  constructor(x,y,type) {
    this.x=x; this.y=y; this.type=type;
    this.img=tileimgs[type][0];
    this.width=32; this.height=32;
  }
  draw() { 
    image(this.img,this.x,this.y,this.width,this.height); 
  }
  collides(x,y,w,h) {
    return x < this.x+this.width && x+w>this.x && y<this.y+this.height && y+h>this.y;
  }
}
class Deco {
  constructor(x, y, type) {
    this.x     = x;
    this.y     = y;
    this.type  = type;
    this.img   = decoimgs[type][0];
    this.width = 32;
    this.height= 32;
  }

  draw() {
    image(this.img, this.x, this.y, this.width, this.height);
  }
}
class BreakEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frames = [
      decoimgs.breakeffect1[0],
      decoimgs.breakeffect2[0],
      decoimgs.breakeffect3[0]
    ];
    this.currentFrame = 0;
    this.frameTimer = 8;
    this.active = true;
  }
  update() {
    if (!this.active) return;
    this.frameTimer--;
    if (this.frameTimer <= 0) {
      this.currentFrame++;
      this.frameTimer = 8;
      if (this.currentFrame >= this.frames.length) {
        this.active = false;
      }
    }
  }
  draw() {
    if (!this.active) return;
    const img = this.frames[this.currentFrame];
    image(img, this.x, this.y, TILE_SIZE, TILE_SIZE);
  }
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
  constructor(x, y, imgSet, controls) {
    this.x = x;  this.y = y;
    this.vx = 0; this.vy = 0;
    this.knockbackVX = 0;
    this.width = 32; this.height = 32;
    this.onGround = false;
    this.jumpCount = 0;
    this.imgSet = imgSet;
    this.controls = controls;
    this.keys = {};
    this.bombHoldStartTime = null;
    this.chargeTime = 0;
    this.maxCharge = 1000;
    this.facing = "right";
    this.state = "idle";
    this.frame = 0;
    this._animTimer = 0;
    this._animInterval = 6;
    this.attackTimer = 0;
    this.dropping = false;
    this.dropRowY = null;
    this.currentTileY = null;

    this.itemCount       = 0;
    this.bombCount       = 5;
    this.bigMissileCount = 0;

    this.fireTimer   = 0;
    this.poisonTimer = 0;
    this.giantTimer  = 0;

    this.deathCount   = 5;
  }

  applyItem(type) {
    this.itemCount++;
    if (this.itemCount % 3 === 0) {
      this.bigMissileCount++;
    }
    switch(type) {
      case 'mush':
        effectSound.getItem.play();
        this.fireTimer = 8 * 60;
        break;
      case 'poison':
        effectSound.getItem.play();
        this.poisonTimer = 3 * 60;
        break;
      case 'giant':
        effectSound.getItem.play();
        this.giantTimer = 5 * 60;
        break;
      case 'bombadd':
        effectSound.getItem.play();
        this.bombCount += 5;
        break;
    }
  }

  update() {
    if (this.poisonTimer > 0) {
      this.poisonTimer--;
      this.vx = this.vy = 0;
      return;
    }

    if (this.giantTimer > 0) {
      this.giantTimer--;
      this.width  = 64;  this.height = 64;
    } 
    else {
      this.width  = 32;  this.height = 32;
    }

    if (this.fireTimer > 0) {
      this.fireTimer--;
    }

    if (this.keys[this.controls.bomb] && this.bombHoldStartTime !== null) {
      this.chargeTime = min(millis() - this.bombHoldStartTime, this.maxCharge);
    }

    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) this.state = this.onGround ? 'idle' : 'jump';
    }

    let inputVX = 0;
    if (this.keys[this.controls.left])      { inputVX = -5; this.facing = 'left'; }
    else if (this.keys[this.controls.right]){ inputVX = 5;  this.facing = 'right'; }
    this.vx = inputVX + this.knockbackVX;
    this.x += this.vx;

    this.vy += gravity;
    let nextY = this.y + this.vy;

    if (this.vy < 0 && this.dropRowY !== null) {
      this.dropRowY = null;
      this.dropping = false;
    }

    let landed = false;

    if (this.vy > 0) {
      for (let tile of tiles) {
        if (this.dropping && tile.y === this.dropRowY) continue;

        if ( this.x + this.width > tile.x &&this.x < tile.x + tile.width &&
          this.y + this.height <= tile.y && nextY + this.height  >= tile.y){
            
          landed = true;
          this.y = tile.y - this.height;
          this.vy = 0;
          this.onGround = true;
          this.jumpCount = 0;

          this.currentTileY = tile.y;

          this.dropping  = false;
          this.dropRowY = null;
          break;
        }
      }
    }

    if (landed) {
      if (this.attackTimer === 0) {
        if(inputVX !== 0) {
          this.state = 'walk'
        }
        else{
          this.state = 'idle';
        }
      }
    } 
    else {
      this.y = nextY;
      this.onGround = false;
      if (this.attackTimer === 0) this.state = 'jump';
    }

    if (this.state === 'walk') {
      this._animTimer++;
    }
    else {
      this._animTimer = 0;
    }

    if (this.keys[this.controls.down] && this.onGround && this.currentTileY !== null) {
      this.dropping     = true;
      this.dropRowY     = this.currentTileY;
      this.onGround     = false;
      this.currentTileY = null;
      this.jumpCount = 1;
    }

    this.knockbackVX *= 0.9;
    if (abs(this.knockbackVX) < 0.1) this.knockbackVX = 0;

    if (this.y > deathZoneY) this.respawn();
  }

  respawn() {
    effectSound.dead.play();
    this.deathCount--;
    if (this.deathCount > 0) {
      const spawnHeight = 1000;
      this.x = width/2 - this.width/2;
      this.y = - spawnHeight;
      this.vx = this.vy = this.knockbackVX = 0;
    } 
    else {
      gameOver = true;
      winner = (this === player1 ? player2 : player1);
    }
  }

  jump() {
    if (this.jumpCount < 2) {
      effectSound.jump.play();
      this.vy = -12;
      this.jumpCount++;
    }
  }

  shoot() {
    effectSound.fire.play();
    const spawnX = this.facing === 'right' ? this.x + this.width : this.x - 16;
    const spawnY = this.y + this.height/2;
    const dir = this.facing === 'right' ? 15 : -15;
    projectiles.push(new Projectile(spawnX, spawnY, dir, this.fireTimer > 0, this.giantTimer > 0));
    this.state = 'shoot';
    this.attackTimer = 10;
    this.frame = 0;
    this.knockbackVX = this.facing === 'right' ? -1 : 1;
  }

  dropBomb() {
    if (this.bombCount <= 0) return;
    const bx = this.facing === 'right' ? this.x + this.width : this.x - 32; 
    const by = this.y - 8;
    const normalizedV = 1 + map(this.chargeTime, 0,  1000, 0,  1);
    const v_bombx = this.facing === 'right' ? 5 * normalizedV : -5 * normalizedV;
    const v_bomby = - 2 * (normalizedV);
    effectSound.bombthrow.play();
    bombs.push(new Bomb(bx, by, v_bombx, v_bomby));
    this.bombCount--;
    this.state = 'shoot';
    this.attackTimer = 10;
    this.frame = 0;
  }

  fireBigMissile() {
    effectSound.bigmissile.play();
    const dir = this.facing === 'right' ? 5 : -5;
    const mW = 64 * 2, mH = 64 * 2;
    const spawnX = this.facing === 'right'
      ? this.x + this.width
      : this.x - mW;
    const spawnY = this.y - this.height;
    specialProjectiles.push(new BigMissile(spawnX, spawnY, dir));
    this.state = 'shoot';
    this.attackTimer = 15;
    this.knockbackVX = this.facing === 'right' ? -5 : 5;
    this.frame = 0;
  }

  handleKeyPressed(k) {
    this.keys[k] = true;
    if (k === this.controls.jump) {
      this.jump();
    } 
    if (k === this.controls.attack){
      this.shoot();
    }
    if (k === this.controls.bomb) this.bombHoldStartTime = millis();
  }

  handleKeyReleased(k) {
    this.keys[k] = false;
    if (k === this.controls.bomb && this.bombHoldStartTime !== null) {
      const held = millis() - this.bombHoldStartTime;
      if (held >= this.maxCharge && this.bigMissileCount > 0) {
        effectSound.bigmissile.play();
        this.fireBigMissile();
      }
      else {
        this.dropBomb();
      }
      this.bombHoldStartTime = null;
      this.chargeTime = 0;
    }
  }

  draw() {
    if (this.poisonTimer > 0) {
      tint(200, 100, 255);
    } 
    else {
      noTint();
    }
    if (this.chargeTime > 0) {
      const w = map(this.chargeTime, 0, this.maxCharge, 0, this.width);
      if (this.chargeTime < this.maxCharge) {
        fill(255, 255, 0);
      } else {
        fill(255, 0, 0);
      }
      rect(this.x, this.y - 10, w, 5);
      noFill();
    }
    
    if (this.state === 'walk') {
      const seq = this.imgSet.walk;
      this.frame = Math.floor(this._animTimer / this._animInterval) % seq.length;
    } 
    else {
      this.frame = 0;
    }
    const img = this.imgSet[this.state][this.frame];
    push();
    if (this.facing === 'left') {
      translate(this.x + this.width, this.y);
      scale(-1,1);
      image(img, 0,0, this.width, this.height);
    } else {
      image(img, this.x, this.y, this.width, this.height);
    }
    pop();
    noTint();
  }
}

class Projectile {
  constructor(x, y, vx, enchanted = false, isgiant = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.enchanted = enchanted;
    this.isgiant = isgiant;

    if (enchanted) {
      this.width  = 16;
      this.height = 16;
      this.knockbackFactor = 1.0;
      this.sprite = itemimgs.fire_enchant[0];
    } 
    else if(isgiant) {
      this.width  = 16;
      this.height = 16;
      this.knockbackFactor = 0.5;
      this.sprite = itemimgs.fire[0];
    }
    
    else {
      this.width  = 8;
      this.height = 8;
      this.knockbackFactor = 0.5;
      this.sprite = itemimgs.fire[0];
    }

    this.spawnTime = millis();
    this.lifetime  = 10000;
    this.shouldDestroy = false;
  }

  update(targets) {
    this.x += this.vx;

    for (const t of targets) {
      if (!this.shouldDestroy && this.hits(t)) {
        if (t.giantTimer > 0 || t.poisonTimer > 0) {
          this.shouldDestroy = true;
        } 
        else {
          t.knockbackVX += this.vx * this.knockbackFactor;
          this.shouldDestroy = true;
        }
      }
    }

    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }

  draw() {
    image(
      this.sprite,
      this.x, this.y,
      this.width, this.height
    );
  }

  destroy() {
    return this.shouldDestroy;
  }

  hits(target) {
    return (
      this.x <  target.x + target.width &&
      this.x + this.width  > target.x &&
      this.y <  target.y + target.height &&
      this.y + this.height > target.y
    );
  }
}


class Bomb {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.width = 32; this.height = 32;

    this.timer = 120;
    this.explodeTimer = 15;
    this.exploded = false;
    this.warning = false;
    this.shouldRemove = false;
    this.radius = 100;

    this.stuck = false;
    this.stuckY = null;
  }

  update() {
    if (this.stuck) {
      const underY = this.y + this.height;
      let hasTile = false;
      for (let tile of tiles) {
        if (
          tile.y === underY &&
          this.x + this.width > tile.x &&
          this.x < tile.x + tile.width
        ) {
          hasTile = true;
          break;
        }
      }
      if (!hasTile) {
        this.stuck = false;
      } 
      else {
        this.vy = 0;
        this.y  = underY - this.height;
      }
    }
    if (!this.exploded) {
      this.timer--;
      if (this.timer <= 60) this.warning = true;
      if (this.timer <= 0) {
        this.exploded = true;
        this.explode();
        return;
      }
    } 
    else {
      effectSound.bomb.play();
      this.explodeTimer--;
      if (this.explodeTimer <= 0) this.shouldRemove = true;
      return;
    }

    if (this.stuck) {
      this.vy = 0;
      this.y = this.stuckY - this.height;
      return;
    }

    this.vy += gravity;
    this.x  += this.vx;
    this.y  += this.vy;

    const landThreshold = 1;

    for (let tile of tiles) {
      if (this.y + this.height >= tile.y && this.y + this.height - this.vy < tile.y &&
        this.x + this.width > tile.x && this.x < tile.x + tile.width
      ) {
        this.y = tile.y - this.height;

        this.vy *= -0.5;
        this.vx *=  0.7;

        if (Math.abs(this.vy) < landThreshold) {
          this.vy     = 0;
          this.stuck  = true;
          this.stuckY = tile.y;
        }
        break;
      }
    }
  }

  explode() {
    [player1, player2].forEach(p => {
      const cx = this.x + this.width/2;
      const cy = this.y + this.height/2;
      const px = p.x + p.width/2;
      const py = p.y + p.height/2;
      const d = dist(cx, cy, px, py);

      if (d < this.radius) {
        const angle = atan2(py - cy, px - cx);
        const force = map(d, 0, this.radius, 20, 5);
        if(p.giantTimer > 0) {
          p.knockbackVX += cos(angle) * force * 0.5;
          p.vy         += sin(angle) * force * 0.5;
        }
        else if(p.poisonTimer > 0) {
          p.knockbackVX += cos(angle) * force * 0;
          p.vy         += sin(angle) * force * 0;
        }
        else {
          p.knockbackVX += cos(angle) * force * 2;
          p.vy         += sin(angle) * force * 2;
        }
        
      }
    });

    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i];
      if ((t.type === 'breakableblock' || t.type === 'questionblock')) {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        const tx = t.x + TILE_SIZE/2;
        const ty = t.y + TILE_SIZE/2;
        if (dist(cx, cy, tx, ty) < this.radius) {
          tiles.splice(i, 1);
          effectSound.breakBlock.play();
          breakEffects.push(new BreakEffect(t.x, t.y));
        }
      }
    }
  }
  

  draw() {
    if (!this.exploded) {
      if(this.warning){
        image(itemimgs.bomb_warning[0], this.x, this.y, this.width, this.height);
      }
      else {
        image(itemimgs.bomb[0], this.x, this.y, this.width, this.height);
      }
      
    }
    else {
      image(itemimgs.explosion[0], this.x - this.width, this.y - this.height, 3*this.width, 3*this.height);
    }
  }

  destroy() {
    return this.shouldRemove;
  }
}
class BigMissile {
  constructor(x, y, vx) {
    this.spawnTime = millis();
    this.lifetime = 20000;
    this.shouldDestroy = false;

    this.width = 64;
    this.height = 64;
    this.vx = vx;
    this.x = x;
    this.y = y - this.height;
  }

  update(targets) {

    this.x += this.vx;

    for (const t of targets) {
      const w = this.width * 2;
      const h = this.height * 2;
      const overlapX = this.x < t.x + t.width && this.x + w > t.x;
      const overlapY = this.y < t.y + t.height && this.y + h > t.y;
      if (!overlapX || !overlapY) continue;

      const playerBottom = t.y + t.height;
      const missileTop = this.y;
      if (t.vy > 0 && playerBottom <= missileTop + h * 0.1) {
        t.y = missileTop - t.height;
        t.vy = 0;
      }
      else {
        if (this.vx > 0) {
          t.x = this.x + w;
        }
        else {
          t.x = this.x - t.width;
        }
      }
      break;
    }

    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }

  draw() {
    const img = itemimgs.bigmissile[0];
    push();
    if (this.vx > 0) {
      translate(this.x + this.width * 2, this.y);
      scale(-1, 1);
      image(img, 0, 0, this.width * 2, this.height * 2);
    } 
    else {
      image(img, this.x, this.y, this.width * 2, this.height * 2);
    }
    pop();
  }

  hits(target) {
    const w = this.width * 2;
    const h = this.height * 2;
    return (
      this.x < target.x + target.width &&
      this.x + w > target.x &&
      this.y < target.y + target.height &&
      this.y + h > target.y
    );
  }

  destroy() {
    return this.shouldDestroy;
  }
}
class Item {
  constructor(type, x) {
    this.type     = type;
    this.img      = itemimgs[type][0];
    this.x        = x;
    this.y        = -TILE_SIZE;
    this.vy       = 0;
    this.width    = TILE_SIZE;
    this.height   = TILE_SIZE;
    this.toRemove = false;
    this.stuck    = false;
  }

  hits(target) {
    return (
      this.x <  target.x + target.width &&
      this.x + this.width  > target.x &&
      this.y <  target.y + target.height &&
      this.y + this.height > target.y
    );
  }

  landOnTiles() {
    if (this.vy <= 0) return;

    const nextY = this.y + this.vy;
    for (let tile of tiles) {
      const prevBot = this.y + this.height;
      const currBot = nextY  + this.height;

      if (prevBot <= tile.y &&
          currBot >= tile.y &&
          this.x + this.width > tile.x &&
          this.x < tile.x + tile.width
      ) {
        this.y     = tile.y - this.height;
        this.vy    = 0;
        this.stuck = true;
        return;
      }
    }
    this.y = nextY;
  }

  update() {
    if (this.stuck) {
      const underY = this.y + this.height;
      let hasTile = false;
      for (let tile of tiles) {
        if (
          tile.y === underY &&
          this.x + this.width > tile.x &&
          this.x < tile.x + tile.width
        ) {
          hasTile = true;
          break;
        }
      }
      if (!hasTile) {
        this.stuck = false;
      } 
      else {
        this.vy = 0;
        this.y  = underY - this.height;
      }
    }
  
    if (!this.stuck) {
      this.vy += 0.5 * gravity;
      this.landOnTiles();
    }

    if (this.y > height) {
      this.toRemove = true;
      return;
    }

    for (let p of [player1, player2]) {
      if (!this.toRemove && this.hits(p)) {
        p.applyItem(this.type);
        this.toRemove = true;
      }
    }
  }

  draw() {
    image(this.img, this.x, this.y, this.width, this.height);
  }

  destroy() {
    return this.toRemove;
  }
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
    const b = bombs[i];
    b.update();
    b.draw();
    if (b.destroy()) {
      bombs.splice(i, 1);
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
function breakManager() {
  for (let i = breakEffects.length - 1; i >= 0; i--) {
    const e = breakEffects[i];
    e.update();
    e.draw();
    if (!e.active) {
      breakEffects.splice(i, 1);
    }
  }
}
function randomSpawnItem() {
  if (frameCount >= nextItemFrame) {
    const types = ['mush','poison','giant','bombadd'];
    const type  = random(types);
    const x     = random(0, width - TILE_SIZE);

    items.push(new Item(type, x));

    nextItemFrame = frameCount + floor(random(10,15) * 60);
  }

  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.update();
    it.draw();
    if (it.toRemove) {
      items.splice(i, 1);
    }
  }
}

function drawUI() {
  const boxW = 140;
  const boxH = 60;
  const pad  = 10;

  textSize(12);
  textAlign(LEFT, TOP);

  push();
    fill(0, 150);
    noStroke();
    rect(pad, height - boxH - pad, boxW, boxH, 4);

    fill(255);
    text(`Missle:  ${player1.bigMissileCount}`, pad+8, height - boxH - pad + 8);
    text(`Lives: ${player1.deathCount}`,     pad+8, height - boxH - pad + 24);
    text(`Bombs: ${player1.bombCount}`,     pad+8, height - boxH - pad + 40);
  pop();

  push();
    fill(0, 150);
    noStroke();
    rect(width - boxW - pad, height - boxH - pad, boxW, boxH, 4);

    fill(255);
    text(`Missle:  ${player2.bigMissileCount}`, width - boxW - pad + 8, height - boxH - pad + 8);
    text(`Lives: ${player2.deathCount}`,     width - boxW - pad + 8, height - boxH - pad + 24);
    text(`Bombs: ${player2.bombCount}`,      width - boxW - pad + 8, height - boxH - pad + 40);
  pop();
}
function drawVictoryScreen() {
  fill(0, 180);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(64);
  fill(255, 215, 0);
  text('YOU WIN!', width/2, height/2 - 80);

  const iconSize = 128;
  const img = winner.imgSet.idle[0];
  image(
    img,
    width/2 - iconSize/2,
    height/2 - iconSize/2 + 20,
    iconSize,
    iconSize
  );

}
