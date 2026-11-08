// Game data: items, skills, party members, enemies, encounters and growth rules.
const ITEMS = {
  potion: { name: 'Potion', use: true, heal: 40 },
  warning_horn: { name: 'Warning Horn', use: false }
};

const SKILLS = {
  power_strike: { name: 'Power Strike', mp: 2, kind: 'physical', power: 1.6 },
  hammer_down: { name: 'Hammer Down', mp: 2, kind: 'physical', power: 1.5 },
  firebolt: { name: 'Firebolt', mp: 3, kind: 'magic', power: 1.8 },
  heal: { name: 'Heal', mp: 4, kind: 'heal', amount: 25 },
  hex: { name: 'Hex', mp: 0, kind: 'magic', power: 1.4 }
};

const PARTY_DEFS = {
  kael:  { name: 'Kael',  level: 1, maxHp: 40, maxMp: 8,  atk: 12, def: 5, mag: 2,  spd: 9, skills: ['power_strike'] },
  tomas: { name: 'Tomas', level: 1, maxHp: 46, maxMp: 4,  atk: 11, def: 7, mag: 1,  spd: 6, skills: ['hammer_down'] },
  sela:  { name: 'Sela',  level: 1, maxHp: 30, maxMp: 16, atk: 5,  def: 3, mag: 10, spd: 8, skills: ['firebolt', 'heal'] }
};

// Stat gains per level.
const GROWTH = { maxHp: 8, maxMp: 2, atk: 2, def: 1, mag: 2, spd: 1 };

const ENEMY_DEFS = {
  scout:  { name: 'Orc Scout',   label: 'Scout',  hp: 22, atk: 9,  def: 2, mag: 0, spd: 8, exp: 6,  gold: 4,  look: 'scout',  skills: [] },
  raider: { name: 'Orc Raider',  label: 'Raider', hp: 34, atk: 12, def: 4, mag: 0, spd: 6, exp: 10, gold: 8,  look: 'raider', skills: [] },
  shaman: { name: 'Orc Shaman',  label: 'Shaman', hp: 26, atk: 4,  def: 2, mag: 9, spd: 7, exp: 12, gold: 10, look: 'shaman', skills: ['hex'] }
};

// Random encounter chance per step, and the groups that can appear.
const ENCOUNTERS = {
  forest: {
    rate: 0.15,
    groups: [['scout'], ['scout', 'scout'], ['raider'], ['scout', 'shaman'], ['raider', 'scout']]
  }
};

// Experience needed to go from a level to the next.
function expFor(level) {
  return 10 * level * level;
}

function makeMember(id) {
  const d = PARTY_DEFS[id];
  return {
    id, name: d.name, label: d.name, side: 'party', defending: false,
    level: d.level, exp: 0,
    hp: d.maxHp, maxHp: d.maxHp, mp: d.maxMp, maxMp: d.maxMp,
    atk: d.atk, def: d.def, mag: d.mag, spd: d.spd,
    skills: [...d.skills]
  };
}
