// Colour palette. Every tile also has a pattern, so meaning never depends on colour alone.
const PALETTES = {
  normal: {
    bg: '#101018',
    hero: { body: '#3a7bd5', head: '#f2c9a0', hair: '#7a4a2a', outline: '#1b1b1b', edge: '#ffffff' },
    npcs: {
      elder: { body: '#7b4fb0', head: '#f2c9a0', hair: '#d8d8d8', outline: '#1b1b1b', edge: '#ffffff' },
      smith: { body: '#8a8a8a', head: '#e8b890', hair: '#3a2a1a', outline: '#1b1b1b', edge: '#ffffff' },
      child: { body: '#e0b020', head: '#f2c9a0', hair: '#e8c060', outline: '#1b1b1b', edge: '#ffffff' },
      brenna: { body: '#c04a8a', head: '#f2c9a0', hair: '#6a3a1a', outline: '#1b1b1b', edge: '#ffffff' },
      grukk: { body: '#8a2a2a', head: '#5a9a3a', hair: '#101010', outline: '#1b1b1b', edge: '#ffffff' }
    },
    enemies: {
      scout:  { body: '#6b4a2a', head: '#6a9a3a', hair: '#2a2a2a', outline: '#1b1b1b', edge: '#ffffff' },
      raider: { body: '#5a3a5a', head: '#5a8a3a', hair: '#1a1a1a', outline: '#1b1b1b', edge: '#ffffff' },
      shaman: { body: '#2a4a4a', head: '#7aaa4a', hair: '#e8e8e8', outline: '#1b1b1b', edge: '#ffffff' },
      grukk:  { body: '#8a2a2a', head: '#5a9a3a', hair: '#101010', outline: '#1b1b1b', edge: '#ffffff' }
    },
    ui: { box: '#0b0d1a', border: '#f4f4f4', text: '#f4f4f4', accent: '#ffd166', bar: '#4caf50', barBack: '#333344', hurt: '#ff6b6b' },
    tiles: {
      grass:    { fill: '#4a7a3a', ink: '#6fa35a', pattern: 'dots',      walkable: true,  name: 'grass' },
      path:     { fill: '#b89a6a', ink: '#d8c49a', pattern: 'plain',     walkable: true,  name: 'path' },
      forest:   { fill: '#2a5a2a', ink: '#1d3f1d', pattern: 'triangles', walkable: true,  name: 'forest' },
      water:    { fill: '#2a4f8a', ink: '#5b8fd0', pattern: 'waves',     walkable: false, name: 'water' },
      mountain: { fill: '#6b6b6b', ink: '#9a9a9a', pattern: 'peaks',     walkable: false, name: 'mountain' },
      wall:     { fill: '#7a5a4a', ink: '#4a342a', pattern: 'bricks',    walkable: false, name: 'wall' }
    }
  }
};

function currentPalette() {
  return PALETTES.normal;
}
