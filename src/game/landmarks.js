// The seven Lahore landmarks (low-poly, built for silhouette) and their spawn schedule.
// Builder space: the road-side edge is z = 0 and the landmark extends toward -z, centred on x.
import * as THREE from 'three';
import { box, cyl, taper, cone, ball, dome, wire, bake, plain, GLOW, rand, pick } from '../models/kit.js';
import { tileTexture } from '../models/textures.js';
import { shopSign, buildParkStrip, STRIP_LENGTH } from '../models/buildings.js';
import { FRONT_X } from './world.js';
import { VENDORS } from '../models/vendors.js';
import { game, SPEED_MIN } from './state.js';

const RED = 0xa8432f; // red sandstone
const FORT = 0xb5553c;
const MARBLE = 0xf3efe6;
const GOLD = 0xe0a91b;
const SHADE = 0x2b1712; // inside of archways
const PAVING = 0xc9b79a;
const LAWN = 0x4f9a3a;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sides = (fn) => [-1, 1].forEach(fn);

// ---- shared Mughal vocabulary ----
/** Bulbous dome on a drum with a finial. (x, y, z) is the centre of its base. */
function onion(g, color, r, x, y, z) {
  cyl(g, color, r * 0.9, r * 0.5, x, y + r * 0.25, z);
  ball(g, color, r, x, y + r * 1.3, z).scale.y = r * 2.2;
  cone(g, GOLD, r * 0.12, r * 0.8, x, y + r * 2.75, z);
}
/** Small domed kiosk on four posts. */
function chhatri(g, color, r, x, y, z, domeColor = color) {
  for (const dx of [-0.7, 0.7]) for (const dz of [-0.7, 0.7]) box(g, color, r * 0.15, r * 1.2, r * 0.15, x + dx * r, y + r * 0.6, z + dz * r);
  box(g, color, r * 2, r * 0.15, r * 2, x, y + r * 1.27, z);
  onion(g, domeColor, r * 0.8, x, y + r * 1.35, z);
}
/** Round-topped archway recess on a wall facing +z. y is the floor of the arch. */
function arch(g, color, w, h, x, y, z) {
  box(g, color, w, h - w / 2, 0.2, x, y + (h - w / 2) / 2, z);
  cyl(g, color, w / 2, 0.2, x, y + h - w / 2, z).rotation.x = Math.PI / 2;
}
function minaret(g, color, r, h, x, y, z, capColor, domeColor = capColor) {
  taper(g, color, r, h, x, y + h / 2, z);
  cyl(g, capColor, r * 0.95, 0.3, x, y + h, z);
  chhatri(g, capColor, r * 0.85, x, y + h + 0.15, z, domeColor);
}
const forecourt = (g, color) => box(g, color, 38, 0.12, 30, 0, 0.02, -15);

// ---- builders ----
function badshahi() {
  const g = new THREE.Group();
  forecourt(g, PAVING);
  box(g, RED, 36, 1.6, 20, 0, 0.8, -15); // raised platform
  box(g, RED, 8, 0.8, 2, 0, 0.4, -4.2); // steps
  box(g, RED, 26, 8, 8, 0, 5.6, -19); // prayer hall
  box(g, MARBLE, 26.2, 0.4, 8.2, 0, 9.8, -19);
  box(g, RED, 9, 12, 1.5, 0, 7.6, -14.6); // central pishtaq
  box(g, MARBLE, 9.2, 0.4, 1.7, 0, 13.8, -14.6);
  arch(g, SHADE, 5, 9, 0, 1.6, -13.8);
  box(g, MARBLE, 6.4, 0.3, 0.1, 0, 11.4, -13.82); // marble inlay frame
  sides((k) => {
    box(g, MARBLE, 0.3, 9.8, 0.1, k * 3.2, 6.5, -13.82);
    for (const x of [6.2, 8.6, 11]) arch(g, SHADE, 1.7, 5, k * x, 1.6, -14.95);
    onion(g, MARBLE, 2.6, k * 8.2, 9.6, -19.5);
    chhatri(g, MARBLE, 0.8, k * 12.6, 9.8, -15.4);
    chhatri(g, MARBLE, 0.6, k * 4.2, 14, -14.6);
    for (const z of [-6.2, -23.8]) minaret(g, RED, 1.3, 19, k * 16.8, 1.6, z, MARBLE); // four corner minarets
  });
  onion(g, MARBLE, 3.6, 0, 9.6, -19.5); // three white marble domes (with the two above)
  return bake(g);
}

