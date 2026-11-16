// Rupee coin. One shared geometry + materials for the whole pool.
import * as THREE from 'three';
import { coinTexture } from './textures.js';

let shared;
export function buildCoin() {
  if (!shared) {
    const face = new THREE.MeshLambertMaterial({ map: coinTexture(), emissive: 0x7a5600 });
    const rim = new THREE.MeshLambertMaterial({ color: 0xe0a800, emissive: 0x7a5600 });
    shared = { geo: new THREE.CylinderGeometry(0.45, 0.45, 0.09, 16).rotateX(Math.PI / 2), mats: [rim, face, face] };
  }
  return new THREE.Mesh(shared.geo, shared.mats);
}
