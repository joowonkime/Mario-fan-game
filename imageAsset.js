let spriteSheets = {};
let P1imgs = {}, P2imgs = {}, itemimgs = {}, tileimgs = {}, decoimgs = {};
let backgroundManager;

function preloadAssets() {
  // 1) 스프라이트 시트 로드
  spriteSheets.backgrounds   = loadImage("assets/Mario-Background.png");
  spriteSheets.characters    = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset       = loadImage("assets/Mario-Tileset.png");

  soundFormats('mp3', 'wav');

}

function sliceAssets() {
  // 2) 배경 슬라이스 및 Background 인스턴스 생성
  const bgsrc = spriteSheets.backgrounds;
  const w = 512, h = 512;
  const bgDay   = createImage(w, h);
  const bgNight = createImage(w, h);
  bgDay.copy(bgsrc,   514, 1565, w, h, 0, 0, w, h);
  bgNight.copy(bgsrc, 514, 5721, w, h, 0, 0, w, h);
  backgroundManager = new Background(bgDay, bgNight);

  // 3) 크로마키 함수
  function applyChromaKey(img, keyColor = {r:147, g:187, b:236}) {
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
      if (img.pixels[i] === keyColor.r && img.pixels[i+1] === keyColor.g && img.pixels[i+2] === keyColor.b) {
        img.pixels[i+3] = 0;
      }
    }
    img.updatePixels();
  }

  // 4) 캐릭터 프레임 슬라이스 (Mario)
  const src = spriteSheets.characters;
  const cw = 32, ch = 32;
  const mi = createImage(cw,ch); mi.copy(src, 1, 98, cw, ch, 0,0, cw,ch);
  const mw1= createImage(cw,ch); mw1.copy(src,75, 98, cw,ch,0,0, cw,ch);
  const mw2= createImage(cw,ch); mw2.copy(src,108,98, cw,ch,0,0, cw,ch);
  const mw3= createImage(cw,ch); mw3.copy(src,141,98, cw,ch,0,0, cw,ch);
  const mj = createImage(cw,ch); mj.copy(src,215,98, cw,ch,0,0, cw,ch);
  const ma = createImage(cw,ch); ma.copy(src,627,98, cw,ch,0,0, cw,ch);
  [mi,mw1,mw2,mw3,mj,ma].forEach(img=>applyChromaKey(img));
  
  P1imgs = { idle:[mi], walk:[mw1,mw2,mw3], jump:[mj], shoot:[ma] };

  // 5) 캐릭터 프레임 슬라이스 (Luigi)
  const li = createImage(cw,ch); li.copy(src,1,629,cw,ch,0,0,cw,ch);
  const lw1= createImage(cw,ch); lw1.copy(src,75,629,cw,ch,0,0,cw,ch);
  const lw2= createImage(cw,ch); lw2.copy(src,108,629,cw,ch,0,0,cw,ch);
  const lw3= createImage(cw,ch); lw3.copy(src,141,629,cw,ch,0,0,cw,ch);
  const lj = createImage(cw,ch); lj.copy(src,215,629,cw,ch,0,0,cw,ch);
  const la = createImage(cw,ch); la.copy(src,627,629,cw,ch,0,0,cw,ch);
  [li,lw1,lw2,lw3,lj,la].forEach(img=>applyChromaKey(img));

  P2imgs = { idle:[li], walk:[lw1,lw2,lw3], jump:[lj], shoot:[la] };

  // 6) 아이템 및 특수 투사체 프레임
  const spsrc = spriteSheets.specialweapon;
  const ow=16, oh=16;
  const mush = createImage(ow,oh); mush.copy(src,1,2126,ow,oh,0,0,ow,oh);
  const bombadd = createImage(ow,oh); bombadd.copy(spsrc, 39, 117, ow, oh, 0, 0, ow, oh);
  const poison= createImage(ow,oh); poison.copy(src,1,2143,ow,oh,0,0,ow,oh);
  const giant = createImage(ow,oh); giant.copy(src,52,2126,ow,oh,0,0,ow,oh);
  const fire  = createImage(ow/2,oh/2); fire.copy(src,101,2177,ow/2,oh/2,0,0,ow/2,oh/2);
  const fireench = createImage(ow, oh); fireench.copy(spsrc, 601, 751, ow, oh, 0, 0, ow, oh);
  const bomb  = createImage(ow,oh); bomb.copy(src,194,2143,ow,oh,0,0,ow,oh);
  const bm    = createImage(4*ow,4*oh); bm.copy(spsrc,127,356,4*ow,4*oh,0,0,4*ow,4*oh);
  const beffect = createImage(1.5*ow, 1.5*oh); beffect.copy(spsrc, 604, 413, 1.5*ow, 1.5*oh, 0, 0, 1.5*ow, 1.5*oh);
  [mush,bombadd,poison,giant,fire,fireench,bomb,bm, beffect].forEach(img=>applyChromaKey(img));
  function applyColorFilter(img, delta) {
    // img.pixels 에 접근해 기존 색상을 유지하며 R 증가, G 감소
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
      const alpha = img.pixels[i+3];
      if (alpha > 0) {
        let r = img.pixels[i];
        let g = img.pixels[i+1];
        let b = img.pixels[i+2];
        r = constrain(r + delta.r, 0, 255);
        g = constrain(g - delta.g, 0, 255);
        b = constrain(b - delta.b, 0, 255)
        img.pixels[i]   = r;
        img.pixels[i+1] = g;
        img.pixels[i+2] = b;
      }
    }
    img.updatePixels();
  }
  // 기존 bomb 이미지 복제 후 크로마키, 색상 필터 적용
  const bombWarn = bomb.get();
  applyColorFilter(bombWarn, {r: 150, g: 100, b:200} );

  itemimgs = {
    mush:[mush], poison:[poison], giant:[giant], bombadd:[bombadd], fire_enchant:[fireench],
    fire:[fire], bomb:[bomb], bigmissile:[bm], bomb_warning:[bombWarn], explosion:[beffect]
  };

  const tilesrc = spriteSheets.tileset;
  const bb = createImage(ow, oh); bb.copy(tilesrc, 18, 23, ow, oh, 0, 0, ow, oh);
  const qb = createImage(ow, oh); qb.copy(tilesrc, 35, 23, ow, oh, 0, 0, ow, oh);
  const gb = createImage(ow, oh); gb.copy(tilesrc, 154, 142, ow, oh, 0, 0, ow, oh);
  const gb1 = createImage(ow, oh); gb1.copy(tilesrc, 171, 74, ow, oh, 0, 0, ow, oh);
  [bb, qb, gb, gb1].forEach(img => applyChromaKey(img));
  tileimgs = {
    breakableblock:  [bb],
    questionblock:  [qb],
    groundblock:  [gb],
    groundblock1: [gb1]
  };
  const gb2 = createImage(ow, oh); gb2.copy(tilesrc, 171, 91, ow, oh, 0, 0, ow, oh);
  const breffect1 = createImage(2*ow, 2*oh); breffect1.copy(spsrc, 640, 1, 2*ow, 2*oh, 0, 0, 2*ow, 2*oh);
  const breffect2 = createImage(2*ow, 2*oh); breffect2.copy(spsrc, 673, 1, 2*ow, 2*oh, 0, 0, 2*ow, 2*oh);
  const breffect3 = createImage(2*ow, 2*oh); breffect3.copy(spsrc, 706, 1, 2*ow, 2*oh, 0, 0, 2*ow, 2*oh);
  [gb2, breffect1, breffect2, breffect3].forEach(img => applyChromaKey(img));
  decoimgs = {
    groundblock2: [gb2],
    breakeffect1: [breffect1],
    breakeffect2: [breffect2],
    breakeffect3: [breffect3]
  };




}