function minar() {
  const g = new THREE.Group();
  forecourt(g, LAWN);
  // five-pointed star platform
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 6.5 : 12.5;
    const a = (i / 10) * Math.PI * 2;
    star[i ? 'lineTo' : 'moveTo'](Math.sin(a) * r, Math.cos(a) * r);
  }
  const base = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 1.2, bevelEnabled: false }).rotateX(-Math.PI / 2), plain(0xd9d2c2));
  base.position.set(0, 0.1, -15);
  g.add(base);
  cyl(g, 0xe6dfd0, 6.5, 1.0, 0, 1.8, -15);
  cyl(g, MARBLE, 4.6, 1.0, 0, 2.8, -15);
  // petal-like buttresses unfolding around the foot of the tower
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    cone(g, MARBLE, 1.3, 5.5, Math.sin(a) * 3.1, 5.6, -15 + Math.cos(a) * 3.1).rotation.set(Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42);
  }
  taper(g, MARBLE, 2.4, 26, 0, 16.3, -15); // the tapering tower
  for (const f of [0.35, 0.58, 0.8]) cyl(g, 0xd8d0c0, 2.4 * (1 - 0.44 * f) + 0.3, 0.4, 0, 3.3 + 26 * f, -15); // balconies
  cyl(g, MARBLE, 1.25, 1.6, 0, 30.1, -15);
  dome(g, 0xb8bcc2, 1.3, 1.5, 0, 30.9, -15);
  cone(g, 0xb8bcc2, 0.12, 2, 0, 33.3, -15);
  return bake(g);
}

function fort() {
  const g = new THREE.Group();
  forecourt(g, PAVING);
  box(g, FORT, 38, 9, 4, 0, 4.5, -10); // curtain wall
  for (let x = -18.5; x <= 18.5; x += 1.5) box(g, FORT, 0.8, 0.9, 0.6, x, 9.45, -8.3); // crenellations
  box(g, FORT, 10, 12.5, 5, 0, 6.25, -9); // gatehouse
  arch(g, SHADE, 4.2, 8, 0, 0, -6.45);
  box(g, MARBLE, 5.6, 0.25, 0.1, 0, 9.2, -6.45);
  sides((k) => {
    const x = k * 7.6;
    const z = -7.2;
    cyl(g, FORT, 3.4, 13, x, 6.5, z); // massive semi-circular bastion
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      box(g, 0x9c4631, 0.3, 12, 0.3, x + Math.sin(a) * 3.4, 6.5, z + Math.cos(a) * 3.4); // fluting
      cone(g, 0xc96a50, 0.75, 1.8, x + Math.sin(a) * 3.5, 0.9, z + Math.cos(a) * 3.5); // lotus-petal base
    }
    cyl(g, 0xd9c7a8, 3.6, 0.5, x, 12.9, z);
    chhatri(g, MARBLE, 2.0, x, 13.15, z);
    chhatri(g, MARBLE, 0.9, k * 3.6, 12.5, -7.6);
  });
  cyl(g, 0xdddddd, 0.06, 4, 0, 14.5, -9);
  box(g, 0x0b6b2e, 1.6, 1.0, 0.05, 0.85, 16, -9); // flag
  return bake(g);
}

