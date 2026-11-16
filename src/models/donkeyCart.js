// Donkey cart with sacks and a driver. Donkey at the front (-z).
import * as THREE from 'three';
import { box, wheel, ico, bake } from './kit.js';
import { buildPerson } from './passenger.js';

export function buildDonkeyCart() {
  const g = new THREE.Group();
  const grey = 0x8d8a85;
  // donkey
  box(g, grey, 0.5, 0.6, 1.2, 0, 1.0, -1.9);
  box(g, grey, 0.3, 0.45, 0.55, 0, 1.35, -2.65);
  box(g, 0xd8d2c8, 0.24, 0.2, 0.2, 0, 1.25, -2.95); // muzzle
  for (const x of [-0.12, 0.12]) box(g, grey, 0.08, 0.32, 0.08, x, 1.7, -2.5); // ears
  for (const x of [-0.18, 0.18]) for (const z of [-2.35, -1.45]) box(g, 0x6f6c68, 0.12, 0.72, 0.12, x, 0.36, z);
  box(g, 0x4a4845, 0.06, 0.5, 0.06, 0, 0.95, -1.28); // tail
  // cart
  box(g, 0x8d6e4a, 1.7, 0.14, 2.4, 0, 0.9, 0.5);
  for (const x of [-0.8, 0.8]) {
    box(g, 0x6b4a2b, 0.08, 0.08, 1.8, x * 0.45, 0.9, -1.4); // shafts
    box(g, 0x6b4a2b, 0.06, 0.4, 2.4, x * 1.05, 1.15, 0.5); // side rails
    wheel(g, 0x3a2a1a, 0.55, 0.1, x * 1.18, 0.55, 0.7);
  }
  // load
  box(g, 0xd9c7a0, 1.2, 0.45, 0.8, 0, 1.2, 0.9);
  box(g, 0xcbb58a, 1.0, 0.4, 0.7, 0.1, 1.6, 0.95);
  ico(g, 0xd4b343, 0.55, -0.2, 1.3, 0.1); // hay
  const driver = buildPerson(0x6d4c41);
  driver.rotation.y = Math.PI;
  driver.position.set(0.3, 0.55, -0.45);
  g.add(driver);
  return bake(g);
}
