"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/lib/audioPlayer";
import { AUDIO } from "@/lib/constants";
import { shareOnTwitter } from "@/lib/share";
import type { StretchConfig, TimerState } from "@/lib/types";

const TICK_INTERVAL_MS = 100;

function createInitialState(config: StretchConfig): TimerState {
  return {
    timerStatus: "idle",
    timeLeft: config.workTime,
    isWorking: true,
    currentSet: 0,
    finished: false,
  };
}

export interface StretchTimerApi {
  state: TimerState;
  toggle: () => void;
  skip: () => void;
  share: () => void;
}

/**
 * ワーク／休憩を繰り返すストレッチタイマーのロジック。
 *
 * 実行中の値は `engineRef`（ミュータブルな真の状態）で保持し、
 * 各 tick で React の state へ反映して再描画をトリガーする。
 */
export function useStretchTimer(config: StretchConfig): StretchTimerApi {
  const [state, setState] = useState<TimerState>(() =>
    createInitialState(config),
  );

  const audioRef = useRef<AudioPlayer | null>(null);
  if (audioRef.current === null) {
    audioRef.current = new AudioPlayer();
  }

  const engineRef = useRef<TimerState>(state);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const sync = useCallback(() => {
    setState({ ...engineRef.current });
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    const e = engineRef.current;
    e.currentSet = 0;
    e.isWorking = true;
    e.timeLeft = config.workTime;
    e.timerStatus = "idle";
    e.finished = true;
    audioRef.current?.playBeep(AUDIO.FREQ_FINISH, 0.8);
  }, [clearTimer, config.workTime]);

  const switchPhase = useCallback(() => {
    const e = engineRef.current;
    audioRef.current?.playBeep(AUDIO.FREQ_PHASE_CHANGE, 0.5);

    if (e.isWorking) {
      e.isWorking = false;
      e.timeLeft = config.restTime;
    } else {
      e.currentSet += 1;
      if (e.currentSet >= config.exercises.length) {
        finish();
        return;
      }
      e.isWorking = true;
      e.timeLeft = config.workTime;
    }

    lastTickRef.current = Date.now();
  }, [config.restTime, config.workTime, config.exercises.length, finish]);

  const tick = useCallback(() => {
    const e = engineRef.current;
    const now = Date.now();
    const deltaTime = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    const prevSeconds = Math.ceil(e.timeLeft);
    e.timeLeft = Math.max(0, e.timeLeft - deltaTime);
    const currentSeconds = Math.ceil(e.timeLeft);

    audioRef.current?.playCountdownSoundIfNeeded(
      e.isWorking,
      prevSeconds,
      currentSeconds,
    );

    if (e.timeLeft <= 0) {
      switchPhase();
    }

    sync();
  }, [switchPhase, sync]);

  const start = useCallback(() => {
    const e = engineRef.current;
    const isFirstStart = e.timerStatus === "idle";

    if (isFirstStart) {
      e.finished = false;
      audioRef.current?.playBeep(AUDIO.FREQ_START, 0.2);
    }

    e.timerStatus = "running";
    lastTickRef.current = Date.now();

    clearTimer();
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    sync();
  }, [clearTimer, sync, tick]);

  const pause = useCallback(() => {
    clearTimer();
    engineRef.current.timerStatus = "paused";
    sync();
  }, [clearTimer, sync]);

  const toggle = useCallback(() => {
    audioRef.current?.init();
    if (engineRef.current.timerStatus === "running") {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const skip = useCallback(() => {
    if (engineRef.current.timerStatus === "idle") return;
    switchPhase();
    sync();
  }, [switchPhase, sync]);

  const share = useCallback(() => {
    shareOnTwitter(config);
  }, [config]);

  // アンマウント時にインターバルを後始末
  useEffect(() => clearTimer, [clearTimer]);

  return { state, toggle, skip, share };
}
