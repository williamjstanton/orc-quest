// Colour palettes. Every tile also has a pattern, so meaning never depends on colour alone.
const PALETTES = {
  normal: {
    bg: '#101018',
    hero: { body: '#3a7bd5', head: '#f2c9a0', hair: '#7a4a2a', outline: '#1b1b1b', edge: '#ffffff' },
    npcs: {
      elder: { body: '#7b4fb0', head: '#f2c9a0', hair: '#d8d8d8', outline: '#1b1b1b', edge: '#ffffff' },
      smith: { body: '#8a8a8a', head: '#e8b890', hair: '#3a2a1a', outline: '#1b1b1b', edge: '#ffffff' },
      child: { body: '#e0b020', head: '#f2c9a0', hair: '#e8c060', outline: '#1b1b1b', edge: '#ffffff' }
    },
    enemies: {
      scout:  { body: '#6b4a2a', head: '#6a9a3a', hair: '#2a2a2a', outline: '#1b1b1b', edge: '#ffffff' },
      raider: { body: '#5a3a5a', head: '#5a8a3a', hair: '#1a1a1a', outline: '#1b1b1b', edge: '#ffffff' },
      shaman: { body: '#2a4a4a', head: '#7aaa4a', hair: '#e8e8e8', outline: '#1b1b1b', edge: '#ffffff' }
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
  },
  highContrast: {
    bg: '#000000',
    hero: { body: '#ff00ff', head: '#ffffff', hair: '#ffff00', outline: '#000000', edge: '#ffffff' },
    npcs: {
      elder: { body: '#00ffff', head: '#ffffff', hair: '#ffff00', outline: '#000000', edge: '#ffffff' },
      smith: { body: '#ff8800', head: '#ffffff', hair: '#ffff00', outline: '#000000', edge: '#ffffff' },
      child: { body: '#00ff00', head: '#ffffff', hair: '#ffff00', outline: '#000000', edge: '#ffffff' }
    },
    enemies: {
      scout:  { body: '#ff8800', head: '#00ff00', hair: '#000000', outline: '#000000', edge: '#ffffff' },
      raider: { body: '#ff3333', head: '#00ff00', hair: '#000000', outline: '#000000', edge: '#ffffff' },
      shaman: { body: '#00ffff', head: '#00ff00', hair: '#ffffff', outline: '#000000', edge: '#ffffff' }
    },
    ui: { box: '#000000', border: '#ffffff', text: '#ffffff', accent: '#ffff00', bar: '#ffff00', barBack: '#000000', hurt: '#ff4444' },
    tiles: {
      grass:    { fill: '#000000', ink: '#00ff00', pattern: 'dots',      walkable: true,  name: 'grass' },
      path:     { fill: '#000000', ink: '#ffffff', pattern: 'stripes',   walkable: true,  name: 'path' },
      forest:   { fill: '#00ff00', ink: '#000000', pattern: 'triangles', walkable: true,  name: 'forest' },
      water:    { fill: '#00ffff', ink: '#000000', pattern: 'waves',     walkable: false, name: 'water' },
      mountain: { fill: '#ff8800', ink: '#000000', pattern: 'peaks',     walkable: false, name: 'mountain' },
      wall:     { fill: '#ffffff', ink: '#000000', pattern: 'bricks',    walkable: false, name: 'wall' }
    }
  }
};

function currentPalette() {
  return PALETTES[Settings.get('highContrast') ? 'highContrast' : 'normal'];
}
