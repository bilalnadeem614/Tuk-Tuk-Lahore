// Road-work barrier: striped boards, cones, warning lamp.
import * as THREE from 'three';
import { box, cone, ball, bake, GLOW } from './kit.js';

export function buildBarrier() {
  const g = new THREE.Group();
  for (const x of [-1.15, 1.15]) {
    box(g, 0x555555, 0.1, 1.3, 0.1, x, 0.65, 0);
    box(g, 0x555555, 0.1, 0.1, 0.9, x, 0.05, 0);
    ball(g, GLOW.lamp, 0.12, x, 1.4, 0);
  }
  for (const y of [0.55, 1.05]) {
    for (let i = 0; i < 8; i++) box(g, i % 2 ? 0xffffff : 0xd32f2f, 0.325, 0.3, 0.08, -1.1375 + i * 0.325, y, 0);
  }
  for (const x of [-0.7, 0.7]) {
    box(g, 0x222222, 0.45, 0.05, 0.45, x, 0.03, 0.8);
    cone(g, 0xff6d00, 0.18, 0.7, x, 0.38, 0.8);
    box(g, 0xffffff, 0.2, 0.1, 0.2, x, 0.4, 0.8);
  }
  box(g, 0x8d6e4a, 0.9, 0.35, 0.6, 0, 0.18, -0.9); // pile of dug-up earth
  return bake(g);
}
