// All sound is synthesised with the Web Audio API: engine putt-putt, horns, SFX, and a
// tabla + melody loop. Nothing plays until unlock() is called from a user gesture.
import { game, save } from './state.js';

let ctx = null;
let master, music, engine, noiseBuf;

/** One enveloped oscillator note. Nodes are released by the browser once stopped. */
function tone(freq, t, dur, type = 'sine', vol = 0.2, glideTo = 0, out = master) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.03);
}
/** Filtered noise burst (crash, tabla slap, coin tick). */
function noise(t, dur, vol, cutoff, cutoffTo = 0, out = master) {
  const src = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuf;
  lp.frequency.setValueAtTime(cutoff, t);
  if (cutoffTo) lp.frequency.exponentialRampToValueAtTime(cutoffTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(lp).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.03);
}
/** Play a run of notes: [freq, duration] pairs back to back. */
function tune(notes, type, vol, start = ctx.currentTime) {
  let t = start;
  for (const [f, d] of notes) {
    if (f) tone(f, t, d * 1.1, type, vol);
    t += d;
  }
}

// ---- engine: sawtooth chopped by a square LFO = two-stroke "putt-putt" ----
function startEngine() {
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const chop = ctx.createGain();
  const depth = ctx.createGain();
  const vol = ctx.createGain();
  osc.type = 'sawtooth';
  lfo.type = 'square';
  lp.frequency.value = 340;
  chop.gain.value = 0.5;
  depth.gain.value = 0.5;
  vol.gain.value = 0;
  lfo.connect(depth).connect(chop.gain);
  osc.connect(lp).connect(chop).connect(vol).connect(master);
  osc.start();
  lfo.start();
  engine = { osc, lfo, vol, k: -1, on: false };
}

// ---- music: keherwa-style tabla pattern + pentatonic melody, lookahead-scheduled ----
const STEP = 0.3; // seconds per eighth note
const BOLS = ['dha', 'ge', 'na', 'ti', 'na', 'ka', 'dhin', 'na'];
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C major pentatonic
const _ = -1;
const PHRASES = [
  [4, _, 5, 4, 3, _, 2, _, 3, 4, 5, _, 4, _, 3, _],
  [5, _, 6, 5, 4, _, 5, _, 6, 7, 6, 5, 4, _, _, _],
  [2, 3, 4, _, 3, 2, 1, _, 0, _, 1, 2, 3, _, 2, _],
  [3, _, 2, 1, 0, _, _, _, 2, 3, 4, 3, 2, 1, 0, _],
];
const SONG = [0, 1, 0, 3, 2, 1, 2, 3];
let step = 0;
let nextStepAt = 0;
function playStep(i, t) {
  const bol = BOLS[i % 8];
  if (bol === 'dha' || bol === 'dhin' || bol === 'ge') tone(bol === 'ge' ? 95 : 88, t, 0.28, 'sine', 0.4, bol === 'ge' ? 135 : 60, music); // bayan (bass)
  if (bol === 'dha' || bol === 'dhin' || bol === 'na') {
    tone(372, t, bol === 'dhin' ? 0.3 : 0.13, 'sine', 0.17, 0, music); // dayan (treble)
    tone(744, t, 0.05, 'triangle', 0.05, 0, music);
  }
  if (bol === 'ti') tone(520, t, 0.06, 'triangle', 0.12, 0, music);
  if (bol === 'ka') noise(t, 0.05, 0.14, 1800, 0, music);

  const note = PHRASES[SONG[Math.floor(i / 16) % SONG.length]][i % 16];
  if (note >= 0) tone(SCALE[note], t, 0.34, 'triangle', 0.1, 0, music);
  if (i % 16 === 0) {
    tone(130.81, t, STEP * 16, 'sine', 0.035, 0, music); // drone: Sa + Pa
    tone(196.0, t, STEP * 16, 'sine', 0.025, 0, music);
  }
}
function scheduleMusic() {
  if (!ctx || ctx.state !== 'running') return;
  if (nextStepAt < ctx.currentTime) nextStepAt = ctx.currentTime + 0.05;
  while (nextStepAt < ctx.currentTime + 0.35) {
    playStep(step++, nextStepAt);
    nextStepAt += STEP;
  }
}