let tileMat;
function wazir() {
  tileMat ??= new THREE.MeshLambertMaterial({ map: tileTexture() });
  const g = new THREE.Group();
  const BRICK = 0xb8683f;
  const CREAM = 0xe3bd6a;
  /** Tile-work panel facing +z; UVs scaled so tiles stay ~3 units wide. */
  const tiled = (w, h, x, y, z) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 3, (uv.getY(i) * h) / 3);
    const m = new THREE.Mesh(geo, tileMat);
    m.position.set(x, y, z);
    g.add(m);
  };
  forecourt(g, PAVING);
  box(g, BRICK, 26, 9, 10, 0, 4.5, -14);
  box(g, CREAM, 26.2, 0.4, 10.2, 0, 9.2, -14);
  box(g, BRICK, 10, 13, 2, 0, 6.5, -8.5); // tall central iwan, covered in tile
  tiled(10, 13, 0, 6.5, -7.48);
  arch(g, SHADE, 5, 9.5, 0, 0, -7.4);
  dome(g, 0xe9dfc8, 3.2, 2.6, 0, 9.2, -15);
  cone(g, GOLD, 0.15, 1, 0, 12.2, -15);
  sides((k) => {
    tiled(8, 3.2, k * 9, 7.0, -8.97);
    tiled(8, 0.8, k * 9, 0.5, -8.97);
    for (const x of [7, 11]) arch(g, SHADE, 2.2, 4.4, k * x, 0.9, -8.95);
    dome(g, 0xe9dfc8, 2, 1.6, k * 7.5, 9.2, -15);
    for (const z of [-9.4, -18.6]) {
      // slender octagonal minarets banded with tile
      const x = k * 13.6;
      cyl(g, BRICK, 1.1, 16, x, 8, z);
      for (const y of [4, 9, 13.5]) cyl(g, tileMat, 1.14, 2.4, x, y, z);
      cyl(g, CREAM, 1.5, 0.3, x, 16.1, z);
      chhatri(g, CREAM, 1.1, x, 16.25, z);
    }
  });
  return bake(g);
}

function shalimar() {
  const g = new THREE.Group();
  const WATER = 0x4fb3d9;
  forecourt(g, PAVING);
  const pavilion = (color, x, y, z, w, d) => {
    box(g, color, w + 1, 0.4, d + 1, x, y + 0.2, z);
    for (let i = 0; i < 4; i++) for (const k of [-1, 1]) box(g, color, 0.3, 2.6, 0.3, x - w / 2 + (i * w) / 3, y + 1.7, z + (k * d) / 2);
    box(g, color, w + 1.2, 0.4, d + 1.2, x, y + 3.2, z);
    box(g, color, w * 0.5, 1.2, d * 0.5, x, y + 4, z);
    onion(g, color, w * 0.2, x, y + 4.6, z);
    sides((k) => chhatri(g, color, 0.5, x + (k * w) / 2, y + 3.4, z));
  };
  // three terraces stepping up away from the road, a water channel down the middle
  [[-6.5, 0.8], [-15.5, 1.6], [-24.5, 2.4]].forEach(([z, h]) => {
    box(g, LAWN, 36, h, 9, 0, h / 2, z);
    box(g, 0xc97b5a, 36, 0.25, 0.4, 0, h + 0.05, z + 4.4);
    box(g, WATER, 3, 0.1, 9, 0, h + 0.03, z);
    for (let i = 0; i < 4; i++) {
      const fz = z - 3 + i * 2;
      cyl(g, 0xe8f6ff, 0.06, 1.2, 0, h + 0.6, fz); // fountain jet
      cone(g, 0xcfeeff, 0.35, 0.5, 0, h + 1.3, fz).rotation.x = Math.PI;
      sides((k) => cone(g, 0x1f5e2a, 0.6, 3.4, k * 2.8, h + 1.7, fz)); // cypresses
    }
    sides((k) => {
      for (let i = 0; i < 3; i++) box(g, pick([0xe91e63, 0xfdd835, 0xff7043]), 3, 0.25, 1.2, k * (7 + i * 4.5), h + 0.1, z); // flower beds
    });
  });
  box(g, WATER, 22, 0.1, 2.4, 0, 1.64, -15.5); // cross-channel pool
  pavilion(MARBLE, 0, 1.6, -15.5, 6, 4); // marble baradari
  sides((k) => {
    pavilion(FORT, k * 12, 2.4, -25, 5, 3.5); // red sandstone pavilions
    chhatri(g, FORT, 1.2, k * 17.4, 4.4, -29);
  });
  box(g, FORT, 36, 4.4, 0.8, 0, 2.2, -29.4); // perimeter wall
  return bake(g);
}

