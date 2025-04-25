let spriteSheets = {};
let P1imgs = {}, P2imgs = {}, itemimgs = {};
let backgroundManager;
let gravity = 0.8;

function preloadAssets() {
  // 1) 스프라이트 시트 로드
  spriteSheets.backgrounds   = loadImage("assets/Mario-Background.png");
  spriteSheets.characters    = loadImage("assets/Mario-Character+Item.png");
  spriteSheets.specialweapon = loadImage("assets/Mario-Enemy.png");
  spriteSheets.tileset       = loadImage("assets/Mario-Tileset.png");
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
  const ss = spriteSheets.specialweapon;
  const ow=16, oh=16;
  const mush = createImage(ow,oh); mush.copy(src,1,2126,ow,oh,0,0,ow,oh);
  const poison= createImage(ow,oh); poison.copy(src,1,2143,ow,oh,0,0,ow,oh);
  const giant = createImage(2*ow,2*oh); giant.copy(src,35,2143,2*ow,2*oh,0,0,2*ow,2*oh);
  const fire  = createImage(ow/2,oh/2); fire.copy(src,101,2177,ow/2,oh/2,0,0,ow/2,oh/2);
  const bomb  = createImage(ow,oh); bomb.copy(src,194,2143,ow,oh,0,0,ow,oh);
  const bm    = createImage(4*ow,4*oh); bm.copy(ss,127,356,4*ow,4*oh,0,0,4*ow,4*oh);
  [mush,poison,giant,fire,bomb,bm].forEach(img=>applyChromaKey(img));
  itemimgs = { mush:[mush], poison:[poison], giant:[giant], fire:[fire], bomb:[bomb], bigmissile:[bm] };
}