let lastCoinAt = 0;
let coinCombo = 0;
const ready = () => ctx && ctx.state === 'running';

export const audio = {
  get running() {
    return !!ready();
  },
  /** Create the AudioContext. Must be called from a user gesture; safe to call repeatedly. */
  unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = save.muted ? 0 : 0.8;
      master.connect(ctx.destination);
      music = ctx.createGain();
      music.gain.value = 0.55;
      music.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      startEngine();
      setInterval(scheduleMusic, 100);
    }
    audio.sync();
  },
  /** Run the audio clock only while the game is visible and not paused. */
  sync() {
    if (!ctx) return;
    const wanted = !document.hidden && game.state !== 'paused';
    if (wanted && ctx.state === 'suspended') ctx.resume();
    if (!wanted && ctx.state === 'running') ctx.suspend();
  },
  setMuted(muted) {
    if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.03);
  },
  /** k: 0..1 speed fraction. */
  setEngine(k, on) {
    if (!ready() || (on === engine.on && Math.abs(k - engine.k) < 0.01)) return;
    engine.on = on;
    engine.k = k;
    const t = ctx.currentTime;
    engine.vol.gain.setTargetAtTime(on ? 0.1 : 0, t, 0.1);
    engine.osc.frequency.setTargetAtTime(48 + k * 46, t, 0.1);
    engine.lfo.frequency.setTargetAtTime(9 + k * 17, t, 0.1);
  },
  horn(variant) {
    if (!ready()) return;
    const t = ctx.currentTime;
    if (variant === 1) {
      // musical truck horn
      tune([[659, 0.11], [523, 0.11], [659, 0.11], [523, 0.11], [784, 0.22]], 'sawtooth', 0.13);
    } else if (variant === 2) {
      // squeaky rubber-bulb horn: "pee-poo"
      tone(640, t, 0.16, 'sine', 0.3, 940);
      tone(900, t + 0.17, 0.22, 'sine', 0.3, 520);
    } else {
      tone(415, t, 0.32, 'square', 0.12);
      tone(523, t, 0.32, 'square', 0.12);
    }
  },
  coin() {
    if (!ready()) return;
    const t = ctx.currentTime;
    coinCombo = t - lastCoinAt < 0.5 ? Math.min(coinCombo + 1, 9) : 0; // streaks climb in pitch
    lastCoinAt = t;
    const f = 1319 * 2 ** (coinCombo / 12);
    noise(t, 0.03, 0.05, 6000);
    tone(f, t, 0.07, 'square', 0.05);
    tone(f * 1.5, t + 0.06, 0.22, 'triangle', 0.09);
  },
  crash() {
    if (!ready()) return;
    const t = ctx.currentTime;
    noise(t, 0.5, 0.5, 2600, 150);
    tone(140, t, 0.4, 'sine', 0.5, 40);
    tone(310, t, 0.12, 'square', 0.1, 180);
  },
  jump: () => ready() && tone(280, ctx.currentTime, 0.16, 'sine', 0.08, 620),
  click: () => ready() && tone(700, ctx.currentTime, 0.05, 'triangle', 0.1),
  pickup: () => ready() && tune([[784, 0.1], [1047, 0.2]], 'triangle', 0.16),
  success: () => ready() && tune([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [1319, 0.3]], 'triangle', 0.18),
  fail: () => ready() && tune([[440, 0.16], [392, 0.16], [330, 0.16], [262, 0.4]], 'sawtooth', 0.09),
  landmark: () => ready() && tune([[659, 0.09], [784, 0.09], [988, 0.09], [1319, 0.35]], 'sine', 0.16),
};
