/**
 * ストレッチタイマーアプリケーション
 */
class StretchTimer {
  constructor(config) {
    this.config = config;
    this.state = {
      timerId: null,
      timeLeft: config.workTime,
      isWorking: true,
      isRunning: false,
      currentSet: 0,
      lastTickTime: null,
    };

    this.audioCtx = null;

    // DOM要素の取得
    this.els = {
      container: document.getElementById("app-container"),
      status: document.getElementById("status"),
      timer: document.getElementById("timer"),
      btn: document.getElementById("btn"),
      skipBtn: document.getElementById("skip-btn"),
      shareBtn: document.getElementById("share-btn"),
      list: document.getElementById("exercise-list"),
      pipBtn: document.getElementById("pip-btn"),
      pipCanvas: document.getElementById("pip-canvas"),
      pipVideo: document.getElementById("pip-video"),
    };

    this.init();
  }

  init() {
    this.renderList();
    this.updateDisplay();
    this.bindEvents();
  }

  bindEvents() {
    this.els.btn.addEventListener("click", () => this.toggleTimer());
    this.els.skipBtn.addEventListener("click", () => this.skipPhase());
    this.els.pipBtn.addEventListener("click", () => this.togglePiP());
    this.els.shareBtn.addEventListener("click", () => this.shareOnTwitter());

    this.els.pipVideo.addEventListener("leavepictureinpicture", () => {
      this.els.pipBtn.innerText = "PiPで表示";
    });
  }

  renderList() {
    this.els.list.innerHTML = this.config.exercises
      .map(
        (text, index) => `
        <li class="exercise-item" id="item-${index}">
          <span>${index + 1}. ${text}</span>
          ${index === 0 ? '<span class="badge">Next</span>' : ""}
        </li>
      `,
      )
      .join("");
    this.updateActiveItem();
  }

