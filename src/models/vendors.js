// Street vendors. Each faces +x (toward the road when placed on a building strip).
import * as THREE from 'three';
import { box, cyl, ball, cone, wheel, pick } from './kit.js';
import { buildPerson, SHIRTS } from './passenger.js';

function vendorPerson(g) {
  const p = buildPerson(pick(SHIRTS));
  p.position.set(-0.95, 0, 0);
  p.rotation.y = Math.PI / 2;
  g.add(p);
}

export function chaiStall() {
  const g = new THREE.Group();
  box(g, 0x8d5a2b, 1.1, 0.9, 2.0, 0, 0.45, 0); // counter
  for (const [x, z] of [[-0.5, -0.95], [0.5, -0.95], [-0.5, 0.95], [0.5, 0.95]]) cyl(g, 0x6b4a2b, 0.04, 2.3, x, 1.15, z);
  box(g, 0xc62828, 1.7, 0.08, 2.4, 0.1, 2.35, 0).rotation.z = -0.12; // cloth canopy
  box(g, 0x2b2b2b, 0.4, 0.2, 0.4, 0, 1.0, -0.5); // stove
  ball(g, 0xb9bec4, 0.22, 0, 1.3, -0.5); // kettle
  cone(g, 0xb9bec4, 0.06, 0.3, 0.25, 1.35, -0.5).rotation.z = -1.1;
  for (let i = 0; i < 4; i++) cyl(g, 0xffffff, 0.05, 0.1, 0.2, 0.95, 0.1 + i * 0.18); // cups
  box(g, 0xfdd835, 0.5, 0.3, 0.3, 0, 1.05, 0.7); // biscuit tin
  vendorPerson(g);
  return g;
}

export function golGappaCart() {
  const g = new THREE.Group();
  box(g, 0x1976d2, 1.0, 0.5, 1.6, 0, 0.75, 0);
  box(g, 0xfdd835, 1.04, 0.1, 1.64, 0, 1.02, 0);
  for (const z of [-0.6, 0.6]) for (const x of [-0.52, 0.52]) wheel(g, 0x222222, 0.25, 0.08, x, 0.25, z);
  box(g, 0xbfe6f2, 0.8, 0.5, 0.9, 0, 1.32, -0.25); // glass case
  for (let i = 0; i < 9; i++) ball(g, 0xd9a441, 0.09, -0.2 + (i % 3) * 0.2, 1.15 + ((i / 3) | 0) * 0.13, -0.45 + (i % 2) * 0.3); // gol gappay
  cyl(g, 0xa0522d, 0.2, 0.35, 0, 1.25, 0.5); // imli pani matka
  for (const z of [-0.78, 0.78]) cyl(g, 0xe53935, 0.03, 1.4, 0.45, 1.75, z);
  box(g, 0xe53935, 0.9, 0.06, 1.8, 0.1, 2.45, 0); // roof
  vendorPerson(g);
  return g;
}

export function fruitCart() {
  const g = new THREE.Group();
  box(g, 0x8d6e4a, 1.2, 0.12, 2.0, 0, 0.85, 0);
  box(g, 0x6b4a2b, 1.2, 0.1, 0.1, 0, 0.6, 0);
  for (const z of [-0.5, 0.5]) for (const x of [-0.65, 0.65]) wheel(g, 0x3a2a1a, 0.42, 0.07, x, 0.42, z);
  const fruit = [0xff8f00, 0xd32f2f, 0xfdd835, 0x7cb342]; // oranges, apples, mangoes, guavas
  fruit.forEach((color, k) => {
    for (let i = 0; i < 7; i++) ball(g, color, 0.11, -0.3 + (i % 3) * 0.3, 1.0 + (i > 5 ? 0.15 : 0), -0.75 + k * 0.5 + ((i / 3) | 0) * 0.13);
  });
  vendorPerson(g);
  return g;
}

export const VENDORS = [chaiStall, golGappaCart, fruitCart];
