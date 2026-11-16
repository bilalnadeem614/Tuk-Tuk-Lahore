// Decorated Pakistani truck: truck-art panels (canvas textures), crown over the cab, chains.
import * as THREE from 'three';
import { box, wheel, plane, bake, GLOW } from './kit.js';
import { truckSideTexture, truckBackTexture } from './textures.js';

let mats;
export function buildTruck() {
  mats ??= {
    side: new THREE.MeshLambertMaterial({ map: truckSideTexture() }),
    back: new THREE.MeshLambertMaterial({ map: truckBackTexture() }),
  };
  const g = new THREE.Group();
  box(g, 0x222222, 2.2, 0.3, 7.0, 0, 0.95, 0); // chassis
  box(g, 0xb71c1c, 2.5, 2.4, 4.8, 0, 2.3, 1.0); // cargo box
  plane(g, mats.back, 2.5, 2.4, 0, 2.3, 3.41);
  for (const k of [-1, 1]) {
    plane(g, mats.side, 4.8, 2.4, k * 1.26, 2.3, 1.0).rotation.y = (k * Math.PI) / 2;
    box(g, GLOW.tail, 0.3, 0.2, 0.05, k * 0.95, 0.95, 3.5);
    box(g, 0x1b1b1b, 0.7, 0.6, 0.04, k * 0.8, 0.5, 3.3); // mud flaps
    for (const z of [-2.4, 1.7, 2.6]) wheel(g, 0x151515, 0.5, 0.35, k * 1.0, 0.5, z);
  }
  // cab + the "taj" (crown) that overhangs it
  box(g, 0x1565c0, 2.3, 1.7, 1.7, 0, 1.95, -2.5);
  box(g, 0x1d2731, 2.0, 0.7, 0.05, 0, 2.3, -3.36);
  box(g, 0xfdd835, 2.5, 1.0, 2.0, 0, 3.3, -2.6);
  box(g, 0xe53935, 2.54, 0.2, 2.04, 0, 3.3, -2.6);
  box(g, 0x43a047, 2.2, 0.5, 1.2, 0, 4.0, -2.5);
  // top rail and dangling chains along the tail
  box(g, 0xfdd835, 2.54, 0.14, 4.84, 0, 3.55, 1.0);
  for (let i = 0; i < 9; i++) box(g, i % 2 ? 0xfdd835 : 0xc0c0c0, 0.08, 0.3, 0.04, -1.1 + i * 0.275, 0.95, 3.45);
  return bake(g);
}
