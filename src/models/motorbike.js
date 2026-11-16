// Red 70cc-style motorbike with rider. Faces -z.
import * as THREE from 'three';
import { box, wheel, bake, GLOW, pick } from './kit.js';
import { buildPerson, SHIRTS } from './passenger.js';

export function buildMotorbike() {
  const g = new THREE.Group();
  wheel(g, 0x151515, 0.32, 0.12, 0, 0.32, -0.75);
  wheel(g, 0x151515, 0.32, 0.12, 0, 0.32, 0.7);
  box(g, 0xc62828, 0.26, 0.3, 0.7, 0, 0.82, -0.25); // tank
  box(g, 0x1b1b1b, 0.28, 0.12, 0.9, 0, 0.85, 0.4); // seat
  box(g, 0x555555, 0.2, 0.3, 0.5, 0, 0.5, 0); // engine
  box(g, 0x999999, 0.08, 0.08, 0.9, 0.2, 0.4, 0.5); // exhaust
  box(g, 0x1b1b1b, 0.7, 0.05, 0.05, 0, 1.1, -0.6); // handlebar
  box(g, GLOW.tail, 0.14, 0.1, 0.05, 0, 0.8, 0.88);
  box(g, 0xfafafa, 0.24, 0.12, 0.03, 0, 0.62, 0.9);
  const rider = buildPerson(pick(SHIRTS));
  rider.rotation.y = Math.PI; // face forward (-z)
  rider.position.set(0, 0.2, 0.25);
  g.add(rider);
  return bake(g);
}
