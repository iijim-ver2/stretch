interface PiPSurfaceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * PiP 用の描画ソース。画面上には表示しない（.pip-resources.hidden）。
 */
export function PiPSurface({ canvasRef, videoRef }: PiPSurfaceProps) {
  return (
    <div className="pip-resources hidden">
      <canvas ref={canvasRef} width={400} height={400} />
      <video ref={videoRef} autoPlay muted playsInline />
    </div>
  );
}
