interface TimerDisplayProps {
  statusText: string;
  timerText: string;
}

export function TimerDisplay({ statusText, timerText }: TimerDisplayProps) {
  return (
    <section className="display-section">
      <h1 id="status">{statusText}</h1>
      <div className="timer-text">{timerText}</div>
    </section>
  );
}