  /**
   * タイマーの開始/停止を切り替える
   */
  toggleTimer() {
    this.initAudio();

    if (this.state.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
    this.updateDisplay();
  }

  initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  startTimer() {
    if (this.state.timerId === null) {
      this.beep(660, 0.2); // 開始音
      this.els.shareBtn.classList.add("hidden");
      this.els.skipBtn.classList.remove("hidden");
    }

    this.state.isRunning = true;
    this.els.btn.innerText = "一時停止";
    this.els.btn.classList.remove("paused");

    this.state.lastTickTime = Date.now();
    this.state.timerId = setInterval(() => this.tick(), 100);
  }

  pauseTimer() {
    clearInterval(this.state.timerId);
    this.state.timerId = "paused";
    this.state.isRunning = false;
    this.els.btn.innerText = "再開";
    this.els.btn.classList.add("paused");
  }

  tick() {
    const now = Date.now();
    const deltaTime = (now - this.state.lastTickTime) / 1000;
    this.state.lastTickTime = now;

    const prevSeconds = Math.ceil(this.state.timeLeft);
    this.state.timeLeft = Math.max(0, this.state.timeLeft - deltaTime);
    const currentSeconds = Math.ceil(this.state.timeLeft);

    // カウントダウン音 (3, 2, 1秒前)
    if (this.state.isWorking && currentSeconds !== prevSeconds && [3, 2, 1].includes(currentSeconds)) {
      this.beep(440, 0.05);
    }

    if (this.state.timeLeft <= 0) {
      this.switchPhase();
    }

    this.updateDisplay();
  }

  skipPhase() {
    if (!this.state.isRunning && this.state.timerId === null) return;
    this.switchPhase();
    this.updateDisplay();
  }

  switchPhase() {
    this.beep(880, 0.5);

    if (this.state.isWorking) {
      this.state.isWorking = false;
      this.state.timeLeft = this.config.restTime;
    } else {
      this.state.isWorking = true;
      this.state.timeLeft = this.config.workTime;
      this.state.currentSet++;

      if (this.state.currentSet >= this.config.exercises.length) {
        this.finishWorkout();
        return;
      }
    }
    this.state.lastTickTime = Date.now();
    this.updateActiveItem();
  }

  finishWorkout() {
    clearInterval(this.state.timerId);
    this.state.isRunning = false;
    this.state.timerId = null;
    this.state.timeLeft = 0;

    this.els.status.innerText = "完了！お疲れ様でした";
    this.els.timer.innerText = "FINISH";
    this.els.btn.innerText = "最初から";
    this.els.container.className = "container state-stopped";

    this.els.shareBtn.classList.remove("hidden");
    this.els.skipBtn.classList.add("hidden");

    this.beep(1000, 0.8);

    // リセット準備
    this.state.currentSet = 0;
    this.state.isWorking = true;
    this.state.timeLeft = this.config.workTime;
    this.updateActiveItem();
  }

  updateDisplay() {
    this.els.timer.innerText = this.state.timeLeft.toFixed(1);

    if (!this.state.isRunning && this.state.timerId === null) {
      this.els.status.innerText = "準備完了です";
      this.els.container.className = "container state-stopped";
    } else if (this.state.isWorking) {
      this.els.status.innerText = `ワーク中 (${this.state.currentSet + 1}/${this.config.exercises.length})`;
      this.els.container.className = "container state-work";
    } else {
      const nextEx = this.config.exercises[this.state.currentSet + 1]
        ? this.config.exercises[this.state.currentSet + 1].split(" ")[0]
        : "終了";
      this.els.status.innerText = `休憩中 (次は: ${nextEx})`;
      this.els.container.className = "container state-rest";
    }
    this.updateCanvas();
  }

  updateActiveItem() {
    document.querySelectorAll(".exercise-item").forEach((el) => {
      el.classList.remove("active");
      const badge = el.querySelector(".badge");
      if (badge) badge.remove();
    });

    const currentEl = document.getElementById(`item-${this.state.currentSet}`);
    if (currentEl) {
      currentEl.classList.add("active");
      currentEl.insertAdjacentHTML("beforeend", '<span class="badge">Now</span>');
      currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const stream = this.els.pipCanvas.captureStream(10);
        this.els.pipVideo.srcObject = stream;
        await this.els.pipVideo.play();
        await this.els.pipVideo.requestPictureInPicture();
        this.els.pipBtn.innerText = "PiPを終了";
        this.updateCanvas();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  }

  updateCanvas() {
    const ctx = this.els.pipCanvas.getContext("2d");
    const { width: w, height: h } = this.els.pipCanvas;

    let bgColor = "#f4f4f9";
    let textColor = "#333";

    if (this.state.timerId !== null) {
      bgColor = this.state.isWorking ? "#e74c3c" : "#2ecc71";
      textColor = "#fff";
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";

    ctx.font = "bold 80px sans-serif";
    ctx.fillText(this.els.timer.innerText, w / 2, h / 2 + 20);

    ctx.font = "24px sans-serif";
    ctx.fillText(this.els.status.innerText, w / 2, 60);

    const exercise = this.config.exercises[this.state.currentSet] || "完了";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(exercise, w / 2, h - 50);
  }

  beep(freq, duration) {
    if (!this.audioCtx) return;
    const o = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    o.connect(g);
    g.connect(this.audioCtx.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    o.start();
    o.stop(this.audioCtx.currentTime + duration);
  }

  shareOnTwitter() {
    const text = encodeURIComponent(
      `ストレッチを完了しました！ #${this.config.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`,
    );
    const url = encodeURIComponent(window.location.href);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, "_blank");
  }
}

// 設定データ
const CONFIG = {
  workTime: 30,
  restTime: 7,
  exercises: [
    "尻足反対",
    "尻足反対 逆",
    "尻あぐら",
    "尻あぐら逆",
    "片足前屈",
    "片足前屈逆",
    "45度右",
    "45度左",
    "前屈",
    "脚真横 同じ手",
    "脚真横 同じ手 逆",
    "脚真横 反対手",
    "脚真横 反対手 逆",
    "両足合わせ",
    "開脚ほぐし",
    "肘開脚",
    "開脚",
    "開脚2",
  ],
};

// アプリケーションの起動
document.addEventListener("DOMContentLoaded", () => {
  new StretchTimer(CONFIG);
});
