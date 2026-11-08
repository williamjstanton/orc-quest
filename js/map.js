// Tile map data. Legend: . grass   = path   f forest   ~ water   ^ mountain   # wall
const TILE = 16; // pixels per tile

const MAPS = {
  mistvale: {
    name: 'Mistvale Village',
    start: { x: 7, y: 7 },
    rows: [
      '^^^^^^^^^^^^^^^^',
      '^...ff.........^',
      '^...ff..##.....^',
      '^..........##..^',
      '^==============^',
      '^...=.....~~~..^',
      '^...=.....~~~..^',
      '^...=..........^',
      '^...=....##....^',
      '^...=....##....^',
      '^...=..........^',
      '^...=....f.f...^',
      '^...=....fff...^',
      '^^^^^^^^^^^^^^^^'
    ]
  }
};

const WorldMap = (() => {
  const WIDTH = 16;
  const LEGEND = { '.': 'grass', '=': 'path', f: 'forest', '~': 'water', '^': 'mountain', '#': 'wall' };
  let grid = [];
  let info = { name: '', start: { x: 0, y: 0 }, width: WIDTH, height: 0 };

  return {
    load(id) {
      const map = MAPS[id];
      grid = map.rows.map(row => row.padEnd(WIDTH, '^').slice(0, WIDTH).split(''));
      info = { id, name: map.name, start: { ...map.start }, width: WIDTH, height: grid.length };
    },

    info() {
      return info;
    },

    // Returns a tile key such as 'grass', or null if (x, y) is outside the map.
    tileKeyAt(x, y) {
      if (x < 0 || y < 0 || x >= info.width || y >= info.height) return null;
      return LEGEND[grid[y][x]] || 'mountain';
    }
  };
})();