function darbar() {
  const g = new THREE.Group();
  forecourt(g, 0xd8d8d8);
  box(g, MARBLE, 30, 1, 20, 0, 0.5, -14); // plinth
  box(g, MARBLE, 12, 7, 10, 0, 4.5, -15); // shrine
  box(g, 0xdcd6c8, 12.3, 0.4, 10.3, 0, 8.1, -15);
  for (const x of [-3.8, 0, 3.8]) arch(g, 0x1f6b45, 2.2, 4.6, x, 1, -9.95); // green doors
  cyl(g, MARBLE, 4.2, 1.2, 0, 8.8, -15);
  onion(g, GOLD, 4.2, 0, 9.4, -15); // the golden dome
  sides((k) => {
    for (const z of [-10.8, -19.2]) chhatri(g, MARBLE, 1.0, k * 5.2, 8.3, z, GOLD);
    box(g, MARBLE, 8, 4, 6, k * 10.5, 3, -15); // arcade wings
    for (const x of [8, 10.5, 13]) arch(g, 0x6b7f8a, 1.6, 3, k * x, 1, -11.95);
    dome(g, GOLD, 1.4, 1.2, k * 10.5, 5, -15);
    // tall slim marble minarets with gold tips
    cyl(g, MARBLE, 0.9, 22, k * 15.5, 12, -8);
    for (const y of [14, 20]) cyl(g, GOLD, 1.15, 0.3, k * 15.5, y, -8);
    chhatri(g, MARBLE, 1.0, k * 15.5, 23, -8, GOLD);
    cyl(g, 0xdddddd, 0.05, 3, k * 6, 2.5, -3.5);
    box(g, 0x0b8f3a, 1.2, 0.8, 0.05, k * 6 + 0.6, 3.6, -3.5); // green flags
  });
  wire(g, GLOW.lamp, V(-15.5, 15, -8), V(15.5, 15, -8), 3.5, 12, 0.14); // string of lights
  return bake(g);
}

