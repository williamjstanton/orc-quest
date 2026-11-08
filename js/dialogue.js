// Conversation system. A conversation is a generator function that yields
// Dialogue.say(...) and Dialogue.choose(...) commands. Choices are passed back
// into the generator, so branching is ordinary code.
const Dialogue = (() => {
  const CHARS_PER_SECOND = 45;
  const FONT = 'bold 10px monospace';
  const LINE_H = 12;
  const TEXT_W = 224;      // inner text width in canvas pixels
  const BOX_X = 8;
  const BOX_W = 240;
  const BOX_BOTTOM = 216;

  let run = null;          // { gen, speaker, text, shown, choices, index }

  function say(speaker, text) {
    return { type: 'say', speaker, text };
  }

  function choose(options) {
    return { type: 'choice', options };
  }

  function finish() {
    run = null;
  }

  // Run the generator until it needs player input (or ends).
  function step(answer) {
    let result;
    try {
      result = run.gen.next(answer);
    } catch (err) {
      console.error('Dialogue script failed:', err);
      finish();
      return;
    }
    if (result.done) {
      finish();
      return;
    }
    const cmd = result.value;
    if (cmd.type === 'say') {
      run.speaker = cmd.speaker;
      run.text = cmd.text;
      run.shown = 0;
      run.choices = null;
      Speech.say(cmd.speaker ? `${cmd.speaker}: ${cmd.text}` : cmd.text);
    } else if (cmd.type === 'choice') {
      run.choices = cmd.options;
      run.index = 0;
      Speech.say('Choices. ' + cmd.options.map((o, i) => `${i + 1}, ${o}.`).join(' '));
    }
  }

  function start(gen) {
    run = { gen, speaker: '', text: '', shown: 0, choices: null, index: 0 };
    step(undefined);
  }

  function active() {
    return run !== null;
  }

  // Confirm key: finish typing, pick the highlighted choice, or go to the next line.
  function press() {
    if (!run) return false;
    // Finish typing first, so a choice is never picked by accident.
    if (run.shown < run.text.length) {
      run.shown = run.text.length;
      return true;
    }
    if (run.choices) {
      Sound.sfx('confirm');
      step(run.index);
      return true;
    }
    step(undefined);
    return true;
  }

  function move(delta) {
    if (!run || !run.choices) return;
    const n = run.choices.length;
    run.index = (run.index + delta + n) % n;
    Sound.sfx('blip');
    Speech.say(`${run.index + 1}, ${run.choices[run.index]}`);
  }

  function pick(i) {
    if (run && run.choices && i < run.choices.length) {
      run.index = i;
      Sound.sfx('confirm');
      step(i);
    }
  }

  function update(dt) {
    if (run && run.text) {
      run.shown = Math.min(run.text.length, run.shown + (dt * CHARS_PER_SECOND) / 1000);
    }
  }

  // Split text into lines that fit the box.
  function wrap(ctx, text) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width > TEXT_W && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function draw(ctx, pal) {
    if (!run) return;
    const ui = pal.ui;

    ctx.save();
    ctx.font = FONT;
    ctx.textBaseline = 'top';

    const lines = run.text ? wrap(ctx, run.text) : [];
    const optionCount = run.choices ? run.choices.length : 0;
    const contentH = (lines.length + optionCount + (optionCount ? 0.5 : 0)) * LINE_H;
    const h = 8 + LINE_H + contentH + 6;
    const y = BOX_BOTTOM - h;

    // Box with a two-pixel border.
    ctx.fillStyle = ui.border;
    ctx.fillRect(BOX_X, y, BOX_W, h);
    ctx.fillStyle = ui.box;
    ctx.fillRect(BOX_X + 2, y + 2, BOX_W - 4, h - 4);

    // Speaker name.
    ctx.fillStyle = ui.accent;
    ctx.fillText(run.speaker, BOX_X + 8, y + 6);

    // Text, revealed one character at a time.
    let remaining = Math.floor(run.shown);
    let lineY = y + 6 + LINE_H;
    ctx.fillStyle = ui.text;
    for (const line of lines) {
      const n = Math.max(0, Math.min(line.length, remaining));
      if (n > 0) ctx.fillText(line.slice(0, n), BOX_X + 8, lineY);
      remaining -= line.length + 1;
      lineY += LINE_H;
    }

    // Choices, with a cursor on the highlighted one.
    if (run.choices) {
      lineY += LINE_H * 0.5;
      run.choices.forEach((option, i) => {
        const selected = i === run.index;
        ctx.fillStyle = selected ? ui.accent : ui.text;
        ctx.fillText((selected ? '> ' : '  ') + option, BOX_X + 8, lineY);
        lineY += LINE_H;
      });
    } else if (run.shown >= run.text.length) {
      // "Press Z to continue" marker.
      ctx.fillStyle = ui.accent;
      ctx.beginPath();
      ctx.moveTo(BOX_X + BOX_W - 14, BOX_BOTTOM - 10);
      ctx.lineTo(BOX_X + BOX_W - 8, BOX_BOTTOM - 10);
      ctx.lineTo(BOX_X + BOX_W - 11, BOX_BOTTOM - 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  return { say, choose, start, active, current: () => run, press, move, pick, update, draw };
})();
