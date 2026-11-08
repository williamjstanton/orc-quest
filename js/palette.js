// Colour palettes. Every tile also has a pattern, so meaning never depends on colour alone.
const PALETTES = {
  normal: {
    bg: '#101018',
    hero: { body: '#3a7bd5', head: '#f2c9a0', hair: '#7a4a2a', outline: '#1b1b1b', edge: '#ffffff' },
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
