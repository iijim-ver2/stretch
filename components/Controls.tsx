interface ControlsProps {
  toggleLabel: string;
  isPaused: boolean;
  showSkip: boolean;
  showShare: boolean;
  pipLabel: string;
  onToggle: () => void;
  onSkip: () => void;
  onShare: () => void;
  onTogglePip: () => void;
}

export function Controls({
  toggleLabel,
  isPaused,
  showSkip,
  showShare,
  pipLabel,
  onToggle,
  onSkip,
  onShare,
  onTogglePip,
}: ControlsProps) {
  return (
    <section className="controls-section">
      <div className="main-controls">
        <button
          type="button"
          className={isPaused ? "is-paused" : undefined}
          onClick={onToggle}
        >
          {toggleLabel}
        </button>
        {showSkip && (
          <button type="button" className="btn-skip" onClick={onSkip}>
            スキップ
          </button>
        )}
        {showShare && (
          <button type="button" className="btn-share" onClick={onShare}>
            Twitterに投稿
          </button>
        )}
      </div>
      <button type="button" className="btn-secondary" onClick={onTogglePip}>
        {pipLabel}
      </button>
    </section>
  );
}
