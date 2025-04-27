let effectSound = {};
let bgm = {};

function preloadSounds() {
    soundFormats('mp3','wav');
    bgm.bgmGround         = loadSound('assets/M1_BGM_Ground_Play.mp3');
    bgm.bgmGroundHurry    = loadSound('assets/M1_BGM_Ground_PlayHurry.mp3');

    effectSound.jump    = loadSound('assets/SMB1 Sounds/M1_SmallMarioJump.wav');
    effectSound.fire    = loadSound('assets/SMB1 Sounds/M1_fire.wav');
    effectSound.dead    = loadSound('assets/SMB1 Sounds/M1_HitFloor.wav');
    effectSound.getItem = loadSound('assets/SMB1 Sounds/M1_PowerUp.wav');
    effectSound.breakBlock = loadSound('assets/SMB1 Sounds/M1_BreakBlock.wav');
    effectSound.bomb    = loadSound('assets/SMB1 Sounds/SE_chargeshot.wav');
    effectSound.bigmissile = loadSound('assets/SMB1 Sounds/M1_FireLong.wav');
    effectSound.victory = loadSound('assets/SMB1 Sounds/M1_CourseClearFanfare.wav');
}