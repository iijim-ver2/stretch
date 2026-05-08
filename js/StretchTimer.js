import { AUDIO, UI_STATE_CLASSES } from './constants.js';
import { AudioPlayer } from './AudioPlayer.js';
import { PiPManager } from './PiPManager.js';

export class StretchTimer {
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

    this.elements = this.getDOMElements();
    this.audioPlayer = new AudioPlayer();
    this.pipManager = new PiPManager(this.elements.pipCanvas, this.elements.pipVideo);

    this.init();
  }

  getDOMElements() {
    return {
      container: document.getElementById("app-container"),
      status: document.getElementById("status"),
      timer: document.getElementById("timer"),
      btnToggle: document.getElementById("btn-toggle"),
      btnSkip: document.getElementById("btn-skip"),
      btnShare: document.getElementById("btn-share"),
      btnPip: document.getElementById("btn-pip"),
      list: document.getElementById("exercise-list"),
      pipCanvas: document.getElementById("pip-canvas"),
      pipVideo: document.getElementById("pip-video"),
    };
  }

  init() {
    this.renderExerciseList();
    this.updateUI();
    this.bindEvents();
  }

  bindEvents() {
    const { btnToggle, btnSkip, btnPip, btnShare, pipVideo } = this.elements;

    btnToggle.addEventListener("click", () => this.handleToggleClick());
    btnSkip.addEventListener("click", () => this.handleSkipClick());
    btnShare.addEventListener("click", () => this.shareOnTwitter());
    
    btnPip.addEventListener("click", async () => {
      await this.pipManager.toggle(btnPip);
      this.updateUI(); // PiPキャンバスの初期描画用
    });

    pipVideo.addEventListener("leavepictureinpicture", () => {
      btnPip.innerText = "PiPで表示";
    });
  }

  renderExerciseList() {
    const html = this.config.exercises.map((text, index) => {
      const badgeHtml = index === 0 ? '<span class="badge">Next</span>' : '';
      return `
        <li class="exercise-item" id="item-${index}">
          <span>${index + 1}. ${text}</span>
          ${badgeHtml}
        </li>
      `;
    }).join("");

    this.elements.list.innerHTML = html;
    this.updateActiveListItem();
  }

  handleToggleClick() {
    this.audioPlayer.init();

    if (this.state.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
    this.updateUI();
  }

  handleSkipClick() {
    if (!this.state.isRunning && this.state.timerId === null) return;
    this.switchPhase();
    this.updateUI();
  }

  startTimer() {
    if (this.state.timerId === null) {
      this.audioPlayer.playBeep(AUDIO.FREQ_START, 0.2);
      this.elements.btnShare.classList.add("hidden");
      this.elements.btnSkip.classList.remove("hidden");
    }

    this.state.isRunning = true;
    this.state.lastTickTime = Date.now();
    this.state.timerId = setInterval(() => this.tick(), 100);

    this.elements.btnToggle.innerText = "一時停止";
    this.elements.btnToggle.classList.remove("is-paused");
  }

  pauseTimer() {
    clearInterval(this.state.timerId);
    this.state.isRunning = false;
    this.state.timerId = "paused";

    this.elements.btnToggle.innerText = "再開";
    this.elements.btnToggle.classList.add("is-paused");
  }

  tick() {
    const now = Date.now();
    const deltaTime = (now - this.state.lastTickTime) / 1000;
    this.state.lastTickTime = now;

    const prevSeconds = Math.ceil(this.state.timeLeft);
    this.state.timeLeft = Math.max(0, this.state.timeLeft - deltaTime);
    const currentSeconds = Math.ceil(this.state.timeLeft);

    this.audioPlayer.playCountdownSoundIfNeeded(this.state.isWorking, prevSeconds, currentSeconds);

    if (this.state.timeLeft <= 0) {
      this.switchPhase();
    }

    this.updateUI();
  }

  switchPhase() {
    this.audioPlayer.playBeep(AUDIO.FREQ_PHASE_CHANGE, 0.5);

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
    this.updateActiveListItem();
  }

  finishWorkout() {
    clearInterval(this.state.timerId);
    
    this.state.isRunning = false;
    this.state.timerId = null;
    this.state.timeLeft = 0;

    this.audioPlayer.playBeep(AUDIO.FREQ_FINISH, 0.8);

    this.elements.status.innerText = "完了！お疲れ様でした";
    this.elements.timer.innerText = "FINISH";
    this.elements.btnToggle.innerText = "最初から";
    this.setContainerStateClass(UI_STATE_CLASSES.STOPPED);

    this.elements.btnShare.classList.remove("hidden");
    this.elements.btnSkip.classList.add("hidden");

    this.state.currentSet = 0;
    this.state.isWorking = true;
    this.state.timeLeft = this.config.workTime;
    this.updateActiveListItem();
    
    this.pipManager.update(this.state, this.config, "FINISH", "完了！お疲れ様でした");
  }

  updateUI() {
    if (!this.state.isRunning && this.state.timerId === null && this.elements.timer.innerText === "FINISH") {
      return; // 完了時はスキップ
    }

    this.elements.timer.innerText = this.state.timeLeft.toFixed(1);
    const { currentSet, isRunning, timerId, isWorking } = this.state;

    if (!isRunning && timerId === null) {
      this.elements.status.innerText = "準備完了です";
      this.setContainerStateClass(UI_STATE_CLASSES.STOPPED);
    } else if (isWorking) {
      this.elements.status.innerText = `ワーク中 (${currentSet + 1}/${this.config.exercises.length})`;
      this.setContainerStateClass(UI_STATE_CLASSES.WORK);
    } else {
      const nextEx = this.config.exercises[currentSet + 1]?.split(" ")[0] || "終了";
      this.elements.status.innerText = `休憩中 (次は: ${nextEx})`;
      this.setContainerStateClass(UI_STATE_CLASSES.REST);
    }

    this.pipManager.update(this.state, this.config, this.elements.timer.innerText, this.elements.status.innerText);
  }

  setContainerStateClass(className) {
    const { container } = this.elements;
    container.classList.remove(...Object.values(UI_STATE_CLASSES));
    container.classList.add(className);
  }

  updateActiveListItem() {
    document.querySelectorAll(".exercise-item").forEach((el) => {
      el.classList.remove("is-active");
      el.querySelector(".badge")?.remove();
    });

    const currentEl = document.getElementById(`item-${this.state.currentSet}`);
    if (currentEl) {
      currentEl.classList.add("is-active");
      currentEl.insertAdjacentHTML("beforeend", '<span class="badge">Now</span>');
      currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  shareOnTwitter() {
    const text = encodeURIComponent(
      `ストレッチを完了しました！ ${this.config.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  }
}