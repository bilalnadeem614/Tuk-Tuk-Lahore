// Small hatchback seen mostly from behind. Faces -z.
import * as THREE from 'three';
import { box, wheel, bake, GLOW } from './kit.js';

export const CAR_COLORS = [0xf2f2f2, 0xc0c4c8, 0x23262b, 0xc62828, 0x1e5aa8, 0x6d4c41];

export function buildCar(color) {
  const g = new THREE.Group();
  box(g, color, 1.8, 0.6, 4.0, 0, 0.65, 0);
  box(g, 0x1d2731, 1.6, 0.55, 2.1, 0, 1.2, 0.2); // glass
  box(g, color, 1.64, 0.08, 2.0, 0, 1.5, 0.2);
  box(g, 0x2a2a2a, 1.84, 0.14, 0.12, 0, 0.42, 2.0); // bumper
  box(g, 0xfafafa, 0.5, 0.14, 0.03, 0, 0.62, 2.01);
  for (const x of [-0.65, 0.65]) {
    box(g, GLOW.tail, 0.35, 0.16, 0.05, x, 0.8, 2.0);
    for (const z of [-1.25, 1.3]) wheel(g, 0x151515, 0.33, 0.22, x * 1.35, 0.33, z);
  }
  return bake(g);
}
