// Game loop, movement, talking to NPCs, battles, and wiring of the accessibility controls.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const btnContrast = document.getElementById('btn-contrast');
  const btnVoice = document.getElementById('btn-voice');
  const btnRate = document.getElementById('btn-rate');

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
    Dialogue.start(npc.script(State));
  }

  // Random encounters: a chance each time the player steps onto a tile that has them.
  function maybeEncounter() {
    const enc = ENCOUNTERS[WorldMap.tileKeyAt(player.x, player.y)];
    if (!enc || Math.random() >= enc.rate) return;
    const group = enc.groups[Math.floor(Math.random() * enc.groups.length)];
    Battle.start(group, onBattleEnd);
  }

  function onBattleEnd(result) {
    if (result === 'lost') {
      // Defeat: the villagers take the party home to heal.
      State.restoreParty();
      player.x = player.fromX = WorldMap.info().start.x;
      player.y = player.fromY = WorldMap.info().start.y;
      lastTileName = tileName(player.x, player.y);
      setCanvasLabel();
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
  }

  function update(dt) {
    Dialogue.update(dt);
    Battle.update(dt);
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

    if (Battle.active()) Battle.draw(ctx, pal);
    else drawField(pal);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
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

  // Button bindings
  btnContrast.addEventListener('click', toggleContrast);
  btnVoice.addEventListener('click', toggleVoice);
  btnRate.addEventListener('click', () => {
    const r = Settings.get('voiceRate');
    changeRate(r >= 1.8 ? -1.2 : 0.2); // cycle through speeds
  });

  document.addEventListener('settingschange', refreshUI);

  // Start
  State.joinParty('kael');
  State.addItem('potion', 2);
  WorldMap.load('mistvale');
  player.x = player.fromX = WorldMap.info().start.x;
  player.y = player.fromY = WorldMap.info().start.y;
  lastTileName = tileName(player.x, player.y);
  setCanvasLabel();
  refreshUI();
  Speech.say(`Welcome to ${WorldMap.info().name}. Walk up to someone and press Z to talk. Press E to describe your surroundings.`);
  requestAnimationFrame((now) => { last = now; frame(now); });
})();
