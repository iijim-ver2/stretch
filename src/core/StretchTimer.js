import { TIMER_STATUS }    from '../config/ui.js';
import { AudioPlayer }     from '../audio/AudioPlayer.js';
import { ExerciseList }    from '../ui/ExerciseList.js';
import { PiPManager }      from '../ui/PiPManager.js';
import { ShareManager }    from '../ui/ShareManager.js';
import { TimerController } from './TimerController.js';
import { UIUpdater }       from '../ui/UIUpdater.js';

export class StretchTimer {
  constructor(config) {
    this.config = config;

    this.state = {
      timerStatus: TIMER_STATUS.IDLE,
      timerId: null,
      timeLeft: config.workTime,
      isWorking: true,
      currentSet: 0,
      lastTickTime: null,
    };

    this.elements = this._getDOMElements();
    this._initServices();
    this._init();
  }

  // ─── 初期化 ────────────────────────────────────────────

  _getDOMElements() {
    return {
      container: document.getElementById('app-container'),
      status:    document.getElementById('status'),
      timer:     document.getElementById('timer'),
      btnToggle: document.getElementById('btn-toggle'),
      btnSkip:   document.getElementById('btn-skip'),
      btnShare:  document.getElementById('btn-share'),
      btnPip:    document.getElementById('btn-pip'),
      list:      document.getElementById('exercise-list'),
      pipCanvas: document.getElementById('pip-canvas'),
      pipVideo:  document.getElementById('pip-video'),
    };
  }

  _initServices() {
    const { elements, config, state } = this;

    this.audioPlayer  = new AudioPlayer();
    this.pipManager   = new PiPManager(elements.pipCanvas, elements.pipVideo);
    this.exerciseList = new ExerciseList(elements.list, config.exercises);
    this.uiUpdater    = new UIUpdater(elements, config);
    this.shareManager = new ShareManager(config);
    this.controller   = new TimerController(state, config, this.audioPlayer, {
      onTick:        () => this.uiUpdater.update(state, this.pipManager),
      onPhaseChange: () => this.exerciseList.setActive(state.currentSet),
      onFinish:      () => this._handleFinish(),
    });
  }

  _init() {
    this.exerciseList.render();
    this.uiUpdater.update(this.state, this.pipManager);
    this._bindEvents();
  }

  _bindEvents() {
    const { btnToggle, btnSkip, btnPip, btnShare, pipVideo } = this.elements;

    btnToggle.addEventListener('click', () => this._handleToggleClick());
    btnSkip.addEventListener('click',   () => this._handleSkipClick());
    btnShare.addEventListener('click',  () => this.shareManager.shareOnTwitter());

    btnPip.addEventListener('click', async () => {
      await this.pipManager.toggle(btnPip);
      this.uiUpdater.update(this.state, this.pipManager); // PiPキャンバスの初期描画
    });

    pipVideo.addEventListener('leavepictureinpicture', () => {
      btnPip.innerText = 'PiPで表示';
    });
  }

  // ─── イベントハンドラ ──────────────────────────────────

  _handleToggleClick() {
    this.audioPlayer.init();

    if (this.state.timerStatus === TIMER_STATUS.RUNNING) {
      this.controller.pause();
      this.uiUpdater.setPaused();
    } else {
      const isFirstStart = this.state.timerStatus === TIMER_STATUS.IDLE;
      this.controller.start();
      if (isFirstStart) this.uiUpdater.setRunning();
      else               this.uiUpdater.setRunning();
    }

    this.uiUpdater.update(this.state, this.pipManager);
  }

  _handleSkipClick() {
    this.controller.skip();
    this.uiUpdater.update(this.state, this.pipManager);
  }

  _handleFinish() {
    this._resetState();
    this.uiUpdater.showFinished(this.state, this.pipManager);
    this.exerciseList.setActive(this.state.currentSet);
  }

  // ─── 状態リセット ──────────────────────────────────────

  _resetState() {
    this.state.currentSet = 0;
    this.state.isWorking  = true;
    this.state.timeLeft   = this.config.workTime;
  }
}