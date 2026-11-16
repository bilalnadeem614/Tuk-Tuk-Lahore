// A 40-unit "strip" of Lahore street frontage: shops, signs, balconies, wires, lights, trees,
// vendors, bunting. Built once, baked to a handful of draw calls, then pooled by world.js.
// Local space: shop fronts on the x = 0 line facing +x (the road); buildings extend toward -x.
import * as THREE from 'three';
import { box, cyl, ico, wire, bake, GLOW, rand, pick } from './kit.js';
import { signGeo, signMaterial, SHOP_SIGNS } from './textures.js';
import { VENDORS } from './vendors.js';

export const STRIP_LENGTH = 40;
const WALLS = [0xe8d5b0, 0xd9a48a, 0xa9c7d6, 0xb7d3a8, 0xe3c16f, 0xc98b6b, 0xd7c7e0, 0xf0e6d2, 0x9fb7a5, 0xe2a9a0];
const AWNINGS = [0xd32f2f, 0x1976d2, 0x388e3c, 0xf57c00, 0x7b1fa2, 0x00897b];
const LAUNDRY = [0xffffff, 0xe53935, 0x1e88e5, 0xfdd835, 0x8e24aa];
const FLAGS = [0x0b8f3a, 0xffffff, 0xff4081, 0xffd600, 0x29b6f6];
const FLOOR = 3.2;
const DEPTH = 6;

/** Sign from the atlas, facing +x. */
export function shopSign(g, index, width, x, y, z) {
  const s = new THREE.Mesh(signGeo(index), signMaterial());
  s.scale.set(width, width / 4, 1);
  s.rotation.y = Math.PI / 2;
  s.position.set(x, y, z);
  g.add(s);
  return s;
}

function building(g, zc, w) {
  const floors = pick([1, 2, 2, 3, 3, 4]);
  const h = floors * FLOOR + 0.9;
  box(g, pick(WALLS), DEPTH, h, w, -DEPTH / 2, h / 2, zc);

  // ground-floor shop
  box(g, pick([0x2b2b2b, 0x3a2f2a, 0x55626e]), 0.1, 2.4, w - 1.2, 0.02, 1.2, zc);
  for (let i = 0; i < 3; i++) box(g, pick(LAUNDRY), 0.3, rand(0.4, 0.9), 0.5, 0.2, 0.4, zc + rand(-w / 2 + 1, w / 2 - 1)); // goods out front
  box(g, pick(AWNINGS), 1.5, 0.08, w - 0.6, 0.7, 2.75, zc).rotation.z = -0.25;
  shopSign(g, (Math.random() * SHOP_SIGNS) | 0, Math.min(w - 1, 4.4), 0.06, 3.5, zc);

  for (let f = 1; f < floors; f++) {
    const y = f * FLOOR + 2.3;
    const n = Math.max(1, Math.floor(w / 2.2));
    for (let i = 0; i < n; i++) {
      const z = zc + (i - (n - 1) / 2) * (w / n);
      box(g, Math.random() < 0.6 ? GLOW.window : 0x2c3e50, 0.08, 1.3, 0.9, 0.03, y, z);
      if (Math.random() < 0.2) box(g, 0xdfe3e6, 0.4, 0.35, 0.7, 0.2, y - 1.0, z); // AC unit
    }
    if (Math.random() < 0.4) {
      const bw = w * 0.7;
      box(g, 0xbdb5a6, 1.0, 0.12, bw, 0.5, y - 0.9, zc);
      box(g, pick([0x3e2723, 0x263238, 0x1b5e20]), 0.06, 0.7, bw, 0.97, y - 0.5, zc);
      if (Math.random() < 0.5) for (let i = 0; i < 3; i++) box(g, pick(LAUNDRY), 0.04, 0.5, 0.4, 1.01, y - 0.45, zc + (i - 1) * 0.6);
    }
  }
  if (Math.random() < 0.5) {
    // rooftop water tank
    box(g, 0x8a8a8a, 1.0, 0.5, 1.0, -2, h + 0.25, zc);
    cyl(g, 0x1e6fb8, 0.6, 1.2, -2, h + 1.1, zc);
  }
}

