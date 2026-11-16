// Obstacles + coins: pooled objects, row spawner, AABB collisions.
import { LANES, game } from './state.js';
import { rand, pick } from '../models/kit.js';
import { buildCar, CAR_COLORS } from '../models/car.js';
import { buildTruck } from '../models/truck.js';
import { buildMotorbike } from '../models/motorbike.js';
import { buildDonkeyCart } from '../models/donkeyCart.js';
import { buildCow } from '../models/cow.js';
import { buildPothole } from '../models/pothole.js';
import { buildBarrier } from '../models/barrier.js';
import { buildCoin } from '../models/coin.js';

const SPAWN_Z = -235; // just inside the fog
const DESPAWN_Z = 22;
const FORGIVE = 0.88; // shrink hitboxes a touch so near misses feel fair
const COIN_Y = 0.95;

// hx/hz: collision half-extents. speeds: possible own speeds (0 = parked). low: can be hopped.
const TYPES = {
  car: { build: () => buildCar(pick(CAR_COLORS)), hx: 0.9, hz: 2.0, speeds: [0, 6, 9], weight: 30 },
  bike: { build: buildMotorbike, hx: 0.4, hz: 0.95, speeds: [8, 11], weight: 16 },
  truck: { build: buildTruck, hx: 1.25, hz: 3.5, speeds: [0, 5, 7], weight: 12 },
  cart: { build: buildDonkeyCart, hx: 1.0, hz: 2.7, speeds: [3], weight: 8 },
  cow: { build: buildCow, hx: 1.3, hz: 0.5, speeds: [0], weight: 9 },
  pothole: { build: buildPothole, hx: 0.85, hz: 0.85, speeds: [0], weight: 14, low: true },
  barrier: { build: buildBarrier, hx: 1.3, hz: 0.7, speeds: [0], weight: 8 },
};
const NAMES = Object.keys(TYPES);
const TOTAL_WEIGHT = NAMES.reduce((s, n) => s + TYPES[n].weight, 0);
function randomType() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const n of NAMES) if ((r -= TYPES[n].weight) < 0) return n;
  return 'car';
}

export function createTraffic(scene, { onHit, onCoin }) {
  const pools = Object.fromEntries(NAMES.map((n) => [n, []]));
  const active = [];
  const coinPool = [];
  const coins = [];
  let nextRowAt = 0;

  function spawn(type, lane, z) {
    const def = TYPES[type];
    const o = pools[type].pop() ?? { type, def, obj: scene.add(def.build()).children.at(-1) };
    Object.assign(o, { lane, z, v: pick(def.speeds) });
    o.obj.visible = true;
    o.obj.position.set(LANES[lane], 0, z);
    if (type === 'cow') o.obj.rotation.y = Math.random() < 0.5 ? 0 : Math.PI;
    active.push(o);
    return o;
  }
  function release(list, i, pool) {
    const o = list[i];
    (o.obj ?? o.mesh).visible = false;
    pool.push(o);
    list[i] = list.at(-1); // swap-remove
    list.pop();
  }

  function coin(x, y, z) {
    const c = coinPool.pop() ?? { mesh: scene.add(buildCoin()).children.at(-1) };
    Object.assign(c, { x, y, z, taken: 0 });
    c.mesh.visible = true;
    c.mesh.scale.setScalar(1);
    c.mesh.position.set(x, y, z);
    coins.push(c);
  }

  function spawnRow(z = SPAWN_Z) {
    const moverLanes = active.filter((o) => o.v > 0).map((o) => o.lane);
    const difficulty = Math.min(1, game.time / 120);
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.3 + 0.35 * difficulty ? 2 : 1);
    // Moving traffic drifts relative to parked obstacles and could line up with a later row
    // into an unavoidable wall — so this row plus every moving lane must leave a lane open.
    while (new Set([...lanes, ...moverLanes]).size === 3) lanes.pop();

    const row = lanes.map((lane) => spawn(randomType(), lane, z - rand(0, 5)));
    const open = [0, 1, 2].filter((l) => !lanes.includes(l));
    const pot = row.find((o) => o.def.low);
    if (pot && Math.random() < 0.75) {
      // arc over the pothole: hop to collect
      for (let i = 0; i < 5; i++) coin(LANES[pot.lane], COIN_Y + Math.sin((i / 4) * Math.PI) * 1.0, pot.z + (i - 2) * 2);
    } else if (Math.random() < 0.65) {
      const x = LANES[pick(open)];
      for (let i = 0; i < 6; i++) coin(x, COIN_Y, z + (i - 2.5) * 2.3);
    }
    if (Math.random() < 0.25) {
      // diagonal line in the gap before this row
      const a = LANES[pick([0, 1, 2])];
      const b = LANES[pick([0, 1, 2])];
      for (let i = 0; i < 6; i++) coin(a + ((b - a) * i) / 5, COIN_Y, z + 9 + i * 2.4);
    }
  }

  return {
    obstacles: active,
    get activeCount() {
      return active.length + coins.length;
    },
    /** Return everything to the pools. */
    clear() {
      while (active.length) release(active, 0, pools[active[0].type]);
      while (coins.length) release(coins, 0, coinPool);
    },
    /** Start of a run: empty the road, then pre-fill it. */
    reset() {
      this.clear();
      for (let z = -100; z > SPAWN_Z; z -= 36) spawnRow(z); // pre-fill the road ahead
      nextRowAt = 30;
    },
    update(dt, speed, player) {
      while (game.distance >= nextRowAt) {
        spawnRow();
        nextRowAt += Math.max(26, speed * 1.15) + rand(0, 14);
      }

      const ph = player.half;
      for (let i = active.length - 1; i >= 0; i--) {
        const o = active[i];
        if (o.v > 0) {
          // don't drive through whatever is ahead in this lane — match its speed
          for (const other of active) {
            if (other !== o && other.lane === o.lane && !other.def.low && other.z < o.z && o.z - other.z < o.def.hz + other.def.hz + 2) {
              o.v = Math.min(o.v, other.v);
            }
          }
        }
        o.z += (speed - o.v) * dt;
        o.obj.position.z = o.z;
        if (o.z > DESPAWN_Z) {
          release(active, i, pools[o.type]);
        } else if (
          player.invuln <= 0 &&
          Math.abs(o.z) < (o.def.hz + ph.z) * FORGIVE &&
          Math.abs(LANES[o.lane] - player.x) < (o.def.hx + ph.x) * FORGIVE &&
          !(o.def.low && player.y > 0.25)
        ) {
          onHit(o.type);
        }
      }

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.z += speed * dt;
        c.mesh.position.z = c.z;
        c.mesh.rotation.y += 4 * dt;
        if (c.taken) {
          // quick pop-and-rise before returning to the pool
          c.taken += dt;
          c.mesh.position.y += 9 * dt;
          c.mesh.scale.setScalar(Math.max(0.01, 1 - c.taken * 5));
          if (c.taken > 0.2) release(coins, i, coinPool);
        } else if (c.z > DESPAWN_Z) {
          release(coins, i, coinPool);
        } else if (Math.abs(c.z) < 1.5 && Math.abs(c.x - player.x) < 1.1 && Math.abs(c.y - (player.y + 0.9)) < 1.15) {
          c.taken = 0.001;
          onCoin();
        }
      }
    },
  };
}
