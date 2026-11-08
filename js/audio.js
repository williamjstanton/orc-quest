// Music and sound effects, made with the Web Audio API (no audio files needed).
// Music is a simple looping step sequencer; effects are short tones and sweeps.
// Browsers only allow sound after the player presses a key or clicks, so music starts on the first press.
const Sound = (() => {
  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let wanted = null;     // the track the game asks for
  let current = null;    // the track currently playing
  let track = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;

  const TRACKS = {
    title: {
      bpm: 96, wave: 'square',
      lead: 'C5 - E5 - G5 - E5 - C5 - G4 - A4 - F5 - D5 - C5 - A4 - G4 - - -'.split(' '),
      bass: 'C3 - G3 - A3 - E3 - F3 - C3 - G3 - - '.split(' ')
    },
    village: {
      bpm: 120, wave: 'square',
      lead: 'E5 G5 A5 G5 E5 D5 C5 - D5 E5 G5 - A5 G5 E5 -'.split(' '),
      bass: 'C3 - G3 - A3 - E3 - '.split(' ')
    },
    battle: {
      bpm: 160, wave: 'square',
      lead: 'A4 A4 C5 A4 E5 - D5 C5 A4 C5 B4 A4 - G#4 A4 - -'.split(' '),
      bass: 'A2 A2 E2 E2 F2 F2 G2 G2'.split(' ')
    },
    boss: {
      bpm: 150, wave: 'sawtooth',
      lead: 'D4 D4 F4 D4 A4 G4 F4 E4 D4 D4 F4 G4 A4 - C5 -'.split(' '),
      bass: 'D2 D2 D2 D2 A#1 A#1 A1 A1'.split(' ')
    },
    ending: {
      bpm: 100, wave: 'square',
      lead: 'C5 E5 G5 C6 - G5 E5 - F5 A5 C6 A5 F5 - G5 B4 D5 -'.split(' '),
      bass: 'C3 G2 F2 G2'.split(' ')
    }
  };

  // Effects: each part has a start frequency (f), an optional end frequency for a sweep (f1),
  // a start offset (at), a length (d), a wave shape (w) and a volume (v).
  const SFX = {
    blip: [{ f: 880, d: 0.04, w: 'square', v: 0.05 }],
    confirm: [{ f: 660, d: 0.05, w: 'square', v: 0.06 }, { f: 990, at: 0.05, d: 0.08, w: 'square', v: 0.06 }],
    hit: [{ f: 220, f1: 90, d: 0.15, w: 'sawtooth', v: 0.09 }],
    heal: [{ f: 523, f1: 1046, d: 0.25, w: 'triangle', v: 0.1 }],
    coin: [{ f: 988, d: 0.06, w: 'square', v: 0.06 }, { f: 1319, at: 0.06, d: 0.14, w: 'square', v: 0.06 }],
    encounter: [{ f: 330, f1: 110, d: 0.35, w: 'square', v: 0.08 }],
    levelup: [523, 659, 784, 1046].map((f, i) => ({ f, at: i * 0.09, d: 0.12, w: 'square', v: 0.07 })),
    victory: [523, 659, 784, 659, 784, 1046].map((f, i) => ({ f, at: i * 0.12, d: 0.2, w: 'square', v: 0.06 })),
    error: [{ f: 160, d: 0.15, w: 'square', v: 0.06 }]
  };

  function init() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.6;
      musicGain.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.8;
      sfxGain.connect(ctx.destination);
      return true;
    } catch (err) {
      ctx = null;
      return false;
    }
  }

  function running() {
    return init() && ctx.state === 'running';
  }

  const NOTE_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // 'A4' -> frequency in Hz. Returns null for rests ('-').
  function freq(name) {
    const m = /^([A-G])(#?)(\d)$/.exec(name);
    if (!m) return null;
    const midi = (Number(m[3]) + 1) * 12 + NOTE_OFFSETS[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // One tone with a quick fade out. f1, if given, sweeps the pitch to that frequency.
  function tone(part, t, dest) {
    const f = freq(part.f) ?? part.f;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const start = t + (part.at || 0);
    const end = start + part.d;
    osc.type = part.w;
    osc.frequency.setValueAtTime(f, start);
    if (part.f1) osc.frequency.exponentialRampToValueAtTime(part.f1, end);
    g.gain.setValueAtTime(part.v, start);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  function note(name, t, d, wave, vol) {
    const f = freq(name);
    if (f === null) return;
    tone({ f: name, d, w: wave, v: vol }, t, musicGain);
  }

  function schedule() {
    if (!track || !ctx) return;
    const eighth = 60 / track.bpm / 2;
    while (nextTime < ctx.currentTime + 0.2) {
      note(track.lead[step % track.lead.length], nextTime, eighth * 0.9, track.wave, 0.035);
      note(track.bass[step % track.bass.length], nextTime, eighth * 0.9, 'triangle', 0.06);
      nextTime += eighth;
      step++;
    }
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    track = null;
    current = null;
  }

  // Start the wanted track if sound is on and the browser allows audio yet.
  function startIfReady() {
    if (!wanted || !Settings.get('sound') || !running()) return;
    if (current === wanted && timer) return;
    stopTimer();
    current = wanted;
    track = TRACKS[wanted];
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 50);
    schedule();
  }

  // The first key press or click unlocks audio in the browser.
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume().then(startIfReady);
    else startIfReady();
  }
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);

  document.addEventListener('settingschange', () => {
    if (Settings.get('sound')) startIfReady();
    else stopTimer();
  });

  return {
    // Switch the background music. Names: title, village, battle, boss, ending.
    music(name) {
      wanted = name;
      startIfReady();
    },
    // Play a sound effect. Names are the keys of SFX.
    sfx(name) {
      if (!Settings.get('sound') || !running() || !SFX[name]) return;
      const t = ctx.currentTime;
      for (const part of SFX[name]) tone(part, t, sfxGain);
    }
  };
})();
