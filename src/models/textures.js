// Every texture in the game is painted here on a <canvas>. All are created lazily and cached.
import * as THREE from 'three';
import { nightMaterial } from './kit.js';

function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const memo = (fn) => {
  let v;
  return () => (v ??= fn());
};

const ART = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#d81b60', '#00acc1', '#ffffff'];

// ---- truck-art motifs ----
function flower(c, x, y, r, petal, center, n = 8) {
  c.fillStyle = petal;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, r * 0.22, a, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = center;
  c.beginPath();
  c.arc(x, y, r * 0.28, 0, Math.PI * 2);
  c.fill();
}
function zigzag(c, y, h, w, n, a, b) {
  c.fillStyle = a;
  c.fillRect(0, y, w, h);
  c.fillStyle = b;
  const s = w / n;
  for (let i = 0; i < n; i++) {
    c.beginPath();
    c.moveTo(i * s, y + h);
    c.lineTo(i * s + s / 2, y);
    c.lineTo(i * s + s, y + h);
    c.fill();
  }
}
function diamonds(c, y, h, w, n, bg) {
  c.fillStyle = bg;
  c.fillRect(0, y, w, h);
  const s = w / n;
  for (let i = 0; i < n; i++) {
    c.fillStyle = ART[i % ART.length];
    c.beginPath();
    c.moveTo(i * s + s / 2, y + 2);
    c.lineTo(i * s + s - 3, y + h / 2);
    c.lineTo(i * s + s / 2, y + h - 2);
    c.lineTo(i * s + 3, y + h / 2);
    c.fill();
  }
}
function slogan(c, text, x, y, size, fill = '#fdd835') {
  c.font = `italic 900 ${size}px "Trebuchet MS", sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = size / 6;
  c.strokeStyle = '#1b1024';
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
}

// Road strip: sidewalk | kerb | 3 lanes | kerb | sidewalk. 16.4 world units wide, 20 long.
export const ROAD_WIDTH = 16.4;
export const roadTexture = memo(() => {
  const t = tex(256, 512, (c, w, h) => {
    const u = w / ROAD_WIDTH;
    const walk = 3 * u;
    c.fillStyle = '#3d3d42';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.14)';
      c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    for (const x of [0, w - walk]) {
      c.fillStyle = '#b9a88e';
      c.fillRect(x, 0, walk, h);
      c.strokeStyle = 'rgba(0,0,0,.16)';
      c.lineWidth = 1;
      for (let y = 0; y < h; y += 32) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + walk, y);
        c.stroke();
      }
    }
    // yellow/black painted kerbs
    for (let y = 0; y < h; y += 64) {
      for (const x of [walk - 5, w - walk]) {
        c.fillStyle = '#f2c200';
        c.fillRect(x, y, 5, 32);
        c.fillStyle = '#1c1c1c';
        c.fillRect(x, y + 32, 5, 32);
      }
    }
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillRect(walk + 3, 0, 2, h);
    c.fillRect(w - walk - 5, 0, 2, h);
    for (const x of [w / 2 - 1.6 * u, w / 2 + 1.6 * u]) {
      c.fillRect(x - 1.5, 20, 3, 100);
      c.fillRect(x - 1.5, 276, 3, 100);
    }
  });
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2);
  return t;
});

// Shop sign atlas: 2 columns x 8 rows of 512x128 signs.
export const SIGN_NAMES = [
  'Bilal Chai Corner', 'Lahori Nihari House', 'Mobile Repair Center', 'Pehlwan Karahi',
  'Shahi Paan Shop', 'Anmol Cloth House', 'Al-Madina Bakers', 'Lassi Point',
  'Gawalmandi Sweets', 'Punjab Tailors', 'Zam Zam Juice', 'Khan Electronics',
  'Data Biryani', 'Rang Mahal Bangles', 'FOOD STREET', 'ANARKALI BAZAAR',
];
export const SHOP_SIGNS = 14; // the last two are reserved for the Anarkali landmark
const signAtlas = memo(() =>
  tex(1024, 1024, (c) => {
    const bg = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#00838f', '#ef6c00', '#ad1457'];
    SIGN_NAMES.forEach((name, i) => {
      const x = (i % 2) * 512;
      const y = (i >> 1) * 128;
      const dark = bg[(i * 3) % 8] !== '#f9a825';
      c.fillStyle = bg[(i * 3) % 8];
      c.fillRect(x, y, 512, 128);
      c.strokeStyle = dark ? '#ffe082' : '#b71c1c';
      c.lineWidth = 8;
      c.strokeRect(x + 10, y + 10, 492, 108);
      let size = 58;
      do {
        size -= 2;
        c.font = `900 ${size}px "Trebuchet MS", sans-serif`;
      } while (c.measureText(name).width > 450);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = dark ? '#fff' : '#1b1024';
      c.fillText(name, x + 256, y + 66);
    });
  })
);
/** Signs glow a little at night (the atlas doubles as its own emissive map). */
export const signMaterial = memo(() =>
  nightMaterial({ map: signAtlas(), emissiveMap: signAtlas(), emissive: 0xffffff }, 0, 0.75)
);
const signGeos = [];
/** Unit plane whose UVs select sign `i` from the atlas. Shared — never dispose. */
export function signGeo(i) {
  if (!signGeos[i]) {
    const g = new THREE.PlaneGeometry(1, 1);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) {
      uv.setXY(k, ((i % 2) + uv.getX(k)) / 2, 1 - ((i >> 1) + 1 - uv.getY(k)) / 8);
    }
    signGeos[i] = g;
  }
  return signGeos[i];
}

export const truckSideTexture = memo(() =>
  tex(512, 256, (c, w, h) => {
    c.fillStyle = '#b71c1c';
    c.fillRect(0, 0, w, h);
    zigzag(c, 0, 34, w, 16, '#fdd835', '#1e88e5');
    diamonds(c, 34, 30, w, 12, '#1b1024');
    for (let i = 0; i < 4; i++) {
      const x = i * 128;
      c.fillStyle = ['#00897b', '#fb8c00', '#1e88e5', '#d81b60'][i];
      c.fillRect(x + 6, 72, 116, 120);
      c.strokeStyle = '#fdd835';
      c.lineWidth = 5;
      c.strokeRect(x + 10, 76, 108, 112);
      flower(c, x + 64, 132, 44, ART[(i * 3 + 1) % 8], '#fff', 10);
      flower(c, x + 64, 132, 22, '#fdd835', '#e53935', 6);
    }
    zigzag(c, 200, 28, w, 20, '#43a047', '#fdd835');
    diamonds(c, 228, 28, w, 14, '#e53935');
  })
);
export const truckBackTexture = memo(() =>
  tex(256, 256, (c, w, h) => {
    c.fillStyle = '#1565c0';
    c.fillRect(0, 0, w, h);
    zigzag(c, 0, 26, w, 10, '#e53935', '#fdd835');
    diamonds(c, 26, 22, w, 8, '#1b1024');
    c.fillStyle = '#00897b';
    c.fillRect(10, 56, w - 20, 120);
    c.strokeStyle = '#fdd835';
    c.lineWidth = 6;
    c.strokeRect(14, 60, w - 28, 112);
    flower(c, 128, 116, 50, '#e53935', '#fff', 12);
    flower(c, 128, 116, 26, '#fdd835', '#d81b60', 8);
    flower(c, 48, 90, 20, '#fb8c00', '#fff');
    flower(c, 208, 90, 20, '#fb8c00', '#fff');
    flower(c, 48, 146, 20, '#d81b60', '#fdd835');
    flower(c, 208, 146, 20, '#d81b60', '#fdd835');
    slogan(c, 'MAA KI DUA', 128, 196, 26);
    slogan(c, 'DEKH MAGAR PYAR SE', 128, 226, 17, '#fff');
    zigzag(c, 242, 14, w, 16, '#43a047', '#fdd835');
  })
);

// Wazir Khan style kashi-kari tile work: blue / yellow / green geometric panels.
export const tileTexture = memo(() => {
  const t = tex(256, 256, (c, w) => {
    c.fillStyle = '#e3bd6a';
    c.fillRect(0, 0, w, w);
    const s = w / 4;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const x = i * s + s / 2;
        const y = j * s + s / 2;
        c.fillStyle = (i + j) % 2 ? '#1a4fa0' : '#0e8a7a';
        c.fillRect(x - s / 2 + 3, y - s / 2 + 3, s - 6, s - 6);
        c.strokeStyle = '#f7e9b0';
        c.lineWidth = 2;
        c.strokeRect(x - s / 2 + 6, y - s / 2 + 6, s - 12, s - 12);
        // 8-point star = two overlapping squares
        c.fillStyle = (i + j) % 2 ? '#f2c230' : '#f7e9b0';
        for (const rot of [0, Math.PI / 4]) {
          c.save();
          c.translate(x, y);
          c.rotate(rot);
          c.fillRect(-s * 0.24, -s * 0.24, s * 0.48, s * 0.48);
          c.restore();
        }
        flower(c, x, y, s * 0.2, (i + j) % 2 ? '#1a4fa0' : '#2e9c4a', '#c2452d', 8);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
});

/** Decorated panel on the back of the rickshaw, tinted per colour scheme. */
const backArt = new Map();
export function rickshawBackTexture(scheme) {
  if (!backArt.has(scheme.name)) {
    const [bg, a, b] = scheme.art;
    backArt.set(
      scheme.name,
      tex(256, 160, (c, w, h) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, w, h);
        c.strokeStyle = a;
        c.lineWidth = 8;
        c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = b;
        for (let x = 22; x < w - 12; x += 22) {
          c.beginPath();
          c.arc(x, 18, 4, 0, 7);
          c.arc(x, h - 18, 4, 0, 7);
          c.fill();
        }
        flower(c, 128, 84, 34, a, b, 10);
        flower(c, 50, 84, 18, b, a);
        flower(c, 206, 84, 18, b, a);
        slogan(c, 'LAHORE LAHORE AYE', 128, 40, 17, '#fff');
        slogan(c, 'MAA KI DUA', 128, 130, 18, a);
      })
    );
  }
  return backArt.get(scheme.name);
}

export const coinTexture = memo(() =>
  tex(64, 64, (c) => {
    c.fillStyle = '#f5c518';
    c.fillRect(0, 0, 64, 64);
    c.strokeStyle = '#b8860b';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(32, 32, 25, 0, 7);
    c.stroke();
    c.fillStyle = '#8a6200';
    c.font = '900 26px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Rs', 32, 34);
  })
);

function radial(size, stops) {
  return tex(size, size, (c) => {
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  });
}
export const shadowTexture = memo(() => radial(64, [[0, 'rgba(0,0,0,.55)'], [0.6, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]));
export const beamTexture = memo(() => radial(64, [[0, 'rgba(255,240,190,.9)'], [0.5, 'rgba(255,230,160,.3)'], [1, 'rgba(255,230,160,0)']]));
