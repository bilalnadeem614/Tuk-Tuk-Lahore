// A cow standing sideways across the lane, entirely unbothered.
import * as THREE from 'three';
import { box, ball, cone, bake, pick } from './kit.js';

export function buildCow() {
  const g = new THREE.Group();
  const [coat, patch] = pick([[0xf3efe6, 0x4e342e], [0x8d5a3b, 0xf3efe6], [0xe8e2d6, 0x2b2b2b]]);
  box(g, coat, 2.0, 0.9, 0.8, 0, 1.15, 0);
  ball(g, coat, 0.3, 0.6, 1.65, 0); // zebu hump
  box(g, coat, 0.5, 0.5, 0.5, 1.2, 1.4, 0); // head
  box(g, 0xe0a8a0, 0.2, 0.25, 0.4, 1.5, 1.28, 0); // muzzle
  for (const z of [-0.2, 0.2]) {
    cone(g, 0xd8d0c0, 0.06, 0.3, 1.15, 1.8, z); // horns
    box(g, patch, 0.5, 0.4, 0.03, -0.3, 1.25, z * 2.03); // patches
    for (const x of [-0.75, 0.75]) box(g, coat, 0.18, 0.75, 0.18, x, 0.375, z * 1.3);
  }
  box(g, patch, 0.06, 0.7, 0.06, -1.02, 1.1, 0); // tail
  box(g, 0xe9b8b0, 0.35, 0.18, 0.3, -0.45, 0.65, 0); // udder
  return bake(g);
}
