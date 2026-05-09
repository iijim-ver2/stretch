import { UI_STATE, TIMER_STATUS } from '../config/ui.js';

export class UIUpdater {
  constructor(elements, config) {
    this.elements = elements;
    this.config = config;
  }

  update(state, pipManager) {
    if (this.elements.timer.innerText === 'FINISH') return;

    const { timerStatus, isWorking, currentSet } = state;
    const timerText = state.timeLeft.toFixed(1);

    this.elements.timer.innerText = timerText;

    const statusText = this._resolveStatusText(timerStatus, isWorking, currentSet);
    this.elements.status.innerText = statusText;
    this._setContainerStateClass(this._resolveStateClass(timerStatus, isWorking));

    pipManager.update(state, this.config, timerText, statusText);
  }

  showFinished(state, pipManager) {
    this.elements.status.innerText = '完了！お疲れ様でした';
    this.elements.timer.innerText = 'FINISH';
    this.elements.btnToggle.innerText = '最初から';
    this._setContainerStateClass(UI_STATE.STOPPED);
    this.elements.btnShare.classList.remove('hidden');
    this.elements.btnSkip.classList.add('hidden');

    pipManager.update(state, this.config, 'FINISH', '完了！お疲れ様でした');
  }

  setRunning() {
    this.elements.btnToggle.innerText = '一時停止';
    this.elements.btnToggle.classList.remove('is-paused');
    this.elements.btnShare.classList.add('hidden');
    this.elements.btnSkip.classList.remove('hidden');
  }

  setPaused() {
    this.elements.btnToggle.innerText = '再開';
    this.elements.btnToggle.classList.add('is-paused');
  }

  // ─── private ───────────────────────────────────────────

  _resolveStatusText(timerStatus, isWorking, currentSet) {
    if (timerStatus === TIMER_STATUS.IDLE) return '準備完了です';
    if (isWorking) return `ワーク中 (${currentSet + 1}/${this.config.exercises.length})`;

    const nextEx = this.config.exercises[currentSet + 1]?.split(' ')[0] ?? '終了';
    return `休憩中 (次は: ${nextEx})`;
  }

  _resolveStateClass(timerStatus, isWorking) {
    if (timerStatus === TIMER_STATUS.IDLE || timerStatus === TIMER_STATUS.PAUSED) {
      return UI_STATE.STOPPED;
    }
    return isWorking ? UI_STATE.WORK : UI_STATE.REST;
  }

  _setContainerStateClass(className) {
    const { container } = this.elements;
    container.classList.remove(...Object.values(UI_STATE));
    container.classList.add(className);
  }
}