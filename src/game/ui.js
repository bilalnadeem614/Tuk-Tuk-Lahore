// HTML/CSS overlay: HUD, screens, landmark card, speech bubble, toast, debug text.
import { game, save, MAX_LIVES, KMH } from './state.js';
import { SCHEMES } from '../models/rickshaw.js';

export const HORN_NAMES = ['Classic Beep', 'Musical Pom-Pom', 'Squeaky Bulb'];
const SCREENS = ['menu', 'customize', 'howto', 'pause', 'gameover'];
const GAME_OVER_LINES = ['Koi baat nahi — Lahore abhi baqi hai!', 'Chalo, ek aur chakkar ho jaye!', 'Rickshaw thak gaya, ustad nahi!'];
const LIFE_ICON =
  '<svg viewBox="0 0 32 24"><path d="M4 10Q16 1 28 10v2H4z" fill="#f6c519" stroke="#1b1024" stroke-width="1.5"/>' +
  '<rect x="6" y="12" width="20" height="7" rx="2" fill="#1f8a3b" stroke="#1b1024" stroke-width="1.5"/>' +
  '<circle cx="10" cy="20" r="3" fill="#1b1024"/><circle cx="22" cy="20" r="3" fill="#1b1024"/></svg>';

const $ = (id) => document.getElementById(id);
const hex = (n) => '#' + n.toString(16).padStart(6, '0');

/** handlers: play, resume, menu, pause, mute, scheme(i), horn(i), click() */
export function createUI(handlers) {
  const shown = {}; // last value written per element, so the HUD only touches the DOM on change
  const timers = {};
  function text(id, value) {
    if (shown[id] === value) return false;
    shown[id] = value;
    $(id).textContent = value;
    return true;
  }
  /** Show an element via its .on class for `ms`, restarting if already visible. */
  function flashOn(id, ms) {
    clearTimeout(timers[id]);
    $(id).classList.add('on');
    timers[id] = setTimeout(() => $(id).classList.remove('on'), ms);
  }

  // ---- customize lists ----
  function choices(listId, items, current, onPick) {
    const list = $(listId);
    items.forEach((label, i) => {
      const b = document.createElement('button');
      b.className = 'choice' + (i === current ? ' on' : '');
      b.innerHTML = label;
      b.onclick = () => {
        list.querySelectorAll('.choice').forEach((c, k) => c.classList.toggle('on', k === i));
        onPick(i);
      };
      list.append(b);
    });
  }
  choices(
    'scheme-list',
    SCHEMES.map((s) => `<span class="swatch" style="background:linear-gradient(90deg,${hex(s.body)} 50%,${hex(s.canopy)} 50%)"></span>${s.name}`),
    save.scheme,
    handlers.scheme
  );
  choices('horn-list', HORN_NAMES.map((n) => `📯 ${n}`), save.horn, handlers.horn);

  // ---- buttons ----
  let backTo = 'menu';
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    handlers.click?.();
    if (act === 'customize' || act === 'howto') ui.show(act);
    else if (act === 'back') ui.show(backTo);
    else handlers[act]?.();
  });
  for (const [id, act] of [['btn-mute', 'mute'], ['btn-pause', 'pause']]) {
    $(id).addEventListener('click', (e) => {
      e.currentTarget.blur(); // keep Space as "hop", not "press this button again"
      handlers[act]();
    });
  }

  const ui = {
    /** name: one of SCREENS, or null for none (gameplay). */
    show(name) {
      for (const s of SCREENS) $('screen-' + s).classList.toggle('hidden', s !== name);
      $('hud').classList.toggle('hidden', !['pause', 'gameover', null].includes(name));
      if (name === 'menu') {
        text('menu-high', save.high);
        text('menu-landmarks', `${save.discovered.length}/7`);
      }
      if (name) $('screen-' + name).querySelector('.btn')?.focus();
    },

    hud() {
      text('hud-score', game.score);
      text('hud-speed', Math.round(game.speed * KMH));
      if (text('hud-coins', game.coins) && game.coins) {
        const pill = $('hud-coins').parentElement;
        pill.classList.remove('bump');
        void pill.offsetWidth; // restart the CSS animation
        pill.classList.add('bump');
      }
      if (shown.lives !== game.lives) {
        shown.lives = game.lives;
        $('hud-lives').innerHTML = Array.from({ length: MAX_LIVES }, (_, i) => LIFE_ICON.replace('<svg', i < game.lives ? '<svg' : '<svg class="lost"')).join('');
      }
    },

    /** label null → hide the mission tracker. */
    mission(label, left = 0, total = 1) {
      $('hud-mission').classList.toggle('hidden', !label);
      if (!label) return;
      text('hud-mission-text', label);
      const s = Math.max(0, Math.ceil(left));
      if (text('hud-mission-time', `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`)) {
        $('hud-mission').classList.toggle('urgent', s <= 10);
      }
      $('hud-mission-bar').style.transform = `scaleX(${Math.max(0, left / total)})`;
    },

    toast(msg, ms = 2000) {
      $('toast').textContent = msg;
      flashOn('toast', ms);
    },
    /** mood: '' | 'good' | 'bad' */
    speech(msg, mood = '', ms = 3600) {
      $('bubble-text').textContent = msg;
      $('bubble').className = mood;
      flashOn('bubble', ms);
    },
    landmark(def, isNew) {
      $('card-tag').textContent = isNew ? 'NEW DISCOVERY!' : 'LANDMARK';
      $('card-name').textContent = def.name;
      $('card-urdu').textContent = def.urdu;
      $('card-fact').textContent = def.fact;
      flashOn('card', 6000);
    },
    flash() {
      flashOn('flash', 90);
    },
    /** Hide every transient popup (new run / back to menu). */
    clear() {
      for (const id of ['toast', 'bubble', 'card', 'flash']) {
        clearTimeout(timers[id]);
        $(id).classList.remove('on');
      }
      ui.mission(null);
    },

    gameOver(isNewHigh) {
      $('go-line').textContent = GAME_OVER_LINES[(Math.random() * GAME_OVER_LINES.length) | 0];
      $('go-score').textContent = game.score;
      $('go-new').classList.toggle('hidden', !isNewHigh);
      $('go-distance').textContent = `${Math.floor(game.distance)} m`;
      $('go-coins').textContent = game.coins;
      $('go-landmarks').textContent = game.landmarksSeen;
      $('go-fares').textContent = `Rs. ${game.fares}`;
    },
    setMuted(muted) {
      $('btn-mute').textContent = muted ? '🔇' : '🔊';
    },
    debug(msg) {
      $('debug').classList.toggle('hidden', msg == null);
      if (msg != null) $('debug').textContent = msg;
    },
  };
  ui.setMuted(save.muted);
  return ui;
}
