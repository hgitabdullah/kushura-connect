let context;

export function playReactionSound(type) {
  try {
    if (localStorage.getItem('kc-reaction-sounds') === 'off') return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context ||= new Audio();
    const now = context.currentTime;
    const notes = { like: 660, love: 784, care: 587, haha: 740, wow: 880, sad: 494, angry: 392 };
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(notes[type] || 660, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(now); oscillator.stop(now + 0.18);
    context.resume().catch(() => {});
  } catch { /* Audio is optional and may be unavailable in some browsers. */ }
}
