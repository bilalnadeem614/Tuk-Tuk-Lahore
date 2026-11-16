// Keyboard + touch → abstract actions: left, right, jump, horn, pause, mute, debug, tap, any.

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  KeyH: 'horn', KeyP: 'pause', Escape: 'pause', KeyM: 'mute', Backquote: 'debug',
};
const SWIPE = 28; // px before a drag counts as a swipe

export function initInput(canvas, on) {
  addEventListener('keydown', (e) => {
    on('any');
    const action = KEYS[e.code];
    if (!action || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    // let Space/Enter activate a focused menu button instead of hopping
    if (e.code === 'Space' && document.activeElement?.tagName === 'BUTTON') return;
    e.preventDefault();
    on(action);
  });

  let start = null;
  canvas.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY, t: performance.now(), swiped: false };
  });
  // Fire the swipe as soon as the finger has travelled far enough — no waiting for release.
  canvas.addEventListener('pointermove', (e) => {
    if (!start || start.swiped) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    start.swiped = true;
    if (Math.abs(dx) > Math.abs(dy)) on(dx < 0 ? 'left' : 'right');
    else if (dy < 0) on('jump');
  });
  const end = () => {
    if (start && !start.swiped && performance.now() - start.t < 350) on('tap');
    start = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => (start = null));
  document.addEventListener('pointerdown', () => on('any'), { capture: true });
}
