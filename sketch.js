let player1, player2;
let tiles = [], decoTiles = [];
let projectiles = [], specialProjectiles = [], bombs = [];
let deathZoneY = 700;
let groundY = [500, 400, 300, 200, 100];
let controlsP1, controlsP2;
let breakEffects = [];
let items = [];
let nextItemFrame = 0;
const TILE_H = 32;
const mapLayout = [
  // row 0 (y = groundY[0]–16): gb1 | question | gb1
  [
    { x1:  32, x2:  256, type: 'groundblock1'  },
    { x1: 272, x2:  528, type: null },
    { x1: 544, x2:  768, type: 'groundblock1'  },
  ],
  // row 1 (y = groundY[1]–16): breakable | gb1 | breakable
  [
    { x1:  32, x2:  256, type: 'breakableblock' },
    { x1: 272, x2:  528, type: 'groundblock1'   },
    { x1: 544, x2:  768, type: 'breakableblock' },
  ],
  // row 2 (y = groundY[2]–16): gb1 | question | gb1
  [
    { x1:  32, x2:  256, type: 'groundblock1'  },
    { x1: 272, x2:  528, type: 'breakableblock' },
    { x1: 544, x2:  768, type: 'groundblock1'  },
  ],
  // row 3 (y = groundY[3]–16): breakable | gb1 | breakable
  [
    { x1:  32, x2:  256, type: 'breakableblock' },
    { x1: 272, x2:  528, type: 'groundblock1'   },
    { x1: 544, x2:  768, type: 'breakableblock' },
  ],
  // row 4 (y = groundY[4]–16): gb1 | (빈칸) | gb1
  [
    { x1:  32, x2:  256, type: 'groundblock1' },
    { x1: 272, x2:  528, type: null           },
    { x1: 544, x2:  768, type: 'groundblock1' },
  ],
];

function preload() {
  preloadAssets();
}

function setup() {
  createCanvas(800, 600);
  sliceAssets();

  controlsP1 = {
    left: 'ArrowLeft', right: 'ArrowRight',
    jump: 'ArrowUp', attack: '[', bomb: ']', down: 'ArrowDown'
  };
  controlsP2 = {
    left: 'a', right: 'd',
    jump: 'w', attack: 't', bomb: 'y', down: 's'
  };

  player1 = new Player(100, 100, P1imgs, controlsP1);
  player2 = new Player(200, 100, P2imgs, controlsP2);

  for (let row = 0; row < groundY.length; row++) {
    const y = groundY[row] - TILE_H;
    for (let seg of mapLayout[row]) {
      if (!seg.type) continue;            // null인 구간은 건너뛰고
      for (let x = seg.x1; x <= seg.x2; x += TILE_H) {
        tiles.push(new Tile(x, y, seg.type));
      }
    }
  }
}

