let animations = {};
let backgroundManager;

function preloadAssets() {
  // 배경 이미지는 기존 방식 그대로
  const bg = loadImage("assets/Mario-Background.png");
  const w = 512, h = 512;
  const dayImg   = createImage(w,h);
  const nightImg = createImage(w,h);
  dayImg.copy(bg,   514,1565, w,h, 0,0, w,h);
  nightImg.copy(bg, 514,5721, w,h, 0,0, w,h);
  backgroundManager = new Background(dayImg, nightImg);

  // Mario 애니메이션 로드
  animations.marioIdle = loadAnimation(
    "assets/Mario-Character+Item.png",
    1, 98, 32, 32, 1
  );
  animations.marioWalk = loadAnimation(
    "assets/Mario-Character+Item.png",
    75,  98, 32,32, 3
  );
  animations.marioJump = loadAnimation(
    "assets/Mario-Character+Item.png",
    215, 98, 32,32, 1
  );
  animations.marioShoot = loadAnimation(
    "assets/Mario-Character+Item.png",
    627, 98, 32,32, 1
  );

  // Luigi 애니메이션 로드
  animations.luigiIdle = loadAnimation(
    "assets/Mario-Character+Item.png",
    1,  629, 32,32, 1
  );
  animations.luigiWalk = loadAnimation(
    "assets/Mario-Character+Item.png",
    75, 629, 32,32, 3
  );
  animations.luigiJump = loadAnimation(
    "assets/Mario-Character+Item.png",
    215,629, 32,32, 1
  );
  animations.luigiShoot = loadAnimation(
    "assets/Mario-Character+Item.png",
    627,629, 32,32, 1
  );

  // 아이템 애니메이션 (단프레임)
  animations.mushroom = loadAnimation("assets/Mario-Character+Item.png", 1, 2126, 16, 16, 1);
  animations.poison   = loadAnimation("assets/Mario-Character+Item.png", 1, 2143, 16, 16, 1);
  animations.giant    = loadAnimation("assets/Mario-Character+Item.png", 35,2143,32,32, 1);
  animations.fire     = loadAnimation("assets/Mario-Character+Item.png", 101,2177, 8,8, 1);
  animations.bomb     = loadAnimation("assets/Mario-Character+Item.png", 194,2143,16,16,1);
  animations.bigmissile = loadAnimation("assets/Mario-Enemy.png", 127,356,64,64,1);
}