export class ShareManager {
  constructor(config) {
    this.config = config;
  }

  shareOnTwitter() {
    const text = encodeURIComponent(
      `ストレッチを完了しました！ ${this.config.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`,
      '_blank'
    );
  }
}