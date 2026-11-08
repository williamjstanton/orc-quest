// Field menu and Brenna's shop. Both run on the Dialogue runner, so they share the box,
// speech, captions and keys with conversations.
const SLOTS = ['weapon', 'armor', 'accessory'];
const SLOT_LABELS = { weapon: 'Weapon', armor: 'Armor', accessory: 'Accessory' };

function gearName(m, slot) {
  return m.gear[slot] ? ITEMS[m.gear[slot]].name : 'none';
}

function* statusScreen() {
  for (const m of State.party()) {
    yield Dialogue.say(m.name, `Level ${m.level}. EXP ${m.exp}/${expFor(m.level)}. HP ${m.hp}/${m.maxHp}. MP ${m.mp}/${m.maxMp}.`);
    yield Dialogue.say(m.name, `Attack ${m.atk}, Defense ${m.def}, Magic ${m.mag}, Speed ${m.spd}.`);
    yield Dialogue.say(m.name, `Weapon: ${gearName(m, 'weapon')}. Armor: ${gearName(m, 'armor')}. Accessory: ${gearName(m, 'accessory')}.`);
  }
  yield Dialogue.say('Gold', `${State.gold()} gold.`);
}

function* itemsMenu() {
  const items = State.items();
  if (items.length === 0) {
    yield Dialogue.say('', 'Your pack is empty.');
    return;
  }
  const k = yield Dialogue.choose([...items.map(i => `${i.name} x${i.count}`), 'Back']);
  if (k === items.length) return;

  const item = ITEMS[items[k].id];
  if (!item.use) {
    yield Dialogue.say(item.name, item.desc);
    return;
  }

  // Usable items: pick who to use it on.
  const living = State.party().filter(m => m.hp > 0);
  const mi = yield Dialogue.choose([...living.map(m => `${m.name} ${m.hp}/${m.maxHp}`), 'Back']);
  if (mi === living.length) return;
  const target = living[mi];
  State.removeItem(items[k].id);
  target.hp = Math.min(target.maxHp, target.hp + item.heal);
  yield Dialogue.say('', `${target.name} recovers ${item.heal} HP.`);
}

function* equipMenu() {
  const members = State.party();
  const mi = yield Dialogue.choose([...members.map(m => m.name), 'Back']);
  if (mi === members.length) return;
  const m = members[mi];

  const si = yield Dialogue.choose([...SLOTS.map(s => `${SLOT_LABELS[s]}: ${gearName(m, s)}`), 'Back']);
  if (si === SLOTS.length) return;
  const slot = SLOTS[si];

  const options = State.items().filter(it => ITEMS[it.id].slot === slot);
  const labels = options.map(it => `${it.name} x${it.count}`);
  const removable = m.gear[slot] !== null;
  if (removable) labels.push(`Remove ${ITEMS[m.gear[slot]].name}`);
  labels.push('Back');
  if (labels.length === 1) {
    yield Dialogue.say('', `No ${SLOT_LABELS[slot].toLowerCase()} in the pack.`);
    return;
  }

  const k = yield Dialogue.choose(labels);
  if (k === labels.length - 1) return;
  if (removable && k === options.length) {
    const old = ITEMS[m.gear[slot]].name;
    State.unequip(m.id, slot);
    yield Dialogue.say('', `${m.name} puts away the ${old}.`);
    return;
  }
  const item = options[k];
  State.equip(m.id, item.id);
  yield Dialogue.say('', `${m.name} equips the ${ITEMS[item.id].name}.`);
}

// Save to one of the slots. Asks first before overwriting a slot that already has a game.
function* saveMenu() {
  const labels = [];
  for (let n = 1; n <= Save.SLOT_COUNT; n++) labels.push(Save.label(n));
  labels.push('Back');
  const k = yield Dialogue.choose(labels);
  if (k === Save.SLOT_COUNT) return;

  const n = k + 1;
  if (Save.read(n)) {
    const c = yield Dialogue.choose([`Overwrite slot ${n}`, 'Cancel']);
    if (c !== 0) return;
  }
  const ok = Save.save(n);
  yield Dialogue.say('', ok
    ? `Game saved to slot ${n}.`
    : 'Could not save. Your browser may be blocking local storage.');
}