function anarkali() {
  const g = new THREE.Group();
  forecourt(g, 0x8a8078);
  const paint = [0xe57373, 0xffd54f, 0x4fc3f7, 0x81c784, 0xba68c8, 0xff8a65];
  const awn = [0xd32f2f, 0x1976d2, 0x388e3c, 0xf57c00, 0x7b1fa2, 0x00897b];
  const sign = (i, w, x, y, z) => (shopSign(g, i, w, x, y, z).rotation.y = 0); // face the road
  // tall narrow shop-houses with projecting wooden jharokha balconies
  paint.forEach((color, i) => {
    const x = -14 + i * 5.6;
    const h = rand(9, 13);
    box(g, color, 5.4, h, 6, x, h / 2, -9);
    box(g, 0x2b2b2b, 4.4, 2.4, 0.1, x, 1.2, -5.98);
    box(g, awn[i], 5.2, 0.08, 1.5, x, 2.75, -5.3).rotation.x = 0.25;
    sign(i * 2 + 1, 4.2, x, 3.55, -5.94);
    for (let y = 5.6; y < h - 1.5; y += 3.2) {
      box(g, 0x5d4037, 4.0, 1.6, 0.9, x, y, -5.6);
      box(g, 0x3e2723, 4.3, 0.15, 1.1, x, y + 0.85, -5.55);
      sides((k) => box(g, GLOW.window, 0.8, 1.0, 0.08, x + k * 1.0, y, -5.13));
    }
  });
  // gateway
  sides((k) => box(g, 0xc62828, 1, 6.5, 1, k * 7.2, 3.25, -1.5));
  box(g, 0xfdd835, 15.6, 1.5, 1, 0, 7.2, -1.5);
  sign(15, 5.6, -3.4, 7.2, -0.98);
  sign(14, 5.6, 3.4, 7.2, -0.98);
  // strings of hanging lights
  for (const [a, b] of [[V(-16, 9, -5.4), V(-7.2, 6.6, -1.5)], [V(16, 9, -5.4), V(7.2, 6.6, -1.5)], [V(-16, 7.5, -5.2), V(16, 7.5, -5.2)]]) {
    wire(g, 0x333333, a, b, 1.0, 10, 0.03).forEach((p) => ball(g, GLOW.lamp, 0.16, p.x, p.y - 0.15, p.z));
  }
  // food stalls, a barbecue grill, tables
  [-12, -3.5, 11].forEach((x, i) => {
    const v = VENDORS[i]();
    v.rotation.y = -Math.PI / 2;
    v.position.set(x, 0, -3.2);
    g.add(v);
  });
  box(g, 0x333333, 1.8, 0.9, 0.7, 4.5, 0.45, -3.4);
  box(g, GLOW.tail, 1.6, 0.05, 0.5, 4.5, 0.92, -3.4); // glowing coals
  for (let i = 0; i < 5; i++) box(g, 0x8d5a2b, 0.06, 0.06, 0.8, 3.9 + i * 0.3, 1.0, -3.4); // seekh kebabs
  for (const x of [-8, 7.5]) {
    box(g, 0xf5f5f5, 1.2, 0.08, 1.2, x, 0.8, -3);
    cyl(g, 0x555555, 0.06, 0.8, x, 0.4, -3);
    sides((k) => box(g, pick(awn), 0.4, 0.45, 0.4, x + k * 0.95, 0.22, -3));
  }
  return bake(g);
}

export const LANDMARKS = [
  { id: 'badshahi', name: 'Badshahi Mosque', short: 'Badshahi Mosque', urdu: 'بادشاہی مسجد', build: badshahi,
    fact: 'Built by Mughal Emperor Aurangzeb in 1671–73. For more than 300 years it was the largest mosque in the world.' },
  { id: 'minar', name: 'Minar-e-Pakistan', short: 'Minar-e-Pakistan', urdu: 'مینارِ پاکستان', build: minar,
    fact: 'Built 1960–68 on the spot where the Lahore Resolution was passed on 23 March 1940.' },
  { id: 'fort', name: 'Lahore Fort — Alamgiri Gate', short: 'Lahore Fort', urdu: 'شاہی قلعہ', build: fort,
    fact: 'The grand Alamgiri Gate was added by Emperor Aurangzeb in 1674. The fort is a UNESCO World Heritage Site.' },
  { id: 'wazir', name: 'Wazir Khan Mosque', short: 'Wazir Khan Mosque', urdu: 'مسجد وزیر خان', build: wazir,
    fact: 'Built 1634–41 in the reign of Shah Jahan by Wazir Khan, governor of Lahore. Famous for its kashi-kari tile work.' },
  { id: 'shalimar', name: 'Shalimar Gardens', short: 'Shalimar Gardens', urdu: 'شالامار باغ', build: shalimar,
    fact: 'Laid out by Emperor Shah Jahan in 1641–42: three terraces of Mughal garden cooled by some 410 fountains.' },
  { id: 'darbar', name: 'Data Darbar', short: 'Data Darbar', urdu: 'داتا دربار', build: darbar,
    fact: 'Shrine of the 11th-century Sufi saint Ali Hujwiri, known as Data Ganj Bakhsh — one of the largest Sufi shrines in South Asia.' },
  { id: 'anarkali', name: 'Anarkali Bazaar & Food Street', short: 'Anarkali Bazaar', urdu: 'انارکلی بازار', build: anarkali,
    fact: 'One of the oldest surviving markets in South Asia, around 200 years old and named after the legendary Anarkali.' },
];