function streetlight(g, z) {
  cyl(g, 0x555b61, 0.09, 6.5, 2.7, 3.25, z);
  box(g, 0x555b61, 1.8, 0.1, 0.1, 3.5, 6.45, z);
  box(g, GLOW.lamp, 0.7, 0.12, 0.3, 4.1, 6.35, z);
}

function tree(g, z) {
  cyl(g, 0x6b4a2b, 0.18, 2.6, 2.0, 1.3, z);
  ico(g, pick([0x2f7d32, 0x3c8f3a]), 1.5, 2.0, 3.5, z);
  ico(g, 0x4a9d45, 1.05, 2.3, 4.5, z + 0.4);
}

/** Open strip (low wall, lawn, trees) used next to landmarks instead of shops. Same local space as a strip. */
export function buildParkStrip() {
  const g = new THREE.Group();
  box(g, 0x5a9a44, 14, 0.1, STRIP_LENGTH, -8, 0.02, 0); // lawn
  box(g, 0xb5553c, 0.4, 0.9, STRIP_LENGTH, -0.4, 0.45, 0); // low brick wall
  for (let z = -18; z <= 18; z += 4) box(g, 0xd9c7a8, 0.5, 1.15, 0.5, -0.4, 0.57, z);
  for (let z = -15; z <= 15; z += 10) {
    cyl(g, 0x6b4a2b, 0.2, 3, -3.5, 1.5, z);
    ico(g, 0x3c8f3a, 1.8, -3.5, 4, z);
    ico(g, 0x4a9d45, 1.2, -3.2, 5.2, z + 0.5);
  }
  streetlight(g, -10);
  streetlight(g, 10);
  box(g, 0x6b4a2b, 0.5, 0.45, 1.8, 1.2, 0.3, 0); // bench
  return bake(g);
}

export function buildStrip() {
  const g = new THREE.Group();
  const half = STRIP_LENGTH / 2;

  for (let z = -half; z < half; ) {
    let w = rand(5, 8.5);
    if (half - z - w < 4) w = half - z; // last building fills the remainder
    building(g, z + w / 2, w - 0.15);
    z += w;
  }

  streetlight(g, -10);
  streetlight(g, 10);
  tree(g, -15.5);
  if (Math.random() < 0.6) tree(g, 4.5);
  for (const [z, chance] of [[-3.5, 0.55], [15, 0.3]]) {
    if (Math.random() < chance) {
      const v = pick(VENDORS)();
      v.position.set(1.5, 0, z);
      g.add(v);
    }
  }

  // electricity pole with tangled wires
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const pz = -half + 0.4;
  cyl(g, 0x4a3b2a, 0.12, 8, 0.5, 4, pz);
  box(g, 0x4a3b2a, 1.6, 0.12, 0.12, 0.5, 7.6, pz);
  if (Math.random() < 0.4) box(g, 0x7a7f85, 0.7, 0.9, 0.7, 0.5, 6.3, pz); // transformer
  for (const x of [-0.2, 0.5, 1.2]) wire(g, 0x161616, V(x, 7.65, pz), V(x, 7.65, pz + STRIP_LENGTH), rand(0.4, 1.0));
  for (let i = 0; i < 4; i++) wire(g, 0x161616, V(0.5, rand(6.5, 7.5), pz), V(0, rand(4, 7), rand(-15, 15)), rand(0.3, 1.2), 3);

  // bunting across the whole road — hung high enough to clear trucks and the (taller) portrait camera
  if (Math.random() < 0.35) {
    const z = rand(-12, 12);
    const pts = wire(g, 0x333333, V(-0.1, 9.6, z), V(16.9, 9.6, z), 1.3, 14, 0.03);
    pts.slice(1, -1).forEach((p, i) => box(g, FLAGS[i % FLAGS.length], 0.36, 0.44, 0.03, p.x, p.y - 0.25, p.z));
  }
  return bake(g);
}
