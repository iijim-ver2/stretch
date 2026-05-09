export class PiPManager {
  constructor(canvasEl, videoEl) {
    this.canvas = canvasEl;
    this.video = videoEl;
    this.ctx = canvasEl.getContext('2d');
  }

  async toggle(btnEl) {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const stream = this.canvas.captureStream(10); // 10fps
        this.video.srcObject = stream;
        await this.video.play();
        await this.video.requestPictureInPicture();
        btnEl.innerText = 'PiPを終了';
      }
    } catch (error) {
      console.error('PiPの起動に失敗しました:', error);
    }
  }

  update(state, config, timerText, statusText) {
    const { width, height } = this.canvas;
    const { isWorking, timerStatus, currentSet } = state;
    const isActive = timerStatus === 'running' && timerText !== 'FINISH';

    const { bg, text: textColor } = this._resolveColors(isActive, isWorking);

    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';

    this.ctx.font = 'bold 80px sans-serif';
    this.ctx.fillText(timerText, width / 2, height / 2 + 20);

    this.ctx.font = '24px sans-serif';
    this.ctx.fillText(statusText, width / 2, 60);

    const currentExercise = config.exercises[currentSet] ?? '完了';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.fillText(currentExercise, width / 2, height - 50);
  }

  // ─── private ───────────────────────────────────────────

  _resolveColors(isActive, isWorking) {
    if (!isActive) return { bg: '#f4f4f9', text: '#333333' };
    return isWorking
      ? { bg: '#e74c3c', text: '#ffffff' }
      : { bg: '#2ecc71', text: '#ffffff' };
  }
}