// Game state: story flags and inventory. Saving to disk comes in a later milestone.
const ITEMS = {
  warning_horn: { name: 'Warning Horn', description: 'An old horn that calls the watch.' }
};

const State = (() => {
  const flags = {};
  const inventory = [];

  return {
    flags,
    hasItem(id) {
      return inventory.includes(id);
    },
    addItem(id) {
      if (!inventory.includes(id)) inventory.push(id);
    },
    removeItem(id) {
      const i = inventory.indexOf(id);
      if (i >= 0) inventory.splice(i, 1);
    },
    items() {
      return inventory.map(id => ITEMS[id].name);
    }
  };
})();
