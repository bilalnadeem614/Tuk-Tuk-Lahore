// The rickshaw: lane switching (smoothed), hop, tilt, engine jitter, hit blink.
import * as THREE from 'three';
import { GEO, disposeModel } from '../models/kit.js';
import { buildRickshaw, SCHEMES } from '../models/rickshaw.js';
import { shadowTexture, beamTexture } from '../models/textures.js';
import { LANES, SPEED_MAX } from './state.js';

const JUMP = 7.6; // apex ≈ 1.3 units, ≈ 0.7 s in the air
const GRAVITY = 22;

export function createPlayer(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // Ground decals: blob shadow (instead of shadow maps) and a night-time headlight pool.
  const decal = (map, extra) => {
    const m = new THREE.Mesh(GEO.plane, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, ...extra }));
    m.rotation.x = -Math.PI / 2;
    scene.add(m);
    return m;
  };
  const shadow = decal(shadowTexture());
  shadow.position.y = 0.04;
  const beam = decal(beamTexture(), { blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  beam.scale.set(8, 20, 1);
  beam.position.set(0, 0.05, -10);

  let model = null;
  let riding = false;
  let t = 0;

  const p = {
    group,
    lane: 1,
    x: 0,
    y: 0,
    vy: 0,
    jumps: 0, // jumps used since last landing (max 2 = double jump)
    invuln: 0,
    half: { x: 0.7, y: 0.95, z: 1.35 }, // collision half-extents

    setScheme(i) {
      if (model) {
        group.remove(model);
        disposeModel(model);
      }
      model = buildRickshaw(SCHEMES[i] ?? SCHEMES[0]);
      model.userData.passenger.visible = riding;
      group.add(model);
    },
    setPassenger(on) {
      riding = on;
      model.userData.passenger.visible = on;
    },
    reset() {
      Object.assign(p, { lane: 1, x: 0, y: 0, vy: 0, jumps: 0, invuln: 0 });
      p.setPassenger(false);
    },
    /** Stop blinking (called when updates stop, e.g. game over). */
    settle() {
      p.invuln = 0;
      model.visible = true;
    },
    move(dir) {
      const next = Math.min(2, Math.max(0, p.lane + dir));
      const moved = next !== p.lane;
      p.lane = next;
      return moved;
    },
    jump() {
      if (p.jumps >= 2) return false;
      p.jumps++;
      p.vy = JUMP;
      return true;
    },
    update(dt, speed, night) {
      t += dt;
      const dx = LANES[p.lane] - p.x;
      p.x += dx * (1 - Math.exp(-13 * dt));
      if (p.y > 0 || p.vy > 0) {
        p.vy -= GRAVITY * dt;
        p.y += p.vy * dt;
        if (p.y <= 0) p.y = p.vy = p.jumps = 0;
      }
      const k = 0.5 + speed / SPEED_MAX;
      group.position.set(p.x, p.y + Math.abs(Math.sin(t * 38)) * 0.014 * k, 0);
      group.rotation.set(Math.sin(t * 23) * 0.006 * k + p.vy * 0.012, -dx * 0.09, -dx * 0.07);
      for (const w of model.userData.wheels) w.rotation.x -= (speed * dt) / 0.31;

      p.invuln = Math.max(0, p.invuln - dt);
      model.visible = p.invuln <= 0 || Math.floor(t * 14) % 2 === 0;

      const s = 1 - Math.min(p.y, 2) * 0.25;
      shadow.scale.set(2.6 * s, 3.9 * s, 1);
      shadow.position.x = beam.position.x = p.x;
      beam.material.opacity = night * 0.6;
    },
  };
  return p;
}
