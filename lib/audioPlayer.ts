import { AUDIO } from "./constants";

/**
 * Web Audio API を使ったビープ音の再生を担当するクラス。
 * ユーザー操作後に init() を呼ぶことで AudioContext を起動する。
 */
export class AudioPlayer {
  private audioCtx: AudioContext | null = null;

  init(): void {
    if (!this.audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.audioCtx = new Ctor();
    }
    if (this.audioCtx.state === "suspended") {
      void this.audioCtx.resume();
    }
  }

  playCountdownSoundIfNeeded(
    isWorking: boolean,
    prevSeconds: number,
    currentSeconds: number,
  ): void {
    const secondChanged = currentSeconds !== prevSeconds;
    const isCountdownBeat = [3, 2, 1].includes(currentSeconds);

    if (isWorking && secondChanged && isCountdownBeat) {
      this.playBeep(AUDIO.FREQ_COUNTDOWN, 0.05);
    }
  }

  playBeep(frequency: number, duration: number): void {
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
