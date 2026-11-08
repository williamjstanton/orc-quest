// Non-player characters on each map, and their conversation scripts.

// Elder Aldric: sends the player to the smith, then receives the horn.
function* elderScript(s) {
  if (s.flags.demo_complete) {
    yield Dialogue.say('Elder Aldric', 'The watch rides at dawn. Mistvale owes you its thanks, traveler.');
    return;
  }
  if (s.hasItem('warning_horn')) {
    yield Dialogue.say('Elder Aldric', 'Tomas sent you with the horn? Good. Sound it, and the watch will ride out.');
    const pick = yield Dialogue.choose(['Sound the horn.', 'Not yet.']);
    if (pick === 0) {
      s.removeItem('warning_horn');
      s.flags.demo_complete = true;
      yield Dialogue.say('Elder Aldric', 'The horn echoes across the valley! The watch rides out. Thank you, traveler.');
    } else {
      yield Dialogue.say('Elder Aldric', 'Keep the horn safe. The orcs will not wait long.');
    }
    return;
  }
  if (!s.flags.met_elder) {
    s.flags.met_elder = true;
    yield Dialogue.say('Elder Aldric', 'Welcome to Mistvale. Orc raiders have been seen in the hills, and our watch is thin.');
    yield Dialogue.say('Elder Aldric', 'Speak with Tomas the smith, by the pond. He keeps an old horn for warnings.');
    s.joinParty('sela');
    yield Dialogue.say('Elder Aldric', 'Sela, our healer, will go with you. She knows the hills.');
  } else {
    yield Dialogue.say('Elder Aldric', 'Tomas, by the pond, can help. Go well.');
  }
}

// Tomas the smith: gives the player the Warning Horn.
function* smithScript(s) {
  if (s.flags.demo_complete) {
    yield Dialogue.say('Tomas', 'Hear that horn? The watch is moving. Well done.');
    return;
  }
  if (s.hasItem('warning_horn')) {
    yield Dialogue.say('Tomas', 'Take that horn to the elder. Quickly now!');
    return;
  }
  if (!s.flags.met_elder) {
    yield Dialogue.say('Tomas', 'I have nothing for you yet. Speak with Elder Aldric first.');
    return;
  }
  if (!s.flags.met_tomas) {
    s.flags.met_tomas = true;
    yield Dialogue.say('Tomas', 'Orcs? Aye, I have heard them too. Their war band is camped in the hills.');
    const pick = yield Dialogue.choose(['What do they want?', 'I will take the horn.']);
    if (pick === 0) {
      yield Dialogue.say('Tomas', 'Plunder, mostly. Their chief, Grukk, has been hungry since the hills went barren.');
    }
    yield Dialogue.say('Tomas', 'Here, take the Warning Horn. Sound it if they come near Mistvale.');
    s.addItem('warning_horn');
    s.joinParty('tomas');
    yield Dialogue.say('Note', 'You received the Warning Horn. Tomas joins your party.');
  } else {
    yield Dialogue.say('Tomas', 'Good luck in the hills, friend.');
  }
}

// Wren, a village child: small talk that cycles through a few lines.
function* childScript(s) {
  const lines = [
    'My brother says the orcs eat rocks. I do not believe him.',
    'Tomas makes the best swords in the valley. He is by the pond.',
    'The bakery has honey cakes, if you can find the baker.'
  ];
  const n = s.flags.wren_talks || 0;
  s.flags.wren_talks = n + 1;
  yield Dialogue.say('Wren', lines[n % lines.length]);
}

// NPCs by map. Tiles are set in map.js; a position must be walkable ground.
const NPC_DATA = {
  mistvale: [
    { id: 'elder', name: 'Elder Aldric', x: 2, y: 2, look: 'elder', script: elderScript },
    { id: 'smith', name: 'Tomas', x: 13, y: 7, look: 'smith', script: smithScript },
    { id: 'child', name: 'Wren', x: 7, y: 10, look: 'child', script: childScript },
    { id: 'brenna', name: 'Brenna', x: 10, y: 3, look: 'brenna', script: shopScript }
  ]
};

function npcsOn(mapId) {
  return NPC_DATA[mapId] || [];
}