const SETBACK = 9.5; // road centre → landmark's road-side edge

/** discovered: array of landmark ids already found (undiscovered ones are scheduled first). */
export function createLandmarks(world, discovered, onPass) {
  const built = {}; // id → baked model, built on first use
  let queue = [];
  let next = null;
  let nextAt = Infinity; // distance at which `next` should reach the player
  let active = null; // { def, chunk, obj, passed }
  let side = 0;
  // The two chunks before and the one after a landmark swap their shops for an open park strip,
  // so the landmark is visible on approach instead of popping out from behind buildings.
  const parks = [buildParkStrip(), buildParkStrip(), buildParkStrip()];
  let parkAfter = false;
  function addPark(chunk, i) {
    world.clearSide(chunk, side);
    parks[i].position.x = side ? FRONT_X : -FRONT_X;
    parks[i].rotation.y = side ? Math.PI : 0;
    chunk.group.add(parks[i]);
  }
  const removeParks = (chunk) => parks.forEach((p) => (!chunk || p.parent === chunk.group) && p.removeFromParent());

  function chooseNext() {
    if (!queue.length) {
      queue = [...LANDMARKS].sort(() => Math.random() - 0.5);
      queue.sort((a, b) => discovered.includes(a.id) - discovered.includes(b.id));
    }
    next = queue.shift();
  }
  function detach() {
    active.chunk.group.remove(active.obj);
    active = null;
  }

  world.onRecycle = (chunk) => {
    if (active?.chunk === chunk) detach();
    removeParks(chunk);
    if (parkAfter) {
      parkAfter = false;
      return addPark(chunk, 2);
    }
    // The recycled chunk reaches the player after |z| more units of travel.
    if (game.state !== 'playing' || active || game.distance - chunk.group.position.z < nextAt) return;
    const obj = (built[next.id] ??= next.build());
    side = 1 - side;
    world.clearSide(chunk, side);
    obj.rotation.y = side ? -Math.PI / 2 : Math.PI / 2;
    obj.position.set(side ? SETBACK : -SETBACK, 0, 0);
    chunk.group.add(obj);
    active = { def: next, chunk, obj, passed: false };
    for (const k of [1, 2]) {
      const nearer = world.chunks.find((c) => Math.abs(c.group.position.z - chunk.group.position.z - k * STRIP_LENGTH) < 1);
      if (nearer) addPark(nearer, k - 1);
    }
    parkAfter = true;
    nextAt = Infinity; // rescheduled when this one is passed
    chooseNext();
  };

  const api = {
    /** The landmark the player will reach next (the one on screen if not yet passed). */
    get upcoming() {
      return active && !active.passed ? active.def : next;
    },
    /** True if the upcoming landmark is already placed in the world (too late to reschedule). */
    get placed() {
      return !!active && !active.passed;
    },
    get distanceLeft() {
      return nextAt - game.distance;
    },
    /** (Re)schedule the next landmark to arrive in roughly `seconds` at current speed. */
    scheduleIn(seconds) {
      nextAt = game.distance + game.speed * seconds;
    },
    reset() {
      if (active) detach();
      removeParks();
      parkAfter = false;
      queue = [];
      chooseNext();
      nextAt = SPEED_MIN * rand(30, 38); // first one comes a little sooner
    },
    update() {
      if (active && !active.passed && active.chunk.group.position.z > -4) {
        active.passed = true;
        api.scheduleIn(rand(45, 60));
        onPass(active.def);
      }
    },
  };
  api.reset();
  return api;
}
