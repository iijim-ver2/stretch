import { UI_STATE, type UiStateClass } from "./constants";
import type { StretchConfig, TimerState } from "./types";

/** タイマーに表示する文字列（完了時は "FINISH"） */
export function resolveTimerText(state: TimerState): string {
  return state.finished ? "FINISH" : state.timeLeft.toFixed(1);
}

/** ステータス見出しに表示する文字列 */
export function resolveStatusText(
  state: TimerState,
  config: StretchConfig,
): string {
  if (state.finished) return "完了！お疲れ様でした";
  if (state.timerStatus === "idle") return "準備完了です";

  if (state.isWorking) {
    return `ワーク中 (${state.currentSet + 1}/${config.exercises.length})`;
  }

  const nextEx =
    config.exercises[state.currentSet + 1]?.split(" ")[0] ?? "終了";
  return `休憩中 (次は: ${nextEx})`;
}

/** コンテナに付与する状態クラス */
export function resolveStateClass(state: TimerState): UiStateClass {
  if (
    state.finished ||
    state.timerStatus === "idle" ||
    state.timerStatus === "paused"
  ) {
    return UI_STATE.STOPPED;
  }
  return state.isWorking ? UI_STATE.WORK : UI_STATE.REST;
}
