import type { StretchConfig } from "./types";

export function shareOnTwitter(config: StretchConfig): void {
  const text = encodeURIComponent(
    `ストレッチを完了しました！ ${config.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`,
  );
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(
      window.location.href,
    )}`,
    "_blank",
  );
}
