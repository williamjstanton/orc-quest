// Game state: party, inventory, gold, equipment and story flags. Saving to disk comes in a later milestone.
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
    }
  };
})();
