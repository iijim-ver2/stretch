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

// アプリケーションの状態管理
const state = {
  timerId: null,
  timeLeft: CONFIG.workTime,
  isWorking: true, // true: ワーク中, false: 休憩中
  isRunning: false, // タイマーが動いているか
  currentSet: 0, // 現在のセット番号
};

// DOM要素
const els = {
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

// 音声コンテキスト
let audioCtx = null;

// ---------------------------------------------------------
// 初期化処理
// ---------------------------------------------------------
function init() {
  renderList();
  updateDisplay();

  els.btn.onclick = toggleTimer;
  els.skipBtn.onclick = skipPhase;
  els.pipBtn.onclick = togglePiP;
  els.shareBtn.onclick = shareOnTwitter;

  // PiP終了時のイベント
  els.pipVideo.addEventListener("leavepictureinpicture", () => {
    els.pipBtn.innerText = "PiPで表示";
  });
}

// リストの描画
function renderList() {
  els.list.innerHTML = CONFIG.exercises
    .map(
      (text, index) => `
          <li class="exercise-item" id="item-${index}">
              <span>${index + 1}. ${text}</span>
              ${index === 0 ? '<span class="badge">Next</span>' : ""}
          </li>
      `,
    )
    .join("");
  updateActiveItem();
}

// ---------------------------------------------------------
// タイマーロジック
// ---------------------------------------------------------
function skipPhase() {
  if (!state.isRunning && state.timerId === null) return;
  switchPhase();
  updateDisplay();
}

function toggleTimer() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (state.isRunning) {
    // 一時停止処理
    clearInterval(state.timerId);
    state.timerId = "paused"; // null以外にして「開始済み」を表現
    state.isRunning = false;
    els.btn.innerText = "再開";
    els.btn.classList.add("paused");
  } else {
    // 開始・再開処理
    if (state.timerId === null) {
      beep(660, 0.2); // 初回開始音
      els.shareBtn.style.display = "none";
      els.skipBtn.style.display = "inline-block";
    }

    state.isRunning = true;
    els.btn.innerText = "一時停止";
    els.btn.classList.remove("paused");

    // 100msごとに実行
    state.timerId = setInterval(tick, 100);
  }
  updateDisplay();
}

function tick() {
  state.timeLeft = Math.round((state.timeLeft - 0.1) * 10) / 10;

  // カウントダウン音 (3, 2, 1秒前)
  if (
    state.isWorking &&
    [3, 2, 1].includes(Math.ceil(state.timeLeft)) &&
    Math.round(state.timeLeft * 10) % 10 === 0
  ) {
    beep(440, 0.05);
  }

  // タイマー終了時の処理
  if (state.timeLeft <= 0) {
    switchPhase();
  }

  updateDisplay();
}

function switchPhase() {
  beep(880, 0.5); // 切り替え音

  if (state.isWorking) {
    state.isWorking = false;
    state.timeLeft = CONFIG.restTime;
  } else {
    state.isWorking = true;
    state.timeLeft = CONFIG.workTime;
    state.currentSet++;

    if (state.currentSet >= CONFIG.exercises.length) {
      finishWorkout();
      return;
    }
  }
  updateActiveItem();
}

function finishWorkout() {
  clearInterval(state.timerId);
  state.isRunning = false;
  state.timerId = null;
  state.timeLeft = 0;
  els.status.innerText = "完了！お疲れ様でした";
  els.timer.innerText = "FINISH";
  els.btn.innerText = "最初から";
  els.container.className = "container state-stopped";
  els.shareBtn.style.display = "inline-block";
  els.skipBtn.style.display = "none";
  beep(1000, 0.8);

  state.currentSet = 0;
  state.isWorking = true;
  state.timeLeft = CONFIG.workTime;
  updateActiveItem();
}

function shareOnTwitter() {
  const text = encodeURIComponent(`ストレッチを完了しました！ #${CONFIG.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`);
  const url = encodeURIComponent(window.location.href);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  window.open(twitterUrl, "_blank");
}

function updateDisplay() {
  els.timer.innerText = state.timeLeft.toFixed(1);

  if (!state.isRunning && state.timerId === null) {
    els.status.innerText = "準備完了です";
    els.container.className = "container state-stopped";
  } else if (state.isWorking) {
    els.status.innerText = `ワーク中 (${state.currentSet + 1}/${CONFIG.exercises.length})`;
    els.container.className = "container state-work";
  } else {
    const nextEx = CONFIG.exercises[state.currentSet + 1] ? CONFIG.exercises[state.currentSet + 1].split(" ")[0] : "終了";
    els.status.innerText = `休憩中 (次は: ${nextEx})`;
    els.container.className = "container state-rest";
  }
  updateCanvas();
}

function updateActiveItem() {
  document.querySelectorAll(".exercise-item").forEach((el) => {
    el.classList.remove("active");
    const badge = el.querySelector(".badge");
    if (badge) badge.remove();
  });

  const currentEl = document.getElementById(`item-${state.currentSet}`);
  if (currentEl) {
    currentEl.classList.add("active");
    currentEl.insertAdjacentHTML("beforeend", '<span class="badge">Now</span>');
    currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

async function togglePiP() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      const stream = els.pipCanvas.captureStream(10);
      els.pipVideo.srcObject = stream;
      await els.pipVideo.play();
      await els.pipVideo.requestPictureInPicture();
      els.pipBtn.innerText = "PiPを終了";
      updateCanvas();
    }
  } catch (error) {
    console.error("PiP error:", error);
    alert("PiPエラーが発生しました。");
  }
}

function updateCanvas() {
  const ctx = els.pipCanvas.getContext("2d");
  const w = els.pipCanvas.width;
  const h = els.pipCanvas.height;

  let bgColor = "#f4f4f9";
  let textColor = "#333";

  if (state.timerId !== null) {
    if (state.isWorking) {
      bgColor = "#e74c3c";
      textColor = "#fff";
    } else {
      bgColor = "#2ecc71";
      textColor = "#fff";
    }
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";

  ctx.font = "bold 80px sans-serif";
  ctx.fillText(els.timer.innerText, w / 2, h / 2 + 20);

  ctx.font = "24px sans-serif";
  ctx.fillText(els.status.innerText, w / 2, 60);

  const exercise = CONFIG.exercises[state.currentSet] || "完了";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(exercise, w / 2, h - 50);
}

function beep(freq, duration) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  o.frequency.value = freq;
  g.gain.setValueAtTime(1.0, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  o.start();
  o.stop(audioCtx.currentTime + duration);
}

init();
