// Keyboard input: held directions for movement, and one-press actions.
const Input = (() => {
  const KEY_DIRS = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right'
  };
  const held = []; // directions currently held, in press order
  const actions = {};

  window.addEventListener('keydown', (e) => {
    const dir = KEY_DIRS[e.key];
    if (dir) {
      e.preventDefault();
      if (!e.repeat) {
        if (!held.includes(dir)) held.push(dir);
        if (actions['dir:' + dir]) actions['dir:' + dir]();
      }
      return;
    }
    if (e.repeat) return;
    const action = actions[e.key.toLowerCase()];
    if (action) action();
  });

  window.addEventListener('keyup', (e) => {
    const dir = KEY_DIRS[e.key];
    if (!dir) return;
    const i = held.indexOf(dir);
    if (i >= 0) held.splice(i, 1);
  });

  window.addEventListener('blur', () => { held.length = 0; });

  return {
    // Most recently pressed direction still held, or null.
    currentDir() {
      return held.length ? held[held.length - 1] : null;
    },
    // Register a handler for a one-press key, e.g. on('h', fn). Keys are lowercase.
    on(key, fn) {
      actions[key] = fn;
    }
  };
})();
