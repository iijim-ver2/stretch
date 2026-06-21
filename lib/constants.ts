export const AUDIO = {
  FREQ_START: 660,
  FREQ_COUNTDOWN: 440,
  FREQ_PHASE_CHANGE: 880,
  FREQ_FINISH: 1000,
} as const;

export const UI_STATE = {
  STOPPED: "state-stopped",
  WORK: "state-work",
  REST: "state-rest",
} as const;

export type UiStateClass = (typeof UI_STATE)[keyof typeof UI_STATE];
