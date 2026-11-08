// Persistent player settings: accessibility options and voice speed.
const Settings = (() => {
  const KEY = 'orcquest.settings.v1';
  const defaults = { highContrast: false, voice: false, voiceRate: 1.0 };
  let data = { ...defaults };

  try {
    data = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {
    // Storage blocked or corrupt: fall back to defaults.
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // Storage unavailable: settings still work for this visit.
    }
  }

  return {
    get(name) {
      return data[name];
    },
    set(name, value) {
      data[name] = value;
      persist();
      document.dispatchEvent(new CustomEvent('settingschange'));
    },
    toggle(name) {
      this.set(name, !data[name]);
      return data[name];
    }
  };
})();
