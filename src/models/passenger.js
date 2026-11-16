// Simple shalwar-kameez figure, ~1.9 tall, facing +z. Used for passengers, vendors and riders.
import * as THREE from 'three';
import { box, ball } from './kit.js';

export const SHIRTS = [0x2e86c1, 0xc0392b, 0x27ae60, 0x8e44ad, 0xe67e22, 0x16a085, 0xf4f1e8];

/** rightArm=false leaves the right arm off so the caller can attach an animated one. */
export function buildPerson(shirt = 0x2e86c1, rightArm = true) {
  const g = new THREE.Group();
  box(g, 0xf0ede4, 0.18, 0.8, 0.2, -0.12, 0.4, 0); // shalwar legs
  box(g, 0xf0ede4, 0.18, 0.8, 0.2, 0.12, 0.4, 0);
  box(g, shirt, 0.5, 0.8, 0.28, 0, 1.15, 0); // kameez
  box(g, shirt, 0.12, 0.6, 0.14, -0.32, 1.2, 0);
  if (rightArm) box(g, shirt, 0.12, 0.6, 0.14, 0.32, 1.2, 0);
  ball(g, 0xc68642, 0.17, 0, 1.72, 0);
  box(g, 0x1a1a1a, 0.3, 0.1, 0.3, 0, 1.86, 0); // hair
  return g;
}
