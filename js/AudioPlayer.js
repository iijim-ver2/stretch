import { AUDIO } from './constants.js';

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
    const isCountdownTarget = [3, 2, 1].includes(currentSeconds);
    const isSecondChanged = currentSeconds !== prevSeconds;
    
    if (isWorking && isSecondChanged && isCountdownTarget) {
      this.playBeep(AUDIO.FREQ_COUNTDOWN, 0.05);
    }
  }

  playBeep(frequency, duration) {
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.frequency.value = frequency;
    
    const currentTime = this.audioCtx.currentTime;
    gainNode.gain.setValueAtTime(1.0, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
  }
}