function draw() {
  backgroundManager.draw();
  decoTiles.forEach(t => t.draw());
  tiles.forEach(t => t.draw());

  player1.update(); player1.draw();
  player2.update(); player2.draw();

  handleProjectiles();
  handleBombs();
  handleSpecialProjectiles();
  breakManager();
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
    this.frameTimer = 8;    // 각 프레임을 몇 틱 동안 보여줄지
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
    image(img, this.x, this.y, TILE_H, TILE_H);
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
    this.attackTimer = 0;
    this.dropping = false; // drop-through state
    this.dropRowY = null;  // current tile to drop through
    this.currentTileY = null; // current tile Y position for drop-through

    
  }

  update() {
    // Bomb charging
    if (this.keys[this.controls.bomb] && this.bombHoldStartTime !== null) {
      this.chargeTime = min(millis() - this.bombHoldStartTime, this.maxCharge);
    }
    // Attack cooldown
    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) this.state = this.onGround ? 'idle' : 'jump';
    }

    // Horizontal movement
    let inputVX = 0;
    if (this.keys[this.controls.left])      { inputVX = -5; this.facing = 'left'; }
    else if (this.keys[this.controls.right]){ inputVX = 5;  this.facing = 'right'; }
    this.vx = inputVX + this.knockbackVX;
    this.x += this.vx;

    // Gravity 적용
    this.vy += gravity;
    let nextY = this.y + this.vy;

    // 위로 올라갈 때 드롭 취소
    if (this.vy < 0 && this.dropRowY !== null) {
      this.dropRowY = null;
      this.dropping = false;
    }

    let landed = false;
    // 한 방향 플랫폼 충돌 처리 (아래로 떨어질 때만)
    if (this.vy > 0) {
      for (let tile of tiles) {
        // 드롭 중일 때, 지정된 행은 충돌 무시
        if (this.dropping && tile.y === this.dropRowY) continue;

        if (
          this.x + this.width  > tile.x &&
          this.x               < tile.x + tile.width &&
          this.y + this.height <= tile.y &&
          nextY + this.height  >= tile.y
        ) {
          // 착지
          landed = true;
          this.y = tile.y - this.height;
          this.vy = 0;
          this.onGround = true;
          this.jumpCount = 0;

          // 나중에 DROP 키로 통과시킬 행 기록
          this.currentTileY = tile.y;

          // 착지하면 드롭 상태 초기화
          this.dropping  = false;
          this.dropRowY = null;
          break;
        }
      }
    }

    if (landed) {
      if (this.attackTimer === 0) this.state = 'idle';
    } else {
      this.y = nextY;
      this.onGround = false;
      if (this.attackTimer === 0) this.state = 'jump';
    }

    // DOWN 키로 현재 플랫폼 행 통과
    if (
      this.keys[this.controls.down] &&
      this.onGround &&
      this.currentTileY !== null
    ) {
      this.dropping     = true;
      this.dropRowY     = this.currentTileY;
      this.onGround     = false;
      this.currentTileY = null;
      this.jumpCount = 1;
    }
    // Knockback decay
    this.knockbackVX *= 0.9;
    if (abs(this.knockbackVX) < 0.1) this.knockbackVX = 0;

    // Respawn if fallen off map
    if (this.y > deathZoneY) this.respawn();
  }

  handleKeyPressed(k) {
    this.keys[k] = true;
    if (k === this.controls.jump && this.onGround) this.jump();
    if (k === this.controls.attack) this.shoot();
    if (k === this.controls.bomb) this.bombHoldStartTime = millis();
  }

  handleKeyReleased(k) {
    this.keys[k] = false;
    if (k === this.controls.bomb && this.bombHoldStartTime !== null) {
      const held = millis() - this.bombHoldStartTime;
      if (held >= this.maxCharge) this.fireBigMissile(); else this.dropBomb();
      this.bombHoldStartTime = null;
      this.chargeTime = 0;
    }
  }

  respawn() {
    this.x = 100; this.y = 100;
    this.vx = this.vy = this.knockbackVX = 0;
  }

  jump() {
    if (this.jumpCount < 2) {
      this.vy = -12;
      this.jumpCount++;
    }
  }

  shoot() {
    const spawnX = this.facing === 'right' ? this.x + this.width : this.x - 16;
    const spawnY = this.y + this.height/2;
    const dir = this.facing === 'right' ? 20 : -20;
    projectiles.push(new Projectile(spawnX, spawnY, dir));
    this.state = 'shoot';
    this.attackTimer = 10;
    this.frame = 0;
    this.knockbackVX = this.facing === 'right' ? -2 : 2;
  }

  dropBomb() {
    const bx = this.facing === 'right' ? this.x + this.width : this.x - 32; 
    const by = this.y - 8;
    const v_bomb = this.facing === 'right' ? 5 : -5; 
    bombs.push(new Bomb(bx, by, v_bomb));
    this.state = 'shoot';
    this.attackTimer = 10;
    this.frame = 0;
  }

  fireBigMissile() {
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
    if (k === this.controls.jump)  this.jump();
    if (k === this.controls.attack)this.shoot();
    if (k === this.controls.bomb)  this.bombHoldStartTime = millis();
  }

  handleKeyReleased(k) {
    this.keys[k] = false;
    if (k === this.controls.bomb && this.bombHoldStartTime !== null) {
      const held = millis() - this.bombHoldStartTime;
      if (held >= this.maxCharge ) this.fireBigMissile();
      else this.dropBomb();
      this.bombHoldStartTime = null;
      this.chargeTime = 0;
    }
  }

  draw() {
    // charge gauge 그리기
    if (this.chargeTime > 0) {
      // 최대 너비를 this.width(32px)로 매핑
      const w = map(this.chargeTime, 0, this.maxCharge, 0, this.width);
      // 충전 전: 노랑, 충전 완료 시: 빨강
      if (this.chargeTime < this.maxCharge) {
        fill(255, 255, 0);
      } else {
        fill(255, 0, 0);
      }
      rect(this.x, this.y - 10, w, 5);
      noFill();
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
  }
}



class Projectile {
  constructor(x, y, vx, w=8, h=8) {
    this.x = x;  this.y = y;
    this.vx = vx; this.width = w; this.height = h;
    this.spawnTime = millis(); this.lifetime = 10000;
    this.shouldDestroy = false;
  }

  update(targets) {
    this.x += this.vx;

    for (const t of targets) {
      if (this.hits(t)) {
        t.knockbackVX += this.vx * 0.5;
        this.shouldDestroy = true;
      }
    }

    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }

  draw() {
    image(itemimgs.fire[0], this.x, this.y, this.width * 2, this.height * 2);
  }

  destroy() {
    return this.shouldDestroy;
  }

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
  constructor(x, y, vx) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = 0;
    this.width = 32; this.height = 32;

    this.timer = 120;
    this.explodeTimer = 15;
    this.exploded = false;
    this.warning = false;
    this.shouldRemove = false;
    this.radius = 100;

