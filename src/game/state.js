// Game state machine, per-run stats, tuning constants and the localStorage save.

export const LANES = [-3.2, 0, 3.2];
export const SPEED_MIN = 18;
export const SPEED_MAX = 46;
export const SPEED_RAMP = 0.22; // units/s gained per second of play
export const MAX_LIVES = 3;
export const KMH = 2; // display only: world units/s → "km/h"

const TRANSITIONS = {
  menu: ['playing'],
  playing: ['paused', 'gameover'],
  paused: ['playing', 'menu'],
  gameover: ['playing', 'menu'],
};

export const game = {
  state: 'menu',
  time: 0, // seconds of play this run
  distance: 0,
  speed: SPEED_MIN,
  coins: 0,
  fares: 0, // mission earnings
  bonus: 0, // explorer bonuses
  lives: MAX_LIVES,
  landmarksSeen: 0,
  get score() {
    return Math.floor(this.distance) + this.coins * 10 + this.fares + this.bonus;
  },
};

export function resetRun() {
  Object.assign(game, { time: 0, distance: 0, speed: SPEED_MIN, coins: 0, fares: 0, bonus: 0, lives: MAX_LIVES, landmarksSeen: 0 });
}

const listeners = [];
export const onState = (fn) => listeners.push(fn);
/** Returns false (and does nothing) for transitions that make no sense, e.g. pausing the menu. */
export function setState(next) {
  const prev = game.state;
  if (!TRANSITIONS[prev].includes(next)) return false;
  game.state = next;
  listeners.forEach((fn) => fn(next, prev));
  return true;
}

// ---- persistence ----
const KEY = 'lahore-rickshaw-run';
const defaults = { high: 0, discovered: [], scheme: 0, horn: 0, muted: false };
function load() {
  try {
    const s = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    if (!Array.isArray(s.discovered)) s.discovered = [];
    s.high = Number(s.high) || 0;
    return s;
  } catch {
    return { ...defaults, discovered: [] }; // private mode / corrupt data: play without saving
  }
}
export const save = load();
export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable — ignore */
  }
}
