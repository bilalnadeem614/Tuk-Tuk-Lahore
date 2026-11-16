// Pothole: the only obstacle you can hop over.
import * as THREE from 'three';
import { disc, box, bake } from './kit.js';

export function buildPothole() {
  const g = new THREE.Group();
  disc(g, 0x5a554e, 1.15, 0, 0.03, 0); // crumbled edge
  disc(g, 0x24211e, 0.95, 0.05, 0.05, 0);
  disc(g, 0x0f0e0d, 0.6, -0.1, 0.07, 0.1);
  for (const [x, z] of [[0.9, 0.6], [-1.0, -0.3], [0.3, -1.0]]) box(g, 0x6a655d, 0.25, 0.12, 0.2, x, 0.06, z); // rubble
  return bake(g);
}
