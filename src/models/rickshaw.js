// The player's auto-rickshaw: 3 wheels, canopy, open sides, decorated back panel. Faces -z.
import * as THREE from 'three';
import { box, ball, cyl, wheel, plane, bake, GLOW } from './kit.js';
import { rickshawBackTexture } from './textures.js';

export const SCHEMES = [
  { name: 'Classic', body: 0x1f8a3b, canopy: 0xf6c519, trim: 0xf6c519, fringe: [0xd32f2f, 0xf6c519], art: ['#14632a', '#f6c519', '#e53935'] },
  { name: 'Truck Art', body: 0xd81b60, canopy: 0x1565c0, trim: 0xffd600, fringe: [0xe53935, 0xfdd835, 0x43a047, 0x1e88e5, 0xfb8c00], art: ['#6a1b9a', '#fdd835', '#00acc1'] },
  { name: 'Black & Gold', body: 0x1c1c20, canopy: 0x141417, trim: 0xd4a017, fringe: [0xd4a017, 0x3a3a40], art: ['#111114', '#d4a017', '#f5e7b2'] },
  { name: 'Blue & White', body: 0x1976d2, canopy: 0xf2f4f7, trim: 0xf2f4f7, fringe: [0x1976d2, 0xffffff], art: ['#0d47a1', '#ffffff', '#90caf9'] },
];

const artMats = new Map();
function artMaterial(s) {
  if (!artMats.has(s.name)) artMats.set(s.name, new THREE.MeshLambertMaterial({ map: rickshawBackTexture(s) }));
  return artMats.get(s.name);
}

function spinningWheel(model, r, w, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  wheel(g, 0x111111, r, w, 0, 0, 0);
  box(g, 0xd0d0d0, w + 0.02, r * 1.2, 0.07, 0, 0, 0); // hub bar makes the spin readable
  model.add(g);
  return g;
}

export function buildRickshaw(s) {
  const st = new THREE.Group(); // static parts, baked below
  const dark = 0x1b1b1f;
  const side = (fn) => [-1, 1].forEach(fn);

  box(st, dark, 1.3, 0.12, 2.7, 0, 0.42, 0); // chassis
  box(st, s.body, 1.5, 0.5, 1.3, 0, 0.72, 0.62); // rear tub
  box(st, s.trim, 1.52, 0.06, 1.32, 0, 0.9, 0.62);
  box(st, s.body, 1.0, 0.55, 0.5, 0, 0.75, -1.2); // nose
  box(st, s.body, 0.7, 0.4, 0.3, 0, 0.72, -1.5);
  box(st, s.trim, 1.02, 0.07, 0.52, 0, 1.04, -1.2);
  box(st, s.body, 0.3, 0.1, 0.8, 0, 0.64, -1.45); // mudguard
  ball(st, GLOW.head, 0.14, 0, 0.95, -1.66);

  box(st, dark, 0.7, 0.06, 0.06, 0, 1.25, -1.05); // handlebar
  cyl(st, dark, 0.04, 0.5, 0, 1.05, -1.1);
  box(st, 0x9fd4e8, 1.2, 0.6, 0.04, 0, 1.55, -1.22); // windshield
  side((k) => {
    box(st, s.body, 0.06, 1.0, 0.06, k * 0.62, 1.45, -1.22);
    box(st, s.trim, 0.06, 1.05, 0.06, k * 0.72, 1.45, -0.25);
    box(st, s.trim, 0.06, 0.4, 0.06, k * 0.72, 1.78, 1.26);
    box(st, dark, 0.16, 0.12, 0.03, k * 0.78, 1.5, -1.2); // mirrors
    box(st, GLOW.tail, 0.2, 0.1, 0.05, k * 0.55, 0.53, 1.3);
  });

  // driver
  box(st, 0x5a3a22, 0.7, 0.12, 0.45, 0, 0.78, -0.55);
  box(st, 0xf4f1e8, 0.45, 0.6, 0.3, 0, 1.2, -0.55);
  ball(st, 0xc68642, 0.17, 0, 1.68, -0.55);
  box(st, 0xffffff, 0.3, 0.08, 0.3, 0, 1.83, -0.55);
  side((k) => box(st, 0xf4f1e8, 0.1, 0.1, 0.5, k * 0.25, 1.3, -0.82));

  box(st, s.body, 1.4, 0.6, 0.06, 0, 0.95, -0.25); // partition
  box(st, 0x7a1f1f, 1.3, 0.1, 0.6, 0, 1.02, 0.75); // passenger bench
  box(st, s.body, 1.5, 1.0, 0.08, 0, 1.1, 1.26); // back panel
  plane(st, artMaterial(s), 1.4, 0.9, 0, 1.12, 1.305);
  box(st, 0xfafafa, 0.5, 0.14, 0.03, 0, 0.53, 1.3); // number plate
  box(st, dark, 1.5, 0.08, 0.1, 0, 0.42, 1.32);

  box(st, s.canopy, 1.6, 0.1, 2.6, 0, 2.0, 0); // canopy
  box(st, s.canopy, 1.3, 0.1, 2.2, 0, 2.08, 0);
  box(st, s.trim, 0.2, 0.02, 2.2, 0, 2.14, 0);
  box(st, s.canopy, 1.6, 0.2, 0.08, 0, 1.9, -1.3);
  // tassel fringe
  const n = s.fringe.length;
  for (let i = 0; i < 13; i++) side((k) => box(st, s.fringe[i % n], 0.03, 0.14, 0.16, k * 0.8, 1.9, -1.2 + i * 0.2));
  for (let i = 0; i < 8; i++) box(st, s.fringe[i % n], 0.16, 0.14, 0.03, -0.7 + i * 0.2, 1.9, 1.31);

  const model = new THREE.Group();
  model.add(bake(st));

  // seated passenger, shown only during a mission
  const rider = new THREE.Group();
  box(rider, 0x8e44ad, 0.45, 0.55, 0.28, 0, 1.35, 0.85);
  ball(rider, 0xc68642, 0.17, 0, 1.8, 0.85);
  box(rider, 0x1a1a1a, 0.3, 0.1, 0.3, 0, 1.93, 0.85);
  const passenger = bake(rider);
  passenger.visible = false;
  model.add(passenger);

  model.userData.passenger = passenger;
  model.userData.wheels = [
    spinningWheel(model, 0.3, 0.14, 0, 0.3, -1.45),
    spinningWheel(model, 0.32, 0.16, -0.72, 0.32, 0.75),
    spinningWheel(model, 0.32, 0.16, 0.72, 0.32, 0.75),
  ];
  return model;
}
