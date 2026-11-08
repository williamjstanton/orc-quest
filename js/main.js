// Game loop, movement, talking to NPCs, battles, the title screen, saving, and the accessibility controls.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const btnContrast = document.getElementById('btn-contrast');
  const btnVoice = document.getElementById('btn-voice');
  const btnRate = document.getElementById('btn-rate');
  const btnSound = document.getElementById('btn-sound');

  const MOVE_MS = 140; // time to walk one tile
  const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const DIR_NAME = { up: 'north', down: 'south', left: 'west', right: 'east' };

  const player = {
    x: 0, y: 0,            // current tile
    fromX: 0, fromY: 0,    // tile the current step started from
    moveT: 0, moving: false,
    facing: 'down',
    lastDir: null, lastBlock: null
  };
  let lastTileName = '';
  let mode = 'title';      // 'title' or 'field'
  let pendingBattle = null; // a story battle to start once the current conversation ends

  // Passed to NPC scripts, so a conversation can lead into a battle.
  const game = {
    battleAfterTalk(ids, boss) {
      pendingBattle = { ids, boss };
    }
  };

  function palette() {
    return currentPalette();
  }

  function tileName(x, y) {
    const key = WorldMap.tileKeyAt(x, y);
    return key ? palette().tiles[key].name : 'map edge';
  }

  function npcAt(x, y) {
    return npcsOn(WorldMap.info().id).find(n => n.x === x && n.y === y) || null;
  }

  function setCanvasLabel() {
    const here = tileName(player.x, player.y);
    canvas.setAttribute(
      'aria-label',
      `${WorldMap.info().name}. Standing on ${here}, column ${player.x + 1}, row ${player.y + 1}.`
    );
  }

  // Put the player on a tile without walking there.
  function placePlayer(x, y) {
    player.x = player.fromX = x;
    player.y = player.fromY = y;
    player.moving = false;
    player.moveT = 0;
    player.lastDir = null;
    player.lastBlock = null;
    lastTileName = tileName(x, y);
    setCanvasLabel();
  }

  function tryMove(dir) {
    const [dx, dy] = DIR_VEC[dir];
    const nx = player.x + dx;
    const ny = player.y + dy;
    const key = WorldMap.tileKeyAt(nx, ny);
    player.facing = dir;

    const npc = npcAt(nx, ny);
    if (npc || !key || !palette().tiles[key].walkable) {
      // Announce a blocked path once per press, not on every frame.
      const blockId = `${nx},${ny}`;
      if (player.lastBlock !== blockId) {
        player.lastBlock = blockId;
        if (npc) {
          Speech.say(`${npc.name} is in the way. Press Z to talk.`);
        } else {
          Speech.say(key ? `Blocked by ${tileName(nx, ny)} to the ${DIR_NAME[dir]}.` : 'You cannot leave the map this way.');
        }
      }
      return;
    }

    player.fromX = player.x;
    player.fromY = player.y;
    player.x = nx;
    player.y = ny;
    player.moving = true;
    player.moveT = 0;
    player.lastBlock = null;
  }

  // Talk to the NPC on the tile the player is facing.
  function interact() {
    const [dx, dy] = DIR_VEC[player.facing];
    const npc = npcAt(player.x + dx, player.y + dy);
    if (!npc) {
      Speech.say('Nothing to talk to here.');
      return;
    }
    Dialogue.start(npc.script(State, game));
  }

  // Start a battle with the right music. Boss battles use their own track.
  function startBattle(ids, onEnd, boss) {
    Battle.start(ids, onEnd);
    Sound.music(boss ? 'boss' : 'battle');
  }

  // Random encounters: a chance each time the player steps onto a tile that has them.
  function maybeEncounter() {
    const enc = ENCOUNTERS[WorldMap.tileKeyAt(player.x, player.y)];
    if (!enc || Math.random() >= enc.rate) return;
    const group = enc.groups[Math.floor(Math.random() * enc.groups.length)];
    Sound.sfx('encounter');
    startBattle(group, onBattleEnd, false);
  }

  // Grukk's battle: winning ends the story. Losing works like any other defeat.
  function bossEnd(result) {
    if (result === 'won') {
      State.flags.grukk_defeated = true;
      Sound.music('ending');
      Dialogue.start(endingScript());
    } else {
      onBattleEnd(result);
    }
  }

  function onBattleEnd(result) {
    Sound.music('village');
    if (result === 'lost') {
      // Defeat: the villagers take the party home to heal.
      State.restoreParty();
      placePlayer(WorldMap.info().start.x, WorldMap.info().start.y);
      Speech.say('You awaken in Mistvale. The villagers tended your wounds, and the party is restored.');
    } else if (result === 'fled') {
      Speech.say('You escaped into the hills.');
    } else {
      Speech.say('The hills are quiet again.');
    }
  }

  function onArrive() {
    setCanvasLabel();
    const name = tileName(player.x, player.y);
    // Speak only when the terrain changes, so walking across grass stays quiet.
    if (name !== lastTileName) Speech.say(name.charAt(0).toUpperCase() + name.slice(1) + '.');
    lastTileName = name;
    maybeEncounter();
  }

  function describe() {
    const here = tileName(player.x, player.y);
    const around = [['north', 0, -1], ['south', 0, 1], ['west', -1, 0], ['east', 1, 0]]
      .map(([label, dx, dy]) => `${label}: ${tileName(player.x + dx, player.y + dy)}`);
    Speech.say(`On ${here}. ${around.join('. ')}.`);
  }

  function toggleContrast() {
    const on = Settings.toggle('highContrast');
    Speech.say(`High contrast ${on ? 'on' : 'off'}.`);
  }

  function toggleVoice() {
    const on = Settings.toggle('voice');
    if (!on) Speech.stop();
    Speech.say(`Voice ${on ? 'on' : 'off'}.`);
  }

  function changeRate(delta) {
    const rate = Math.min(2, Math.max(0.5, Math.round((Settings.get('voiceRate') + delta) * 10) / 10));
    Settings.set('voiceRate', rate);
    Speech.say(`Voice speed ${rate.toFixed(1)}.`);
  }

  function refreshUI() {
    const hc = Settings.get('highContrast');
    const vo = Settings.get('voice');
    const rate = Settings.get('voiceRate');

    document.body.classList.toggle('high-contrast', hc);
    btnContrast.textContent = `High contrast: ${hc ? 'on' : 'off'} (H)`;
    btnContrast.setAttribute('aria-pressed', String(hc));

    if (Speech.canSpeak) {
      btnVoice.textContent = `Voice: ${vo ? 'on' : 'off'} (V)`;
      btnVoice.setAttribute('aria-pressed', String(vo));
    } else {
      btnVoice.textContent = 'Voice: not supported in this browser';
      btnVoice.disabled = true;
    }
    btnRate.textContent = `Voice speed: ${rate.toFixed(1)} ([ ])`;

    const snd = Settings.get('sound');
    btnSound.textContent = `Sound: ${snd ? 'on' : 'off'} (N)`;
    btnSound.setAttribute('aria-pressed', String(snd));
  }

  function toggleSound() {
    const on = Settings.toggle('sound');
    Speech.say(`Sound ${on ? 'on' : 'off'}.`);
  }

  // ---- Save hooks: how save.js describes the game and restores it ----

  function capture() {
    const leader = State.party()[0];
    return {
      mapId: WorldMap.info().id,
      x: player.x,
      y: player.y,
      summary: `${WorldMap.info().name}, ${leader.name} Lv ${leader.level}, ${State.gold()}g`,
      state: State.serialize()
    };
  }

  function applySave(data) {
    if (!Number.isInteger(data.x) || !Number.isInteger(data.y)) throw new Error('Save has no position.');
    State.deserialize(data.state); // throws before changing anything if the save is bad
    WorldMap.load(data.mapId);
    placePlayer(data.x, data.y);
    mode = 'field';
    Sound.music('village');
  }

  function newGame() {
    State.joinParty('kael');
    State.addItem('potion', 2);
    WorldMap.load('mistvale');
    placePlayer(WorldMap.info().start.x, WorldMap.info().start.y);
    mode = 'field';
    Sound.music('village');
    Speech.say(`Welcome to ${WorldMap.info().name}. Walk up to someone and press Z to talk. Press E to describe your surroundings.`);
  }

  Save.hooks.capture = capture;
  Save.hooks.apply = applySave;
  Save.hooks.newGame = newGame;

  // ---- Frame loop ----

  function update(dt) {
    Dialogue.update(dt);
    Battle.update(dt);
    if (mode === 'title') {
      // The title screen is a conversation-style menu. If it ever ends without starting a game, show it again.
      if (!Dialogue.active()) Dialogue.start(titleScreen());
      return;
    }
    // A story battle waits until the conversation that started it has ended.
    if (pendingBattle && !Dialogue.active() && !Battle.active()) {
      const p = pendingBattle;
      pendingBattle = null;
      startBattle(p.ids, p.boss ? bossEnd : onBattleEnd, p.boss);
      return;
    }
    if (Battle.active() || Dialogue.active()) return; // the world waits during talks and battles

    if (player.moving) {
      player.moveT += dt;
      if (player.moveT >= MOVE_MS) {
        player.moving = false;
        player.fromX = player.x;
        player.fromY = player.y;
        onArrive();
      }
      return;
    }
    const dir = Input.currentDir();
    if (dir !== player.lastDir) {
      player.lastDir = dir;
      player.lastBlock = null; // a new press may announce a blocked path again
    }
    if (dir) tryMove(dir);
  }

  function drawTitle(pal) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = pal.ui.accent;
    ctx.fillText('ORC QUEST', 128, 36);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = pal.ui.text;
    ctx.fillText('A short tale of Mistvale', 128, 70);
    // A small scene: the hero facing an orc raider.
    Render.drawHero(ctx, 92, 104, pal.hero);
    Render.drawHero(ctx, 148, 104, pal.enemies.raider);
    ctx.restore();
  }

  function drawField(pal) {
    const { width, height, id } = WorldMap.info();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        Render.drawTile(ctx, x * TILE, y * TILE, pal.tiles[WorldMap.tileKeyAt(x, y)]);
      }
    }

    for (const npc of npcsOn(id)) {
      Render.drawHero(ctx, npc.x * TILE, npc.y * TILE, pal.npcs[npc.look]);
    }

    // Interpolate the hero between tiles while walking.
    const t = player.moving ? Math.min(1, player.moveT / MOVE_MS) : 1;
    const px = (player.fromX + (player.x - player.fromX) * t) * TILE;
    const py = (player.fromY + (player.y - player.fromY) * t) * TILE;
    Render.drawHero(ctx, px, py, pal.hero);

    Dialogue.draw(ctx, pal);
  }

  function draw() {
    const pal = palette();
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mode === 'title') {
      drawTitle(pal);
      Dialogue.draw(ctx, pal);
    } else if (Battle.active()) {
      Battle.draw(ctx, pal);
    } else {
      drawField(pal);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Open the field menu, unless something else is already going on.
  function openMenu() {
    if (Dialogue.active() || Battle.active() || player.moving) return;
    Dialogue.start(fieldMenu());
  }

  // Confirm: continue a conversation or battle message, or talk to the NPC in front of the player.
  function confirm() {
    if (Dialogue.active()) {
      Dialogue.press();
    } else if (!player.moving) {
      interact();
    }
  }

  // Input bindings
  Input.on('h', toggleContrast);
  Input.on('v', toggleVoice);
  Input.on('r', () => Speech.repeat());
  Input.on('e', describe);
  Input.on('[', () => changeRate(-0.1));
  Input.on(']', () => changeRate(0.1));
  Input.on('m', openMenu);
  Input.on('z', confirm);
  Input.on('enter', confirm);
  Input.on(' ', confirm);
  Input.on('dir:up', () => Dialogue.move(-1));
  Input.on('dir:down', () => Dialogue.move(1));
  Input.on('1', () => Dialogue.pick(0));
  Input.on('2', () => Dialogue.pick(1));
  Input.on('3', () => Dialogue.pick(2));
  Input.on('4', () => Dialogue.pick(3));
  Input.on('5', () => Dialogue.pick(4));
  Input.on('6', () => Dialogue.pick(5));
  Input.on('n', toggleSound);

  // Button bindings
  btnContrast.addEventListener('click', toggleContrast);
  btnVoice.addEventListener('click', toggleVoice);
  btnSound.addEventListener('click', toggleSound);
  btnRate.addEventListener('click', () => {
    const r = Settings.get('voiceRate');
    changeRate(r >= 1.8 ? -1.2 : 0.2); // cycle through speeds
  });

  document.addEventListener('settingschange', refreshUI);

  // Start on the title screen.
  refreshUI();
  Sound.music('title');
  Dialogue.start(titleScreen());
  requestAnimationFrame((now) => { last = now; frame(now); });
})();
