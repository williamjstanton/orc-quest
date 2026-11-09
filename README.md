# Orc Quest

A short, 8-bit style turn-based role-playing game. Orcs are gathering in the hills above the village of Mistvale, and it's up to you and your party to sound the warning and stop their chieftain, Grukk.

The game runs in any modern web browser. There is nothing to install.

**Play it online:** https://williamjstanton.github.io/orc-quest/

## How to play

Walk around Mistvale, talk to villagers, and fight the orcs that roam the forest. Find the Warning Horn, sound it, and then face Grukk in the woods to the north.

### Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys or W A S D |
| Talk, continue, confirm | Z, Space or Enter |
| Choose a menu option | Up and Down, then Z; or press 1 to 6 |
| Field menu (status, items, equipment, save, load) | M |
| Describe your surroundings | E |
| Repeat the last message | R |
| Captions on or off | C |
| Voice on or off | V |
| Voice speed slower or faster | [ and ] |
| Music and sound effects on or off | N |

Every option is also available as a button on the right-hand panel.

### Saving and loading

Choose **Save** in the field menu (M) to save to one of three slots. Choose **Continue** on the title screen, or **Load** in the field menu, to pick up a saved game.

Saves are stored in your browser, on the device you're playing on. They don't sync between devices or browsers, and they're lost if you clear your browser's site data for this game.

## Accessibility

- **Captions** are hidden by default. Press C to show them. Screen readers announce game messages whether captions are on or off.
- **Synthesized voice** reads messages aloud. Turn it on with V, and adjust the speed with [ and ]. Voice quality depends on the voices your browser and operating system provide.
- **Clear visuals:** each terrain type has its own pattern, so meaning never depends on colour alone.
- **Sound:** footsteps change with the ground you walk on, and music and effects can be turned off with N.

## Running it on your computer

You don't need a server. Download or clone the repository and open `index.html` in your browser.

## Project structure

| Path | What it contains |
| --- | --- |
| `index.html` | The page layout and the list of scripts |
| `style.css` | Page styling |
| `js/main.js` | The game loop, movement, the title screen, and key bindings |
| `js/map.js` | Map layouts |
| `js/npcs.js` | Villagers, their conversations, Grukk, and the ending |
| `js/battle.js` | Turn-based battles |
| `js/menus.js` | The field menu, the shop, and save and load menus |
| `js/dialogue.js` | The conversation and message box system |
| `js/state.js` | Party, items, gold, and story progress |
| `js/save.js` | Save slots in browser storage |
| `js/data.js` | Items, skills, characters, enemies, and encounter rules |
| `js/audio.js` | Music and sound effects |
| `js/speech.js` | Captions and the synthesized voice |
| `js/settings.js` | Saved player preferences |
| `js/render.js` and `js/palette.js` | Drawing and colours |
| `js/input.js` | Keyboard input |

## Credits

Written by William J. Stanton. Music and sound effects are generated in code by the game, so there are no external audio files.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
