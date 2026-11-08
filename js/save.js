// Saving and loading. Three slots, kept in the browser's localStorage. Storage can be blocked
// (private windows, disabled site data), so every access is wrapped and fails quietly.
const Save = (() => {
  const SLOT_COUNT = 3;
  const VERSION = 1;
  // main.js fills these in: capture() describes the game, apply(data) restores it, newGame() starts one.
  const hooks = { capture: null, apply: null, newGame: null };

  const keyFor = n => `orcquest.save.v${VERSION}.slot${n}`;

  // The saved data for a slot, or null if the slot is empty or unreadable.
  function read(n) {
    try {
      const raw = localStorage.getItem(keyFor(n));
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && data.v === VERSION && data.state ? data : null;
    } catch (err) {
      return null;
    }
  }

  function write(n, data) {
    try {
      localStorage.setItem(keyFor(n), JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  // Short label for the slot list, such as "Slot 1: Mistvale, Kael Lv 2, 35g".
  function label(n) {
    const data = read(n);
    return data ? `Slot ${n}: ${data.summary}` : `Slot ${n}: empty`;
  }

  function save(n) {
    if (!hooks.capture) return false;
    return write(n, { v: VERSION, savedAt: new Date().toISOString(), ...hooks.capture() });
  }

  function load(n) {
    const data = read(n);
    if (!data || !hooks.apply) return false;
    try {
      hooks.apply(data);
      return true;
    } catch (err) {
      console.error('Could not load save:', err);
      return false;
    }
  }

  function anySaved() {
    for (let n = 1; n <= SLOT_COUNT; n++) {
      if (read(n)) return true;
    }
    return false;
  }

  return { SLOT_COUNT, hooks, read, label, save, load, anySaved };
})();