    this.stuck = false;   // 착지 플래그
    this.stuckY = null;   // 멈춘 플랫폼의 y 좌표
  }

  update() {
    // 1) 폭발 타이머
    if (!this.exploded) {
      this.timer--;
      if (this.timer <= 60) this.warning = true;
      if (this.timer <= 0) {
        this.exploded = true;
        this.explode();
        return;
      }
    } else {
      // 폭발 애니메이션
      this.explodeTimer--;
      if (this.explodeTimer <= 0) this.shouldRemove = true;
      return;
    }

    // 2) 이미 착지(stuck) 상태면 위치만 고정
    if (this.stuck) {
      this.vy = 0;
      // 멈춘 행의 y값 기준으로 위치 고정
      this.y = this.stuckY - this.height;
      return;
    }

    // 3) 중력·이동
    this.vy += gravity;
    this.x  += this.vx;
    this.y  += this.vy;

    const landThreshold = 1;

    // 4) 타일 바운스 처리
    for (let tile of tiles) {
      if (
        this.y + this.height >= tile.y &&
        this.y + this.height - this.vy < tile.y &&
        this.x + this.width > tile.x &&
        this.x < tile.x + tile.width
      ) {
        // 타일 꼭대기로 위치 고정
        this.y = tile.y - this.height;

        // 반사 감쇠
        this.vy *= -0.5;
        this.vx *=  0.7;

        // 속도가 작아지면 진짜 착지
        if (Math.abs(this.vy) < landThreshold) {
          this.vy     = 0;
          this.stuck  = true;
          this.stuckY = tile.y;  // y좌표만 저장
        }
        break;
      }
    }
  }

  explode() {
    // 폭발 반경 내 모든 플레이어에게 넉백 적용
    [player1, player2].forEach(p => {
      const cx = this.x + this.width/2;
      const cy = this.y + this.height/2;
      const px = p.x + p.width/2;
      const py = p.y + p.height/2;
      const d = dist(cx, cy, px, py);

      if (d < this.radius) {
        const angle = atan2(py - cy, px - cx);
        const force = map(d, 0, this.radius, 20, 5);
        p.knockbackVX += cos(angle) * force * 2;
        p.vy         += sin(angle) * force * 2;
      }
    });

    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i];
      if ((t.type === 'breakableblock' || t.type === 'questionblock')) {
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        const tx = t.x + TILE_H/2;
        const ty = t.y + TILE_H/2;
        if (dist(cx, cy, tx, ty) < this.radius) {
          // 타일 제거
          tiles.splice(i, 1);
          // 파괴 애니메이션 추가
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
    // 미사일 이동
    this.x += this.vx;

    for (const t of targets) {
      // AABB 충돌 체크
      const w = this.width * 2;
      const h = this.height * 2;
      const overlapX = this.x < t.x + t.width && this.x + w > t.x;
      const overlapY = this.y < t.y + t.height && this.y + h > t.y;
      if (!overlapX || !overlapY) continue;

      // 플레이어가 미사일 위에 서 있는지 검사
      const playerBottom = t.y + t.height;
      const missileTop = this.y;
      // 아래로 충돌 시(떨어져서 올라탄 경우)
      if (t.vy > 0 && playerBottom <= missileTop + h * 0.1) {
        // 지면 위에 착지 처리
        t.y = missileTop - t.height;
        t.vy = 0;
      }
      else {
        // 측면 충돌 시 겹침 방지용 강제 이동
        if (this.vx > 0) {
          t.x = this.x + w;

        }
        else {
          t.x = this.x - t.width;
        }
      }
      break;
    }

    // 수명 검사
    if (millis() - this.spawnTime > this.lifetime) {
      this.shouldDestroy = true;
    }
  }

  draw() {
    const img = itemimgs.bigmissile[0];
    push();
    if (this.vx > 0) {
      // 왼쪽 발사시 이미지 뒤집기
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
    // 미사일 자체 크기로 충돌 영역 계산 (2배 확대된 폭)
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
    this.type   = type;
    this.img    = itemImgs[type][0];
    this.x      = x;
    this.y      = -TILE_H;
    this.vy     = 0;
    this.width  = TILE_H;
    this.height = TILE_H;
    this.toRemove = false;
  }

  update() {
    // 중력 떨어뜨리기
    this.vy += gravity;
    this.y  += this.vy;

    // 화면 밖으로 나가면 제거
    if (this.y > height) this.toRemove = true;

    // 플레이어 충돌 검사 (player1, player2)
    [player1, player2].forEach(p => {
      if (!this.toRemove && p.collides(this.x,this.y,this.width,this.height)) {
        p.applyItem(this.type);
        this.toRemove = true;
      }
    });
  }

  draw() {
    image(this.img, this.x, this.y, this.width, this.height);
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
  // 뒤에서부터 순회하며 업데이트·렌더·제거 처리
  for (let i = breakEffects.length - 1; i >= 0; i--) {
    const e = breakEffects[i];
    e.update();
    e.draw();
    if (!e.active) {
      breakEffects.splice(i, 1);
    }
  }
}