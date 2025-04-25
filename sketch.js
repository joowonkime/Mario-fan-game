let player1, player2;
let projectiles = [], specialProjectiles = [], bombs = [];
let groundY = 500, deathZoneY = 600;
let controlsP1, controlsP2;

function preload() {
  preloadAssets();
}

function setup() {
  createCanvas(800, 1600);
  sliceAssets();

  controlsP1 = { left:'ArrowLeft', right:'ArrowRight', jump:'ArrowUp', attack:'[', bomb:']' };
  controlsP2 = { left:'a',         right:'d',          jump:'w',      attack:'t', bomb:'y' };

  player1 = new Player(100, 100, P1imgs, controlsP1);
  player2 = new Player(200, 100, P2imgs, controlsP2);
}

function draw() {
  backgroundManager.draw();
  rect(0, groundY, width, 100);

  player1.update(); player1.draw();
  player2.update(); player2.draw();

  handleProjectiles();
  handleBombs();
  handleSpecialProjectiles();
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
    this.deathCount = 10;
    this.imgSet = imgSet;
    this.controls = controls;
    this.keys = {};
    this.bombHoldStartTime = null;
    this.skill = { resist:false, fastFire:false, isGiant:false, itemCount:0 };
    this.facing = "right";
    this.state = "idle";
    this.frame = 0;
  }

  update() {
    let inputVX = 0;
    if (this.keys[this.controls.left])      { inputVX = -5; this.facing = "left"; }
    else if (this.keys[this.controls.right]){ inputVX = 5;  this.facing = "right"; }

    this.vx = inputVX + this.knockbackVX;
    this.vy += gravity;
    this.x  += this.vx;
    this.y  += this.vy;

    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.jumpCount = 0;
      this.state = "idle";
    } else {
      this.onGround = false;
      this.state = "jump";
    }

    this.knockbackVX *= 0.9;
    if (abs(this.knockbackVX) < 0.1) this.knockbackVX = 0;

    if (this.y > deathZoneY) {
      this.deathCount--;
      this.state = "dead";
      this.respawn();
    }
  }

  respawn() {
    this.x = 100; this.y = 100;
    this.vx = this.vy = this.knockbackVX = 0;
  }

  jump() {
    if (this.jumpCount < 2) {
      this.vy = -15;
      this.jumpCount++;
    }
  }

  shoot() {
    const spawnX = this.facing === 'right' ? this.x + this.width : this.x - 16;
    const spawnY = this.y + this.height/2;
    const dir = this.facing === 'right' ? 20 : -20;
    projectiles.push(new Projectile(spawnX, spawnY, dir));
  }

  dropBomb() {
    const bx = this.x + this.width/2;
    const by = this.y + this.height;
    bombs.push(new Bomb(bx, by));
  }

  fireBigMissile() {
    const dir = this.facing === 'right' ? 5 : -5;
    const mW = 64 * 2, mH = 64 * 2;
    const spawnX = this.facing === 'right'
      ? this.x + this.width
      : this.x - mW;
    const spawnY = this.y + this.height - mH;
    specialProjectiles.push(new BigMissile(spawnX, spawnY, dir));
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
      if (held >= 1000 ) this.fireBigMissile();
      else this.dropBomb();
      this.bombHoldStartTime = null;
    }
  }

  draw() {
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
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width  = 16;
    this.height = 16;
    
    this.timer        = 60;    // 폭발 대기 프레임 수
    this.explodeTimer = 15;    // 폭발 시각화 지속 프레임 수
    this.exploded     = false; // 폭발 상태 플래그
    this.shouldRemove = false; // 완전 제거 플래그
    
    this.radius = 100;         // 넉백 및 시각화 반경(이 값을 키워 범위 확대)
  }

  update() {
    if (!this.exploded) {
      // 타이머가 0 이 되면 폭발 시작
      this.timer--;
      if (this.timer <= 0) {
        this.exploded = true;
        this.explode();  // 넉백 한 번 적용
      }
    } else {
      // 폭발 시각화가 끝나면 제거
      this.explodeTimer--;
      if (this.explodeTimer <= 0) {
        this.shouldRemove = true;
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
  }

  draw() {
    if (!this.exploded) {
      image(itemimgs.bomb[0], this.x, this.y, this.width * 2, this.height * 2);
    } else {
      // 폭발 중일 땐 커다란 반투명 원으로 시각화
      noFill();
      stroke(255, 150, 0);
      strokeWeight(4);
      ellipse(
        this.x + this.width/2,
        this.y + this.height/2,
        this.radius * 2,
        this.radius * 2
      );
      noStroke();
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
    // 하단 정렬: 플레이어 바닥 높이에 맞추기 위해 y에서 2배 높이만큼 올림
    this.x = x;
    this.y = y - this.height;
  }

  update(targets) {
    this.x += this.vx;

    for (const t of targets) {
      if (this.hits(t)) {
        // 강력한 넉백
        const force = this.vx * 2;
        t.knockbackVX += force;
        // 겹침 방지: 대상 위치 조정
        const w = this.width * 2;
        if (this.vx > 0) {
          // 미사일이 오른쪽으로 이동 중이면 대상은 미사일 우측으로 밀어냄
          t.x = this.x + w;
        } else {
          // 왼쪽 이동 중이면 대상은 미사일 좌측으로
          t.x = this.x - t.width;
        }
        // 미사일은 충돌로 사라지지 않음
        break;
      }
    }

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