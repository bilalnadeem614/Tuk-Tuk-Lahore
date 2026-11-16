// Shared building blocks for every procedural model: unit geometries (scaled per mesh),
// cached materials, and bake() which collapses a model into as few draw calls as possible.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  taper: new THREE.CylinderGeometry(0.28, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  ball: new THREE.SphereGeometry(0.5, 10, 7),
  dome: new THREE.SphereGeometry(0.5, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  plane: new THREE.PlaneGeometry(1, 1),
  disc: new THREE.CircleGeometry(0.5, 14),
  wheel: new THREE.CylinderGeometry(0.5, 0.5, 1, 12).rotateZ(Math.PI / 2), // axle along x
};
const SHARED = new Set(Object.values(GEO));

// Flat-colour materials. Meshes using these get merged into one vertex-coloured mesh by bake().
const plainCache = new Map();
export function plain(color) {
  let m = plainCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    m.userData.plain = true;
    plainCache.set(color, m);
  }
  return m;
}
export const VERTEX = new THREE.MeshLambertMaterial({ vertexColors: true });

// Materials whose emissive strength follows the time of day: [material, base, gain].
const nightMats = [];
export function nightMaterial(params, base, gain) {
  const m = new THREE.MeshLambertMaterial({ ...params, emissiveIntensity: base });
  nightMats.push([m, base, gain]);
  return m;
}
export const GLOW = {
  window: nightMaterial({ color: 0x34424f, emissive: 0xffc56b }, 0, 0.95),
  lamp: nightMaterial({ color: 0xf5f0d8, emissive: 0xffe9a8 }, 0, 1),
  tail: nightMaterial({ color: 0x9a1414, emissive: 0xff2a1a }, 0.15, 0.9),
  head: nightMaterial({ color: 0xfff6c8, emissive: 0xfff0b0 }, 0.25, 0.9),
};
/** n: 0 = day, 1 = night */
export function setNight(n) {
  for (const [m, base, gain] of nightMats) m.emissiveIntensity = base + gain * n;
}

function add(parent, geo, mat, sx, sy, sz, x, y, z) {
  const m = new THREE.Mesh(geo, typeof mat === 'number' ? plain(mat) : mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
// mat may be a hex colour number (→ plain material) or a material.
export const box = (p, mat, w, h, d, x, y, z) => add(p, GEO.box, mat, w, h, d, x, y, z);
export const cyl = (p, mat, r, h, x, y, z) => add(p, GEO.cyl, mat, r * 2, h, r * 2, x, y, z);
export const taper = (p, mat, r, h, x, y, z) => add(p, GEO.taper, mat, r * 2, h, r * 2, x, y, z);
export const cone = (p, mat, r, h, x, y, z) => add(p, GEO.cone, mat, r * 2, h, r * 2, x, y, z);
export const ball = (p, mat, r, x, y, z) => add(p, GEO.ball, mat, r * 2, r * 2, r * 2, x, y, z);
export const ico = (p, mat, r, x, y, z) => add(p, GEO.ico, mat, r * 2, r * 2, r * 2, x, y, z);
/** Half-sphere of radius r and height h, flat side at y. */
export const dome = (p, mat, r, h, x, y, z) => add(p, GEO.dome, mat, r * 2, h * 2, r * 2, x, y, z);
/** Wheel of radius r and width w, axle along x. */
export const wheel = (p, mat, r, w, x, y, z) => add(p, GEO.wheel, mat, w, r * 2, r * 2, x, y, z);
/** Flat disc lying on the ground. */
export function disc(p, mat, r, x, y, z) {
  const m = add(p, GEO.disc, mat, r * 2, r * 2, 1, x, y, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}
/** Upright plane facing +z. */
export const plane = (p, mat, w, h, x, y, z) => add(p, GEO.plane, mat, w, h, 1, x, y, z);

/**
 * Sagging wire from a to b made of thin box segments. Returns the points along it.
 * `parent` must sit at the origin with no rotation (lookAt works in world space).
 */
export function wire(parent, mat, a, b, sag = 0.5, segs = 4, thick = 0.035) {
  const pts = [a.clone()];
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const p = a.clone().lerp(b, t);
    p.y -= sag * 4 * t * (1 - t);
    const prev = pts[i - 1];
    const m = box(parent, mat, thick, thick, prev.distanceTo(p), (prev.x + p.x) / 2, (prev.y + p.y) / 2, (prev.z + p.z) / 2);
    m.lookAt(p);
    pts.push(p);
  }
  return pts;
}

const _m = new THREE.Matrix4();
/**
 * Merge every mesh under `group` into a new Group: all plain-colour meshes become ONE
 * vertex-coloured mesh; other materials (textures, emissive) get one mesh each.
 * Call before positioning `group` — the result is expressed in group-local space.
 */
export function bake(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const plainGeos = [];
  const byMat = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(_m.multiplyMatrices(inv, o.matrixWorld));
    if (o.material.userData.plain) {
      const c = o.material.color;
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.deleteAttribute('uv');
      plainGeos.push(g);
    } else {
      if (!byMat.has(o.material)) byMat.set(o.material, []);
      byMat.get(o.material).push(g);
    }
  });
  const out = new THREE.Group();
  const emit = (geos, mat) => {
    out.add(new THREE.Mesh(mergeGeometries(geos), mat));
    geos.forEach((g) => g.dispose());
  };
  if (plainGeos.length) emit(plainGeos, VERTEX);
  for (const [mat, geos] of byMat) emit(geos, mat);
  return out;
}

/** Dispose geometries owned by a model (never the shared unit geometries). */
export function disposeModel(obj) {
  obj.traverse((o) => {
    if (o.isMesh && !SHARED.has(o.geometry)) o.geometry.dispose();
  });
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
