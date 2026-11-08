// Game state: party, inventory, gold and story flags. Saving to disk comes in a later milestone.
const State = (() => {
  const flags = {};
  const counts = {};     // item id -> how many the party carries
  const members = {};    // party member id -> stats object
  const partyIds = [];   // party order
  let gold = 0;

  return {
    flags,
    hasItem(id) {
      return (counts[id] || 0) > 0;
    },
    itemCount(id) {
      return counts[id] || 0;
    },
    addItem(id, n = 1) {
      counts[id] = (counts[id] || 0) + n;
    },
    removeItem(id, n = 1) {
      counts[id] = Math.max(0, (counts[id] || 0) - n);
    },
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
    gold() {
      return gold;
    },
    addGold(n) {
      gold += n;
    }
  };
})();
