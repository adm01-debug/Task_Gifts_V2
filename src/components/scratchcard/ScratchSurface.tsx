import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ScratchSurfaceProps {
  /** Percentual (0-100) raspado necessário para revelar automaticamente. */
  threshold?: number;
  disabled?: boolean;
  onComplete: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Máscara de raspagem em canvas. Puramente visual: o prêmio já vem sorteado do servidor.
 * Funciona com mouse e toque, com fallback acessível por teclado (Enter/Espaço revelam).
 */
export function ScratchSurface({
  threshold = 45,
  disabled = false,
  onComplete,
  className,
  children,
}: ScratchSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const doneRef = useRef(false);
  const [cleared, setCleared] = useState(false);

  const paintMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "hsl(220 14% 62%)");
    gradient.addColorStop(0.5, "hsl(220 12% 78%)");
    gradient.addColorStop(1, "hsl(220 14% 58%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    paintMask();
    const handleResize = () => {
      if (!doneRef.current) paintMask();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [paintMask]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setCleared(true);
    onComplete();
  }, [onComplete]);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    // Amostragem esparsa: 1 a cada 64 pixels é suficiente e evita travar em telas grandes.
    for (let i = 3; i < data.length; i += 4 * 64) {
      if (data[i] === 0) transparent += 1;
    }
    const total = Math.max(1, Math.ceil(data.length / (4 * 64)));
    if ((transparent / total) * 100 >= threshold) finish();
  }, [finish, threshold]);

  const scratchAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(clientX - rect.left, clientY - rect.top, 22, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || doneRef.current) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    scratchAt(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled || doneRef.current) return;
    scratchAt(event.clientX, event.clientY);
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    measure();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (disabled || doneRef.current) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      finish();
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex h-full w-full items-center justify-center p-6 text-center">{children}</div>
      <canvas
        ref={canvasRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Raspe para revelar o prêmio. Pressione Enter para revelar."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          "absolute inset-0 h-full w-full touch-none transition-opacity duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          cleared ? "pointer-events-none opacity-0" : "cursor-grab",
          disabled && "pointer-events-none",
        )}
      />
    </div>
  );
}