// Load from one of the slots. Returns true when a game was loaded.
function* loadMenu() {
  const labels = [];
  for (let n = 1; n <= Save.SLOT_COUNT; n++) labels.push(Save.label(n));
  labels.push('Back');
  const k = yield Dialogue.choose(labels);
  if (k === Save.SLOT_COUNT) return false;

  const n = k + 1;
  if (!Save.read(n)) {
    yield Dialogue.say('', `Slot ${n} is empty.`);
    return false;
  }
  if (!Save.load(n)) {
    yield Dialogue.say('', `Slot ${n} could not be loaded. The save may be damaged.`);
    return false;
  }
  yield Dialogue.say('', `Loaded slot ${n}. Welcome back.`);
  return true;
}

// The field menu, opened with M.
function* fieldMenu() {
  while (true) {
    const i = yield Dialogue.choose(['Status', 'Items', 'Equip', 'Save', 'Load', 'Close']);
    if (i === 0) yield* statusScreen();
    else if (i === 1) yield* itemsMenu();
    else if (i === 2) yield* equipMenu();
    else if (i === 3) yield* saveMenu();
    else if (i === 4) {
      if (yield* loadMenu()) return; // the world has changed, so close the menu
    } else {
      yield Dialogue.say('', 'Menu closed.');
      return;
    }
  }
}

// The first screen: start a new game or continue a saved one.
function* titleScreen() {
  yield Dialogue.say('', 'Orc Quest. Press Z to choose.');
  while (true) {
    const i = yield Dialogue.choose(['New Game', 'Continue']);
    if (i === 0) {
      Save.hooks.newGame();
      return;
    }
    if (!Save.anySaved()) {
      yield Dialogue.say('', 'No saved games yet. Start a New Game.');
      continue;
    }
    if (yield* loadMenu()) return;
  }
}

function* buyMenu() {
  const options = SHOP_STOCK.map(id => `${ITEMS[id].name} ${ITEMS[id].price}g`);
  options.push('Back');
  const k = yield Dialogue.choose(options);
  if (k === SHOP_STOCK.length) return;

  const id = SHOP_STOCK[k];
  const price = ITEMS[id].price;
  if (State.gold() < price) {
    yield Dialogue.say('Brenna', `That costs ${price} gold, and you have ${State.gold()}.`);
    return;
  }
  const c = yield Dialogue.choose([`Buy for ${price} gold`, 'Cancel']);
  if (c !== 0) return;
  State.addGold(-price);
  State.addItem(id);
  Sound.sfx('coin');
  yield Dialogue.say('Brenna', `Here is your ${ITEMS[id].name}. You have ${State.gold()} gold left.`);
}

function* sellMenu() {
  const items = State.items().filter(it => ITEMS[it.id].price); // key items have no price
  if (items.length === 0) {
    yield Dialogue.say('Brenna', 'You have nothing I would buy.');
    return;
  }
  const options = items.map(it => `${it.name} x${it.count} for ${Math.floor(ITEMS[it.id].price / 2)}g`);
  options.push('Back');
  const k = yield Dialogue.choose(options);
  if (k === items.length) return;

  const value = Math.floor(ITEMS[items[k].id].price / 2);
  State.removeItem(items[k].id);
  State.addGold(value);
  Sound.sfx('coin');
  yield Dialogue.say('Brenna', `Sold for ${value} gold. You have ${State.gold()} gold.`);
}

// Brenna the merchant.
function* shopScript() {
  yield Dialogue.say('Brenna', 'Welcome! Fine wares for hill travelers. What can I get you?');
  while (true) {
    const i = yield Dialogue.choose(['Buy', 'Sell', 'Leave']);
    if (i === 2) {
      yield Dialogue.say('Brenna', 'Come back anytime. Mind the orcs!');
      return;
    }
    if (i === 0) yield* buyMenu();
    else yield* sellMenu();
  }
}
