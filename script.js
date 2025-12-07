/* ===========================================================
   RPG PIXEL CHARACTER GENERATOR — COMPLETE JS ENGINE
   Fully client-side. HTML/JS/CSS only. Ready for itch.io.
   =========================================================== */

const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// UI Elements
const bodyType = document.getElementById("bodyType");
const skinColor = document.getElementById("skinColor");
const hairStyle = document.getElementById("hairStyle");
const hairColor = document.getElementById("hairColor");
const outfit = document.getElementById("outfit");
const palettePreset = document.getElementById("palettePreset");
const frameSize = document.getElementById("frameSize");

const exportPNG = document.getElementById("exportPNG");
const exportZIP = document.getElementById("exportZIP");
const randomizeBtn = document.getElementById("randomize");
const statusBox = document.getElementById("status");

let currentAnim = "idle";
let animFrame = 0;
let animTick = 0;

// ===========================================================
//  BUILT-IN PIXEL ASSETS (8x8 scaled up)
//  Replace with real sprites later.
// ===========================================================

function makeSprite(fill, w = 16, h = 16) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    let x = c.getContext("2d");
    x.fillStyle = fill;
    x.fillRect(0, 0, w, h);
    return c;
}

const ASSETS = {
    bodies: {
        base: makeSprite("#f1c27d"),
        male: makeSprite("#d8a37f"),
        female: makeSprite("#ffd1b5")
    },

    hair: {
        "short": makeSprite("#3a2b20"),
        "long": makeSprite("#3a2b20"),
        "ponytail": makeSprite("#3a2b20"),
        "spiky": makeSprite("#3a2b20")
    },

    outfits: {
        "none": makeSprite("rgba(0,0,0,0)"),
        "warrior": makeSprite("#4e2b8f"),
        "mage": makeSprite("#2b8f9b"),
        "rogue": makeSprite("#2b9b35"),
        "knight": makeSprite("#8f8e8e")
    }
};

// Populate dropdowns
Object.keys(ASSETS.hair).forEach(h => {
    const op = document.createElement("option");
    op.value = h;
    op.textContent = h;
    hairStyle.appendChild(op);
});

Object.keys(ASSETS.outfits).forEach(o => {
    const op = document.createElement("option");
    op.value = o;
    op.textContent = o;
    outfit.appendChild(op);
});

// ===========================================================
//   COLOR REPLACEMENT (Pixel Recoloring)
// ===========================================================

function recolorImage(srcCanvas, newColor) {
    let c = document.createElement("canvas");
    c.width = srcCanvas.width;
    c.height = srcCanvas.height;
    let x = c.getContext("2d");

    x.drawImage(srcCanvas, 0, 0);
    let img = x.getImageData(0, 0, c.width, c.height);

    let target = hexToRGB(newColor);

    for (let i = 0; i < img.data.length; i += 4) {
        if (img.data[i + 3] === 0) continue;
        img.data[i] = target.r;
        img.data[i + 1] = target.g;
        img.data[i + 2] = target.b;
    }

    x.putImageData(img, 0, 0);
    return c;
}

function hexToRGB(hex) {
    let c = hex.replace("#", "");
    if (c.length === 3) {
        c = c.split("").map(x => x + x).join("");
    }
    return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16)
    };
}

// ===========================================================
//   PALETTE PRESETS (Brightness / Contrast Filters)
// ===========================================================

function applyPalettePreset(c, preset) {
    const x = c.getContext("2d");
    const img = x.getImageData(0, 0, c.width, c.height);

    let factor;
    switch (preset) {
        case "dark":
            factor = 0.6;
            break;
        case "pastel":
            factor = 1.2;
            break;
        case "highcontrast":
            factor = 1.5;
            break;
        default:
            return c;
    }

    for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] *= factor;
        img.data[i + 1] *= factor;
        img.data[i + 2] *= factor;
    }

    x.putImageData(img, 0, 0);
    return c;
}

// ===========================================================
//   RENDER CHARACTER (1 frame)
// ===========================================================

function renderCharacterFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Retrieve assets
    let base = ASSETS.bodies[bodyType.value];
    let hairImg = ASSETS.hair[hairStyle.value];
    let outfitImg = ASSETS.outfits[outfit.value];

    // Colorize base skin
    base = recolorImage(base, skinColor.value);

    // Colorize hair
    hairImg = recolorImage(hairImg, hairColor.value);

    // Apply palette preset
    base = applyPalettePreset(base, palettePreset.value);
    hairImg = applyPalettePreset(hairImg, palettePreset.value);
    outfitImg = applyPalettePreset(outfitImg, palettePreset.value);

    // Draw centered
    const size = 16;
    const scale = 8;
    const x = (canvas.width - size * scale) / 2;
    const y = (canvas.height - size * scale) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, x, y, size * scale, size * scale);
    ctx.drawImage(outfitImg, x, y, size * scale, size * scale);
    ctx.drawImage(hairImg, x, y, size * scale, size * scale);
}

// ===========================================================
//   ANIMATION ENGINE
//   Idle = 2 frames
//   Walk = 4 frames
//   Attack = 3 frames
// ===========================================================

const animFrames = {
    idle: 2,
    walk: 4,
    attack: 3
};

function updateAnimation() {
    animTick++;

    if (animTick > 20) {
        animTick = 0;
        animFrame = (animFrame + 1) % animFrames[currentAnim];
        renderCharacterFrame();
    }

    requestAnimationFrame(updateAnimation);
}
updateAnimation();

// Animation button handling
document.querySelectorAll("#animButtons button").forEach(btn => {
    btn.onclick = () => {
        currentAnim = btn.dataset.anim;
        animFrame = 0;
    };
});

// ===========================================================
//   RANDOMIZER
// ===========================================================

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomize() {
    skinColor.value = randomSkin();
    hairColor.value = randomColor();
    hairStyle.value = randomChoice(Object.keys(ASSETS.hair));
    outfit.value = randomChoice(Object.keys(ASSETS.outfits));
    palettePreset.value = randomChoice(["original", "dark", "pastel", "highcontrast"]);
    renderCharacterFrame();
}

function randomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

function randomSkin() {
    const tones = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524"];
    return randomChoice(tones);
}

randomizeBtn.onclick = randomize;

// ===========================================================
//   EXPORT PNG SPRITESHEET
// ===========================================================

function exportPNGSheet() {
    const f = parseInt(frameSize.value);
    const frames = animFrames[currentAnim];
    const out = document.createElement("canvas");
    out.width = f * frames;
    out.height = f;
    const x = out.getContext("2d");

    x.imageSmoothingEnabled = false;

    // Draw each frame (same render for now)
    for (let i = 0; i < frames; i++) {
        renderCharacterFrame();
        x.drawImage(canvas, 0, 0, canvas.width, canvas.height, i * f, 0, f, f);
    }

    const url = out.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = url;
    a.download = "character_spritesheet.png";
    a.click();
}

exportPNG.onclick = exportPNGSheet;

// ===========================================================
//   EXPORT ZIP (PNG sheet + JSON metadata)
// ===========================================================

async function exportZIPFile() {
    statusBox.textContent = "Generating ZIP...";

    const zip = new JSZip();

    // Create main sheet
    const f = parseInt(frameSize.value);
    const frames = animFrames[currentAnim];
    const sheet = document.createElement("canvas");
    sheet.width = f * frames;
    sheet.height = f;
    let x = sheet.getContext("2d");
    x.imageSmoothingEnabled = false;

    for (let i = 0; i < frames; i++) {
        renderCharacterFrame();
        x.drawImage(canvas, 0, 0, canvas.width, canvas.height, i * f, 0, f, f);
    }

    const pngData = sheet.toDataURL("image/png").split(",")[1];
    zip.file("spritesheet.png", pngData, { base64: true });

    // JSON metadata
    const meta = {
        body: bodyType.value,
        skin: skinColor.value,
        hairStyle: hairStyle.value,
        hairColor: hairColor.value,
        outfit: outfit.value,
        anim: currentAnim,
        frames
    };

    zip.file("metadata.json", JSON.stringify(meta, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "character_export.zip";
    a.click();

    statusBox.textContent = "ZIP downloaded!";
}

exportZIP.onclick = exportZIPFile;

// Initial render
renderCharacterFrame();