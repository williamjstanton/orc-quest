// Drawing helpers. Everything is coloured from the active palette.
const Render = (() => {
  function drawPattern(ctx, x, y, pattern, ink) {
    const s = TILE;
    ctx.fillStyle = ink;
    switch (pattern) {
      case 'dots':
        for (let j = 2; j < s; j += 5) {
          for (let i = 2; i < s; i += 5) ctx.fillRect(x + i, y + j, 2, 2);
        }
        break;
      case 'stripes':
        for (let i = 0; i < s; i += 4) ctx.fillRect(x + i, y, 2, s);
        break;
      case 'waves':
        for (let j = 3; j < s; j += 5) ctx.fillRect(x + 2, y + j, 12, 1);
        break;
      case 'triangles':
        for (let j = 2; j < s - 3; j += 6) {
          for (let i = 2; i < s - 3; i += 6) {
            ctx.beginPath();
            ctx.moveTo(x + i + 2, y + j);
            ctx.lineTo(x + i + 4, y + j + 4);
            ctx.lineTo(x + i, y + j + 4);
            ctx.closePath();
            ctx.fill();
          }
        }
        break;
      case 'peaks':
        ctx.beginPath();
        ctx.moveTo(x + 1, y + s - 1);
        ctx.lineTo(x + 8, y + 3);
        ctx.lineTo(x + 15, y + s - 1);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bricks':
        for (let j = 0; j < s; j += 4) ctx.fillRect(x, y + j, s, 1);
        for (let j = 0; j < s; j += 4) {
          const offset = (j / 4) % 2 ? 0 : 4;
          for (let i = offset; i < s; i += 8) ctx.fillRect(x + i, y + j, 1, 4);
        }
        break;
      default:
        // 'plain': no pattern
        break;
    }
  }

  function drawTile(ctx, x, y, tile) {
    ctx.fillStyle = tile.fill;
    ctx.fillRect(x, y, TILE, TILE);
    drawPattern(ctx, x, y, tile.pattern, tile.ink);
  }

  // Hero sprite: black outline, light rim so it stands out from any tile.
  function drawHero(ctx, x, y, h) {
    ctx.fillStyle = h.outline; ctx.fillRect(x + 4, y + 1, 8, 14);
    ctx.fillStyle = h.edge;    ctx.fillRect(x + 5, y + 2, 6, 12);
    ctx.fillStyle = h.hair;    ctx.fillRect(x + 6, y + 3, 4, 2);
    ctx.fillStyle = h.head;    ctx.fillRect(x + 6, y + 5, 4, 3);
    ctx.fillStyle = h.outline; ctx.fillRect(x + 6, y + 6, 1, 1); ctx.fillRect(x + 9, y + 6, 1, 1);
    ctx.fillStyle = h.body;    ctx.fillRect(x + 6, y + 8, 4, 4);
    ctx.fillStyle = h.outline; ctx.fillRect(x + 6, y + 12, 1, 2); ctx.fillRect(x + 9, y + 12, 1, 2);
  }

  return { drawTile, drawHero };
})();
