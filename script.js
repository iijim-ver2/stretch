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
    "脚真横同じ手",
    "脚真横同じ手逆",
    "脚真横反対手",
    "脚真横反対手逆",
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
  currentSet: 0, // 現在のセット番号 (0〜10)
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
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

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
  if (state.timerId === null && !state.isRunning) return;
  switchPhase();
  updateDisplay();
}

function toggleTimer() {
  // AudioContextの再開（ブラウザ制限対策）
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (state.isRunning) {
    // 一時停止処理
    clearInterval(state.timerId);
    state.isRunning = false;
    els.btn.innerText = "再開";
    els.btn.classList.add("paused");
  } else {
    // 開始・再開処理
    if (state.timerId === null) {
      beep(660, 0.2); // 初回開始音
      els.shareBtn.style.display = "none";
      els.skipBtn.style.display = "block";
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
    // ワーク終了 -> 休憩
    state.isWorking = false;
    state.timeLeft = CONFIG.restTime;
  } else {
    // 休憩終了 -> 次のワークへ
    state.isWorking = true;
    state.timeLeft = CONFIG.workTime;
    state.currentSet++;

    // 全セット終了チェック
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
  els.shareBtn.style.display = "block";
  els.skipBtn.style.display = "none";
  beep(1000, 0.8);

  // リセット処理
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

// ---------------------------------------------------------
// 表示更新
// ---------------------------------------------------------
function updateDisplay() {
  if (!state.isRunning && state.timerId === null) {
    updateCanvas();
    return;
  }

  els.timer.innerText = state.timeLeft.toFixed(1);

  if (state.isWorking) {
    els.status.innerText = `ワーク中 (${state.currentSet + 1}/${CONFIG.exercises.length})`;
    els.container.className = "container state-work";
  } else {
    els.status.innerText =
      "休憩中 (次は: " +
      (CONFIG.exercises[state.currentSet + 1] ? CONFIG.exercises[state.currentSet + 1].split(" ")[0] : "終了") +
      ")";
    els.container.className = "container state-rest";
  }
  updateCanvas();
}

function updateActiveItem() {
  // 全てのアイテムのactiveクラスを削除
  document.querySelectorAll(".exercise-item").forEach((el) => {
    el.classList.remove("active");
    const badge = el.querySelector(".badge");
    if (badge) badge.remove();
  });

  // 現在のアイテムをハイライト
  const currentEl = document.getElementById(`item-${state.currentSet}`);
  if (currentEl) {
    currentEl.classList.add("active");
    currentEl.insertAdjacentHTML("beforeend", '<span class="badge">Now</span>');

    // スクロールして表示位置を調整
    currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ---------------------------------------------------------
// PiP (Picture-in-Picture) 処理
// ---------------------------------------------------------
async function togglePiP() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      // キャンバスをストリームに変換
      const stream = els.pipCanvas.captureStream(10);
      els.pipVideo.srcObject = stream;
      await els.pipVideo.play();
      await els.pipVideo.requestPictureInPicture();
      els.pipBtn.innerText = "PiPを終了";
      updateCanvas();
    }
  } catch (error) {
    console.error("PiP error:", error);
    alert("このブラウザはPiPに対応していないか、エラーが発生しました。");
  }
}

function updateCanvas() {
  const ctx = els.pipCanvas.getContext("2d");
  const w = els.pipCanvas.width;
  const h = els.pipCanvas.height;

  // 背景色
  let bgColor = "#f4f4f9";
  let textColor = "#333";
  if (state.isRunning || state.timerId !== null) {
    if (state.isWorking) {
      bgColor = "#e74c3c"; // ワーク色
      textColor = "#fff";
    } else {
      bgColor = "#2ecc71"; // 休憩色
      textColor = "#fff";
    }
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // テキスト描画
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";

  // タイマー
  ctx.font = "bold 100px sans-serif";
  ctx.fillText(els.timer.innerText, w / 2, h / 2 + 20);

  // ステータス（上部）
  ctx.font = "30px sans-serif";
  ctx.fillText(els.status.innerText, w / 2, 80);

  // 種目名（下部）
  const exercise = CONFIG.exercises[state.currentSet] || "完了";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(exercise, w / 2, h - 60);
}

// ---------------------------------------------------------
// 音声ユーティリティ
// ---------------------------------------------------------
function beep(freq, duration) {
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

// 実行
init();
