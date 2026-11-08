// Turn-based battles. A battle is a generator driven by the Dialogue runner, so messages,
// Z-to-continue and menu choices work the same way they do in conversations.
const Battle = (() => {
  const FONT = 'bold 10px monospace';
  const LINE_H = 11;
  const FLOAT_MS = 900;
  const ENEMY_Y = 24;
  const ENEMY_SPACING = 56;
  const COL_W = 84;

  let b = null; // { party, enemies, current, targetList, floats, result, onEnd }

  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const living = list => list.filter(c => c.hp > 0);
  const msg = text => Dialogue.say('', text);

  function makeEnemies(ids) {
    return ids.map((id, i) => {
      const def = ENEMY_DEFS[id];
      const total = ids.filter(x => x === id).length;
      const n = ids.slice(0, i + 1).filter(x => x === id).length;
      return {
        ...def,
        id,
        side: 'enemy',
        name: total > 1 ? `${def.name} ${n}` : def.name,
        label: total > 1 ? `${def.label} ${n}` : def.label,
        hp: def.hp, maxHp: def.hp, mp: 0, maxMp: 0,
        defending: false
      };
    });
  }

  function outcome() {
    if (living(b.enemies).length === 0) return 'won';
    if (living(b.party).length === 0) return 'lost';
    return null;
  }

  function addFloat(c, text) {
    b.floats.push({ c, text, t: 0 });
  }

  // Lets the menu choose a target. Returns the combatant, or null for "Back".
  function* pickTarget(list) {
    const options = list.map(t => `${t.label} ${t.hp}/${t.maxHp}`);
    options.push('Back');
    b.targetList = list;
    const i = yield Dialogue.choose(options);
    b.targetList = null;
    return i < list.length ? list[i] : null;
  }

  function* pickSkill(c) {
    const options = c.skills.map(id => `${SKILLS[id].name} ${SKILLS[id].mp}MP`);
    options.push('Back');
    const i = yield Dialogue.choose(options);
    return i < c.skills.length ? SKILLS[c.skills[i]] : null;
  }

  function* hurt(src, dst, base, verb) {
    let dmg = Math.max(1, Math.round(base + rand(-2, 2)));
    if (dst.defending) dmg = Math.max(1, Math.floor(dmg / 2));
    dst.hp = Math.max(0, dst.hp - dmg);
    addFloat(dst, `-${dmg}`);
    Sound.sfx('hit');
    yield msg(`${src.name} ${verb} ${dst.name} for ${dmg}!`);
    if (dst.hp === 0) yield msg(`${dst.name} falls!`);
  }

  function* physicalHit(src, dst, power) {
    if (Math.random() < 0.08) {
      yield msg(`${src.name} swings at ${dst.name} and misses!`);
      return;
    }
    yield* hurt(src, dst, src.atk * power - dst.def * 0.6, src.side === 'party' ? 'strikes' : 'hits');
  }

  function* magicHit(src, dst, power) {
    yield* hurt(src, dst, src.mag * power - dst.def * 0.3, 'blasts');
  }

  function* healAlly(src, dst, skill) {
    const amount = skill.amount + src.mag * 2;
    dst.hp = Math.min(dst.maxHp, dst.hp + amount);
    addFloat(dst, `+${amount}`);
    Sound.sfx('heal');
    yield msg(`${src.name} heals ${dst.name} for ${amount}!`);
  }

  function* useSkill(c, t, skill) {
    yield msg(`${c.name} uses ${skill.name}!`);
    if (skill.kind === 'physical') yield* physicalHit(c, t, skill.power);
    else if (skill.kind === 'magic') yield* magicHit(c, t, skill.power);
    else yield* healAlly(c, t, skill);
  }

  function* useItem(c, t, id) {
    const item = ITEMS[id];
    yield msg(`${c.name} uses a ${item.name} on ${t.name}.`);
    t.hp = Math.min(t.maxHp, t.hp + item.heal);
    addFloat(t, `+${item.heal}`);
    Sound.sfx('heal');
    yield msg(`${t.name} recovers ${item.heal} HP.`);
  }

  function* partyTurn(c) {
    c.defending = false;
    while (true) {
      yield Dialogue.say(c.name, 'What will you do?');
      const cmd = yield Dialogue.choose(['Attack', 'Skill', 'Item', 'Defend', 'Flee']);

      if (cmd === 0) {
        const target = yield* pickTarget(living(b.enemies));
        if (!target) continue;
        yield* physicalHit(c, target, 1);
        return;
      }

      if (cmd === 1) {
        if (c.skills.length === 0) {
          yield msg(`${c.name} knows no skills.`);
          continue;
        }
        const skill = yield* pickSkill(c);
        if (!skill) continue;
        if (c.mp < skill.mp) {
          yield msg('Not enough MP.');
          continue;
        }
        const targets = skill.kind === 'heal' ? living(b.party) : living(b.enemies);
        const target = yield* pickTarget(targets);
        if (!target) continue;
        c.mp -= skill.mp;
        yield* useSkill(c, target, skill);
        return;
      }

      if (cmd === 2) {
        const usable = State.items().filter(i => ITEMS[i.id].use);
        if (usable.length === 0) {
          yield msg('No items to use.');
          continue;
        }
        const options = usable.map(i => `${i.name} x${i.count}`);
        options.push('Back');
        const pick = yield Dialogue.choose(options);
        if (pick === usable.length) continue;
        const target = yield* pickTarget(living(b.party));
        if (!target) continue;
        State.removeItem(usable[pick].id);
        yield* useItem(c, target, usable[pick].id);
        return;
      }

      if (cmd === 3) {
        c.defending = true;
        yield msg(`${c.name} braces for impact.`);
        return;
      }

      // Flee
      if (Math.random() < 0.5) {
        b.result = 'fled';
        yield msg('The party escapes!');
      } else {
        yield msg("Couldn't escape!");
      }
      return;
    }
  }

  function* enemyTurn(e) {
    const targets = living(b.party);
    if (targets.length === 0) return;
    const t = targets[rand(0, targets.length - 1)];
    if (e.skills.length && Math.random() < 0.4) {
      const skill = SKILLS[e.skills[0]];
      yield msg(`${e.name} chants ${skill.name}!`);
      yield* magicHit(e, t, skill.power);
    } else {
      yield* physicalHit(e, t, 1);
    }
  }

  function* rewards() {
    const exp = b.enemies.reduce((sum, e) => sum + e.exp, 0);
    const gold = b.enemies.reduce((sum, e) => sum + e.gold, 0);
    State.addGold(gold);
    Sound.sfx('victory');
    yield msg(`Victory! Gained ${gold} gold and ${exp} EXP.`);
    for (const m of living(b.party)) {
      m.exp += exp;
      while (m.exp >= expFor(m.level)) {
        m.exp -= expFor(m.level);
        m.level++;
        m.maxHp += GROWTH.maxHp; m.hp += GROWTH.maxHp;
        m.maxMp += GROWTH.maxMp; m.mp += GROWTH.maxMp;
        m.atk += GROWTH.atk; m.def += GROWTH.def;
        m.mag += GROWTH.mag; m.spd += GROWTH.spd;
        Sound.sfx('levelup');
        yield msg(`${m.name} reached level ${m.level}!`);
        yield msg(`HP +${GROWTH.maxHp}, MP +${GROWTH.maxMp}, Attack +${GROWTH.atk}, Defense +${GROWTH.def}, Magic +${GROWTH.mag}, Speed +${GROWTH.spd}.`);
      }
    }
  }

  // The whole battle, as a sequence of messages and choices.
  function* flow() {
    yield msg(`Orcs attack! ${b.enemies.map(e => e.name).join(', ')} appear!`);
    let result = null;
    while (!result) {
      const order = [...b.party, ...b.enemies].sort((p, q) => q.spd - p.spd);
      for (const c of order) {
        result = outcome();
        if (result) break;
        if (c.hp <= 0) continue;
        b.current = c;
        if (c.side === 'party') yield* partyTurn(c);
        else yield* enemyTurn(c);
        b.current = null;
        if (b.result === 'fled') {
          result = 'fled';
          break;
        }
        result = outcome();
        if (result) break;
      }
    }
    b.result = result;
    if (result === 'won') yield* rewards();
    else if (result === 'lost') yield msg('The party has fallen...');
  }

  // Start a battle against the given enemy ids. onEnd receives 'won', 'lost' or 'fled'.
  function start(enemyIds, onEnd) {
    b = {
      party: State.party(),
      enemies: makeEnemies(enemyIds),
      current: null,
      targetList: null,
      floats: [],
      result: null,
      onEnd
    };
    Dialogue.start(flow());
  }

  function active() {
    return b !== null;
  }

  // Call every frame, after Dialogue.update. Ends the battle when its script finishes.
  function update(dt) {
    if (!b) return;
    for (const f of b.floats) f.t += dt;
    b.floats = b.floats.filter(f => f.t < FLOAT_MS);
    if (!Dialogue.active()) {
      const { onEnd, result } = b;
      b = null;
      onEnd(result);
    }
  }

  // ---- Drawing ----

  function anchor(c) {
    if (c.side === 'enemy') {
      const i = b.enemies.indexOf(c);
      const n = b.enemies.length;
      return { x: 128 + (i - (n - 1) / 2) * ENEMY_SPACING, y: ENEMY_Y };
    }
    const i = b.party.indexOf(c);
    return { x: 4 + i * COL_W + COL_W / 2, y: 120 };
  }

  function wrapText(ctx, text, width) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawBox(ctx, ui, x, y, w, h) {
    ctx.fillStyle = ui.border;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ui.box;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  function draw(ctx, pal) {
    const ui = pal.ui;
    const run = Dialogue.current();

    ctx.save();
    ctx.font = FONT;
    ctx.textBaseline = 'top';
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, 256, 224);

    // Enemies
    ctx.textAlign = 'center';
    b.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const { x: cx } = anchor(e);
      Render.drawHero(ctx, cx - 8, ENEMY_Y, pal.enemies[e.look]);
      ctx.fillStyle = b.current === e ? ui.accent : ui.text;
      ctx.fillText(e.label, cx, ENEMY_Y + 18);
      ctx.fillText(String(e.hp), cx, ENEMY_Y + 29);
    });
    ctx.textAlign = 'left';

    // Target marker for the highlighted choice
    const target = b.targetList && run && run.choices ? b.targetList[run.index] : null;
    if (target) {
      const a = anchor(target);
      ctx.fillStyle = ui.accent;
      if (target.side === 'enemy') {
        ctx.beginPath();
        ctx.moveTo(a.x - 5, ENEMY_Y - 8);
        ctx.lineTo(a.x + 5, ENEMY_Y - 8);
        ctx.lineTo(a.x, ENEMY_Y - 3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = ui.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(a.x - COL_W / 2 - 1, 119, COL_W - 2, 38);
      }
    }

    // Party status
    b.party.forEach((m, i) => {
      const x = 4 + i * COL_W;
      ctx.fillStyle = b.current === m ? ui.accent : ui.text;
      ctx.fillText(m.name, x + 2, 121);
      if (m.hp > 0) {
        ctx.fillStyle = ui.text;
        ctx.fillText(`HP ${m.hp}/${m.maxHp}`, x + 2, 132);
        ctx.fillText(`MP ${m.mp}/${m.maxMp}`, x + 2, 143);
        ctx.fillStyle = ui.barBack;
        ctx.fillRect(x + 2, 154, COL_W - 8, 3);
        ctx.fillStyle = ui.bar;
        ctx.fillRect(x + 2, 154, Math.round((COL_W - 8) * m.hp / m.maxHp), 3);
      } else {
        ctx.fillStyle = ui.hurt;
        ctx.fillText('DOWN', x + 2, 132);
      }
    });

    // Floating damage and healing numbers
    ctx.textAlign = 'center';
    for (const f of b.floats) {
      const a = anchor(f.c);
      ctx.fillStyle = f.text.startsWith('+') ? ui.accent : ui.hurt;
      ctx.fillText(f.text, a.x, a.y - 4 - (f.t / FLOAT_MS) * 12);
    }
    ctx.textAlign = 'left';

    // Message box (left)
    drawBox(ctx, ui, 4, 160, 130, 56);
    if (run) {
      let y = 164;
      if (run.speaker) {
        ctx.fillStyle = ui.accent;
        ctx.fillText(run.speaker, 10, y);
        y += LINE_H;
      }
      ctx.fillStyle = ui.text;
      let remaining = Math.floor(run.shown);
      for (const line of wrapText(ctx, run.text, 118)) {
        const n = Math.max(0, Math.min(line.length, remaining));
        if (n > 0) ctx.fillText(line.slice(0, n), 10, y);
        remaining -= line.length + 1;
        y += LINE_H;
      }
      if (!run.choices && run.shown >= run.text.length) {
        ctx.fillStyle = ui.accent;
        ctx.beginPath();
        ctx.moveTo(122, 206);
        ctx.lineTo(128, 206);
        ctx.lineTo(125, 210);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Command and target menu (right)
    drawBox(ctx, ui, 138, 160, 114, 56);
    if (run && run.choices) {
      run.choices.forEach((option, i) => {
        const selected = i === run.index;
        ctx.fillStyle = selected ? ui.accent : ui.text;
        ctx.fillText((selected ? '>' : ' ') + option, 146, 164 + i * LINE_H);
      });
    }

    ctx.restore();
  }

  return { start, active, update, draw };
})();
