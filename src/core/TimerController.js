import { AUDIO } from '../config/audio.js';
import { TIMER_STATUS } from '../config/ui.js';

export class TimerController {
  /**
   * @param {object}      state       - StretchTimer の共有状態オブジェクト
   * @param {object}      config      - CONFIG
   * @param {AudioPlayer} audioPlayer
   * @param {object}      callbacks   - { onTick, onFinish, onPhaseChange }
   */
  constructor(state, config, audioPlayer, callbacks) {
    this.state = state;
    this.config = config;
    this.audio = audioPlayer;
    this.callbacks = callbacks;
  }

  start() {
    const isFirstStart = this.state.timerStatus === TIMER_STATUS.IDLE;
    if (isFirstStart) {
      this.audio.playBeep(AUDIO.FREQ_START, 0.2);
    }

    this.state.timerStatus = TIMER_STATUS.RUNNING;
    this.state.lastTickTime = Date.now();
    this.state.timerId = setInterval(() => this._tick(), 100);
  }

  pause() {
    clearInterval(this.state.timerId);
    this.state.timerId = null;
    this.state.timerStatus = TIMER_STATUS.PAUSED;
  }

  skip() {
    if (this.state.timerStatus === TIMER_STATUS.IDLE) return;
    this._switchPhase();
  }

  // ─── private ───────────────────────────────────────────

  _tick() {
    const now = Date.now();
    const deltaTime = (now - this.state.lastTickTime) / 1000;
    this.state.lastTickTime = now;

    const prevSeconds = Math.ceil(this.state.timeLeft);
    this.state.timeLeft = Math.max(0, this.state.timeLeft - deltaTime);
    const currentSeconds = Math.ceil(this.state.timeLeft);

    this.audio.playCountdownSoundIfNeeded(this.state.isWorking, prevSeconds, currentSeconds);

    if (this.state.timeLeft <= 0) {
      this._switchPhase();
    }

    this.callbacks.onTick();
  }

  _switchPhase() {
    this.audio.playBeep(AUDIO.FREQ_PHASE_CHANGE, 0.5);

    if (this.state.isWorking) {
      this.state.isWorking = false;
      this.state.timeLeft = this.config.restTime;
    } else {
      this.state.currentSet++;
      if (this.state.currentSet >= this.config.exercises.length) {
        this._finish();
        return;
      }
      this.state.isWorking = true;
      this.state.timeLeft = this.config.workTime;
    }

    this.state.lastTickTime = Date.now();
    this.callbacks.onPhaseChange();
  }

  _finish() {
    clearInterval(this.state.timerId);
    this.state.timerId = null;
    this.state.timerStatus = TIMER_STATUS.IDLE;

    this.audio.playBeep(AUDIO.FREQ_FINISH, 0.8);
    this.callbacks.onFinish();
  }
}