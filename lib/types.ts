export type TimerStatus = "idle" | "running" | "paused";

export interface StretchConfig {
  /** ワーク（運動）時間（秒） */
  workTime: number;
  /** 休憩時間（秒） */
  restTime: number;
  /** ストレッチメニュー一覧 */
  exercises: string[];
}

export interface TimerState {
  timerStatus: TimerStatus;
  /** 残り時間（秒） */
  timeLeft: number;
  /** ワーク中なら true、休憩中なら false */
  isWorking: boolean;
  /** 現在のメニュー番号（0 始まり） */
  currentSet: number;
  /** 全メニュー完了後の表示状態 */
  finished: boolean;
}
