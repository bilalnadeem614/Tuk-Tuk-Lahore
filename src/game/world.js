// Endless road: a ring of recycled chunks, each dressed with two building strips borrowed
// from a pool. Also owns the sky: time-of-day colours, fog, sun/moon, stars.
import * as THREE from 'three';
import { buildStrip, STRIP_LENGTH } from '../models/buildings.js';
import { roadTexture, ROAD_WIDTH } from '../models/textures.js';
import { setNight } from '../models/kit.js';

const CHUNKS = 8;
const L = STRIP_LENGTH;
const STRIPS = 24; // 16 in use at any time; the spare 8 give variety on recycle
export const FRONT_X = 8.4; // distance from road centre to shop fronts
const DAY_SECONDS = 150;

// [phase, sky/fog, sun colour, sun intensity, ambient intensity, night factor]
const SKY = [
  [0.0, 0x9fd3ee, 0xfff4dd, 1.7, 1.25, 0],
  [0.36, 0x9fd3ee, 0xfff4dd, 1.7, 1.25, 0],
  [0.5, 0xf5a65b, 0xff9248, 1.3, 1.0, 0.3],
  [0.6, 0x141b3d, 0x8792ff, 0.45, 0.75, 1],
  [0.86, 0x141b3d, 0x8792ff, 0.45, 0.75, 1],
  [0.95, 0xf2b077, 0xffb070, 1.1, 0.95, 0.3],
  [1.0, 0x9fd3ee, 0xfff4dd, 1.7, 1.25, 0],
].map(([p, sky, sun, si, ai, n]) => ({ p, sky: new THREE.Color(sky), sun: new THREE.Color(sun), si, ai, n }));

export function createWorld(scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-30, 60, 25);
  scene.add(hemi, sun);
  scene.background = new THREE.Color();
  scene.fog = new THREE.Fog(0, 70, 240);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 520).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xa89878 }));
  ground.position.set(0, -0.05, -180);
  scene.add(ground);

  // sun, moon, stars — drawn unfogged, far behind everything
  const orb = (r, color) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), new THREE.MeshBasicMaterial({ color, fog: false }));
    scene.add(m);
    return m;
  };
  const sunOrb = orb(11, 0xfff3c4);
  const moonOrb = orb(7, 0xe8ecff);
  const starPos = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.random() * 1.2 + 0.08;
    starPos.set([Math.cos(a) * Math.cos(e) * 480, Math.sin(e) * 480, -Math.abs(Math.sin(a) * Math.cos(e)) * 480], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);

  // ---- strips pool + chunks ----
  const free = [];
  for (let i = 0; i < STRIPS; i++) free.push(buildStrip());

  /** side: 0 = left, 1 = right. Passing null just returns the current strip to the pool. */
  function setSide(chunk, side, strip) {
    const old = chunk.sides[side];
    if (old) {
      chunk.group.remove(old);
      free.push(old);
    }
    chunk.sides[side] = strip;
    if (strip) {
      strip.position.x = side ? FRONT_X : -FRONT_X;
      strip.rotation.y = side ? Math.PI : 0;
      chunk.group.add(strip);
    }
  }
  const takeStrip = () => free.splice((Math.random() * free.length) | 0, 1)[0];
  function dress(chunk) {
    setSide(chunk, 0, null);
    setSide(chunk, 1, null);
    setSide(chunk, 0, takeStrip());
    setSide(chunk, 1, takeStrip());
  }

  const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, L).rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTexture() });
  const chunks = [];
  for (let i = 0; i < CHUNKS; i++) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(roadGeo, roadMat));
    group.position.z = L / 2 - i * L;
    const chunk = { group, sides: [null, null] };
    dress(chunk);
    scene.add(group);
    chunks.push(chunk);
  }

  // ---- time of day ----
  let phase = 0.2;
  const sky = new THREE.Color();
  const WHITE = new THREE.Color(0xffffff);
  /** Arc for a sky body that is highest at phase `peak` and on the horizon `quarter` either side. */
  function arc(obj, peak, quarter) {
    let d = phase - peak;
    d -= Math.round(d); // wrap to [-0.5, 0.5]
    const a = (d / quarter) * (Math.PI / 2);
    obj.position.set(Math.sin(a) * 170, Math.cos(a) * 120, -420);
  }
  function applySky() {
    let i = 0;
    while (SKY[i + 1].p <= phase) i++;
    const a = SKY[i];
    const b = SKY[i + 1];
    const f = (phase - a.p) / (b.p - a.p);
    const mix = (x, y) => x + (y - x) * f;
    sky.copy(a.sky).lerp(b.sky, f);
    scene.background.copy(sky);
    scene.fog.color.copy(sky);
    sun.color.copy(a.sun).lerp(b.sun, f);
    sun.intensity = mix(a.si, b.si);
    hemi.intensity = mix(a.ai, b.ai);
    hemi.color.copy(sky).lerp(WHITE, 0.6);
    world.night = mix(a.n, b.n);
    setNight(world.night);
    sunOrb.material.color.copy(sun.color).lerp(WHITE, 0.4);
    stars.material.opacity = world.night;
    arc(sunOrb, 0.18, 0.35);
    arc(moonOrb, 0.73, 0.17);
  }

  const world = {
    chunks,
    night: 0,
    /** Called with a chunk right after it has been moved to the far end and re-dressed. */
    onRecycle: null,
    /** Remove the buildings on one side of a chunk (to make room for a landmark). */
    clearSide: (chunk, side) => setSide(chunk, side, null),
    update(dt, speed) {
      for (const c of chunks) c.group.position.z += speed * dt;
      for (const c of chunks) {
        if (c.group.position.z > L * 1.5) {
          c.group.position.z -= CHUNKS * L;
          dress(c);
          world.onRecycle?.(c);
        }
      }
      phase = (phase + dt / DAY_SECONDS) % 1;
      applySky();
    },
  };
  applySky();
  return world;
}
