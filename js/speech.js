// Captions (always shown; announced by screen readers) and an optional synthesized voice.
const Speech = (() => {
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let lastMessage = '';
  let voice = null;

  function pickVoice() {
    if (!canSpeak) return null;
    const voices = speechSynthesis.getVoices();
    return voices.find(v => /^en[-_]/i.test(v.lang) && v.default)
        || voices.find(v => /^en[-_]/i.test(v.lang))
        || null;
  }

  if (canSpeak) {
    voice = pickVoice();
    speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  }

  // Show a message as a caption and, if voice is on, speak it.
  function say(text) {
    lastMessage = text;
    const caption = document.getElementById('caption');
    if (caption) caption.textContent = text;

    if (!canSpeak || !Settings.get('voice')) return;
    speechSynthesis.cancel(); // interrupt anything still being spoken
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Settings.get('voiceRate');
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  function repeat() {
    if (lastMessage) say(lastMessage);
  }

  function stop() {
    if (canSpeak) speechSynthesis.cancel();
  }

  return { say, repeat, stop, canSpeak };
})();
