"use client";

import { useEffect } from "react";
import { Controls } from "@/components/Controls";
import { ExerciseList } from "@/components/ExerciseList";
import { PiPSurface } from "@/components/PiPSurface";
import { TimerDisplay } from "@/components/TimerDisplay";
import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { useStretchTimer } from "@/hooks/useStretchTimer";
import { CONFIG } from "@/lib/config";
import {
  resolveStateClass,
  resolveStatusText,
  resolveTimerText,
} from "@/lib/display";

export function StretchTimer() {
  const { state, toggle, skip, share } = useStretchTimer(CONFIG);
  const pip = usePictureInPicture(CONFIG);

  // 状態が変わるたびに PiP の canvas を再描画
  useEffect(() => {
    pip.draw(state);
  }, [state, pip]);

  const statusText = resolveStatusText(state, CONFIG);
  const timerText = resolveTimerText(state);
  const stateClass = resolveStateClass(state);

  const isRunning = state.timerStatus === "running";
  const isPaused = state.timerStatus === "paused";

  const toggleLabel = state.finished
    ? "最初から"
    : isRunning
      ? "一時停止"
      : isPaused
        ? "再開"
        : "スタート";

  const showSkip = isRunning || isPaused;
  const showShare = state.finished;
  const pipLabel = pip.isActive ? "PiPを終了" : "PiPで表示";

  return (
    <>
      <main className={`container ${stateClass}`}>
        <TimerDisplay statusText={statusText} timerText={timerText} />
        <Controls
          toggleLabel={toggleLabel}
          isPaused={isPaused}
          showSkip={showSkip}
          showShare={showShare}
          pipLabel={pipLabel}
          onToggle={toggle}
          onSkip={skip}
          onShare={share}
          onTogglePip={pip.toggle}
        />
        <ExerciseList
          exercises={CONFIG.exercises}
          currentSet={state.currentSet}
        />
      </main>

      <PiPSurface canvasRef={pip.canvasRef} videoRef={pip.videoRef} />
    </>
  );
}
