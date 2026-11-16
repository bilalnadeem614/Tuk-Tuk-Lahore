// Bootstrap, game loop, camera, and the glue between systems.
import * as THREE from 'three';
import { game, save, persist, setState, onState, resetRun, SPEED_MIN, SPEED_MAX, SPEED_RAMP } from './game/state.js';
import { createWorld } from './game/world.js';
import { createPlayer } from './game/player.js';
import { createTraffic } from './game/traffic.js';
import { createLandmarks } from './game/landmarks.js';
import { createMissions } from './game/missions.js';
import { audio } from './game/audio.js';
import { createUI } from './game/ui.js';
import { initInput } from './game/input.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 700);

const world = createWorld(scene);
const player = createPlayer(scene);
player.setScheme(save.scheme);

const ui = createUI({
  play: startRun,
  resume: () => setState('playing'),
  menu: () => setState('menu'),
  pause: togglePause,
  mute: toggleMute,
  scheme(i) {
    save.scheme = i;
    persist();
    player.setScheme(i);
  },
  horn(i) {
    save.horn = i;
    persist();
    audio.horn(i); // preview
  },
  click: () => audio.click(),
});

const traffic = createTraffic(scene, {
  onCoin() {
    game.coins++;
    audio.coin();
  },
  onHit() {
    game.lives--;
    game.speed *= 0.4;
    player.invuln = 1.6;
    shake = 0.6;
    ui.flash();
    audio.crash();
    missions.onHit();
    if (game.lives <= 0) setState('gameover');
  },
});

const landmarks = createLandmarks(world, save.discovered, (def) => {
  const isNew = !save.discovered.includes(def.id);
  if (isNew) {
    save.discovered.push(def.id);
    persist();
  }
  game.bonus += 500;
  game.landmarksSeen++;
  ui.landmark(def, isNew);
  audio.landmark();
  missions.onLandmark(def);
});
const missions = createMissions(scene, player, landmarks, ui, audio);

// ---- state transitions ----
function startRun() {
  if (game.state !== 'menu' && game.state !== 'gameover') return;
  resetRun();
  player.reset();
  traffic.reset();
  landmarks.reset();
  ui.clear();
  missions.reset();
  setState('playing');
}
function togglePause() {
  if (game.state === 'playing') setState('paused');
  else if (game.state === 'paused') setState('playing');
}
function toggleMute() {
  save.muted = !save.muted;
  persist();
  ui.setMuted(save.muted);
  audio.setMuted(save.muted);
}
onState((state) => {
  frameMenu();
  audio.sync(); // suspend the audio clock while paused
  if (state !== 'playing') audio.setEngine(0, false);
  if (state === 'playing') ui.show(null);
  if (state === 'paused') ui.show('pause');
  if (state === 'menu') {
    player.reset();
    traffic.clear();
    landmarks.reset();
    ui.clear();
    missions.reset();
    ui.show('menu');
  }
  if (state === 'gameover') {
    player.settle();
    const isNewHigh = game.score > save.high;
    if (isNewHigh) save.high = game.score;
    persist();
    ui.mission(null);
    ui.gameOver(isNewHigh);
    audio.fail();
    ui.show('gameover');
  }
});
// Tab switched away mid-run → pause, so nothing happens while the player can't see.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') setState('paused');
  audio.sync();
});

// ---- input ----
let debugOn = false;
initInput(canvas, (action) => {
  if (action === 'any') return audio.unlock(); // browsers only allow audio after a gesture
  if (action === 'mute') return toggleMute();
  if (action === 'pause') return togglePause();
  if (action === 'debug') {
    debugOn = !debugOn;
    if (!debugOn) ui.debug(null);
    return;
  }
  if (game.state !== 'playing') return;
  if (action === 'left') player.move(-1);
  else if (action === 'right') player.move(1);
  else if (action === 'jump') player.jump() && audio.jump();
  else if (action === 'horn' || action === 'tap') audio.horn(save.horn);
});

// ---- camera ----
let shake = 0;
const camPos = new THREE.Vector3(0, 4.4, 8.8);
const camGoal = new THREE.Vector3();
const look = new THREE.Vector3(0, 1.4, -10);
const lookGoal = new THREE.Vector3();
function updateCamera(dt, now) {
  const portrait = camera.aspect < 1; // narrow screens: pull back so all 3 lanes stay in view
  let fov = portrait ? 80 : 62;
  if (game.state === 'menu') {
    // slow orbit to show off the rickshaw
    const a = now * 0.00025 + 2.5;
    const r = portrait ? 10 : 7;
    camGoal.set(Math.sin(a) * r, 2.8, Math.cos(a) * r);
    lookGoal.set(0, 1.1, 0);
    fov -= 12;
  } else {
    camGoal.set(player.x * 0.65, portrait ? 6.5 : 4.4, portrait ? 13 : 8.8);
    lookGoal.set(player.x * 0.85, 1.4, -10);
    fov += (14 * (game.speed - SPEED_MIN)) / (SPEED_MAX - SPEED_MIN);
  }
  camPos.lerp(camGoal, 1 - Math.exp(-5 * dt));
  look.lerp(lookGoal, 1 - Math.exp(-7 * dt));
  shake = Math.max(0, shake - dt * 1.6);
  camera.position.copy(camPos);
  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;
  }
  camera.lookAt(look);
  camera.fov += (fov - camera.fov) * (1 - Math.exp(-3 * dt));
  camera.updateProjectionMatrix();
}

/** Shift the menu view so the orbiting rickshaw isn't hidden behind the panel. */
function frameMenu() {
  const [w, h] = [innerWidth, innerHeight];
  if (game.state !== 'menu') camera.clearViewOffset();
  else if (camera.aspect > 1.3) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
  else camera.setViewOffset(w, h, 0, h * 0.24, w, h);
  camera.updateProjectionMatrix();
}
function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  frameMenu();
}
addEventListener('resize', resize);
resize();

// ---- loop ----
function updatePlaying(dt) {
  game.time += dt;
  // Speed creeps up with play time; after a crash it climbs back at 4 u/s².
  game.speed = Math.min(SPEED_MIN + game.time * SPEED_RAMP, SPEED_MAX, game.speed + 4 * dt);
  game.distance += game.speed * dt;
  world.update(dt, game.speed);
  player.update(dt, game.speed, world.night);
  traffic.update(dt, game.speed, player);
  if (game.state !== 'playing') return; // that hit was the last life
  landmarks.update();
  missions.update(dt, game.speed);
  audio.setEngine((game.speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN), true);
  ui.hud();
}

let last = performance.now();
let fps = 60;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); // clamp: no physics explosions after a stall
  last = now;
  if (game.state === 'playing') {
    updatePlaying(dt);
  } else if (game.state === 'menu') {
    world.update(dt, 10); // attract mode
    player.update(dt, 10, world.night);
  }
  if (game.state !== 'paused') updateCamera(dt, now);
  renderer.render(scene, camera);

  if (debugOn && dt > 0) {
    fps += (1 / dt - fps) * 0.05;
    const { render, memory } = renderer.info;
    ui.debug(
      `FPS ${fps.toFixed(0)}\ndraw calls ${render.calls}\ntriangles ${render.triangles}\n` +
        `active objects ${traffic.activeCount} (traffic + coins)\ngeometries ${memory.geometries}  textures ${memory.textures}`
    );
  }
}
ui.show('menu');
requestAnimationFrame(frame);

// Dev-only handle for poking at the game from the console.
if (import.meta.env.DEV) window.__lrr = { game, player, world, traffic, landmarks, missions, audio, ui, startRun, setState };
