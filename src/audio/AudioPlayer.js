import { AUDIO } from "../config/audio.js";

export class AudioPlayer {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  playCountdownSoundIfNeeded(isWorking, prevSeconds, currentSeconds) {
    const secondChanged = currentSeconds !== prevSeconds;
    const isCountdownBeat = [3, 2, 1].includes(currentSeconds);

    if (isWorking && secondChanged && isCountdownBeat) {
      this.playBeep(AUDIO.FREQ_COUNTDOWN, 0.05);
    }
  }

  playBeep(frequency, duration) {
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const { currentTime } = this.audioCtx;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(1.0, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
  }
}
