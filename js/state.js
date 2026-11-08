// Game state: party, inventory, gold and story flags. serialize() and deserialize() let save.js store and restore it.
const State = (() => {
  const flags = {};
  const counts = {};     // item id -> how many the party carries
  const members = {};    // party member id -> stats object
  const partyIds = [];   // party order
  let gold = 20;

  // Add or remove an item's stat bonuses on a member.
  function applyBonus(member, item, sign) {
    for (const stat of ['atk', 'def', 'mag', 'spd']) {
      if (item[stat]) member[stat] += sign * item[stat];
    }
  }

  function addItem(id, n = 1) {
    counts[id] = (counts[id] || 0) + n;
  }

  function removeItem(id, n = 1) {
    counts[id] = Math.max(0, (counts[id] || 0) - n);
  }

  function hasItem(id) {
    return (counts[id] || 0) > 0;
  }

  function unequip(memberId, slot) {
    const m = members[memberId];
    const id = m.gear[slot];
    if (!id) return;
    applyBonus(m, ITEMS[id], -1);
    m.gear[slot] = null;
    addItem(id);
  }

  return {
    flags,
    hasItem,
    itemCount(id) {
      return counts[id] || 0;
    },
    addItem,
    removeItem,
    items() {
      return Object.keys(counts)
        .filter(id => counts[id] > 0)
        .map(id => ({ id, name: ITEMS[id].name, count: counts[id] }));
    },
    joinParty(id) {
      if (!members[id]) {
        members[id] = makeMember(id);
        partyIds.push(id);
      }
    },
    party() {
      return partyIds.map(id => members[id]);
    },
    restoreParty() {
      partyIds.forEach(id => {
        members[id].hp = members[id].maxHp;
        members[id].mp = members[id].maxMp;
      });
    },
    // Equip an item from the pack. Any item already in that slot goes back to the pack.
    equip(memberId, itemId) {
      const item = ITEMS[itemId];
      if (!hasItem(itemId) || !item.slot) return false;
      const m = members[memberId];
      unequip(memberId, item.slot);
      removeItem(itemId);
      m.gear[item.slot] = itemId;
      applyBonus(m, item, 1);
      return true;
    },
    unequip,
    gold() {
      return gold;
    },
    addGold(n) {
      gold += n;
    },

    // A plain copy of everything that makes up the game, ready for JSON.
    serialize() {
      return {
        gold,
        flags: { ...flags },
        counts: { ...counts },
        partyIds: [...partyIds],
        members: partyIds.map(id => JSON.parse(JSON.stringify(members[id])))
      };
    },

    // Replace the current game with saved data. Checks everything first, so a bad save
    // throws and leaves the current game untouched.
    deserialize(data) {
      if (!data || !Array.isArray(data.members) || data.members.length === 0) {
        throw new Error('Save has no party.');
      }
      const newMembers = {};
      const newIds = [];
      for (const m of data.members) {
        if (!PARTY_DEFS[m.id] || typeof m.maxHp !== 'number' || !m.gear) {
          throw new Error(`Unknown party member in save: ${m.id}`);
        }
        newMembers[m.id] = m;
        newIds.push(m.id);
      }
      const newCounts = {};
      for (const [id, n] of Object.entries(data.counts || {})) {
        if (ITEMS[id] && n > 0) newCounts[id] = n;
      }

      Object.keys(members).forEach(k => delete members[k]);
      Object.assign(members, newMembers);
      partyIds.length = 0;
      partyIds.push(...newIds);
      Object.keys(counts).forEach(k => delete counts[k]);
      Object.assign(counts, newCounts);
      Object.keys(flags).forEach(k => delete flags[k]);
      Object.assign(flags, data.flags || {});
      gold = Number(data.gold) || 0;
    }
  };
})();
