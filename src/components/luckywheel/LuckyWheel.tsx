import { useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LuckyWheelPrize } from "@/services/luckyWheelService";

export interface LuckyWheelProps {
  prizes: LuckyWheelPrize[];
  /** Índice do prêmio sorteado pelo servidor. `null` enquanto não houver resultado. */
  targetIndex: number | null;
  spinning: boolean;
  onSpinEnd: () => void;
  className?: string;
}

const SIZE = 320;
const RADIUS = SIZE / 2;
const FULL_TURNS = 6;

function polarToCartesian(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: RADIUS + radius * Math.cos(rad), y: RADIUS + radius * Math.sin(rad) };
}

function sectorPath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(endAngle, RADIUS - 4);
  const end = polarToCartesian(startAngle, RADIUS - 4);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${RADIUS} ${RADIUS} L ${start.x} ${start.y} A ${RADIUS - 4} ${RADIUS - 4} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

/**
 * Roleta puramente visual: NUNCA decide o prêmio.
 * A animação apenas para no setor que o servidor já sorteou.
 */
export function LuckyWheel({ prizes, targetIndex, spinning, onSpinEnd, className }: LuckyWheelProps) {
  const controls = useAnimation();
  const rotationRef = useRef(0);
  const [animating, setAnimating] = useState(false);
  const lastTargetRef = useRef<number | null>(null);

  const sliceAngle = prizes.length > 0 ? 360 / prizes.length : 360;

  const sectors = useMemo(
    () =>
      prizes.map((prize, index) => {
        const start = index * sliceAngle;
        const end = start + sliceAngle;
        const labelPos = polarToCartesian(start + sliceAngle / 2, RADIUS * 0.62);
        return { prize, start, end, labelPos, path: sectorPath(start, end) };
      }),
    [prizes, sliceAngle],
  );

  // Dispara a animação quando o servidor devolve o índice sorteado.
  if (targetIndex !== null && targetIndex !== lastTargetRef.current && !animating && prizes.length > 0) {
    lastTargetRef.current = targetIndex;
    setAnimating(true);
    const center = targetIndex * sliceAngle + sliceAngle / 2;
    const current = rotationRef.current;
    const base = current - (current % 360);
    const next = base + FULL_TURNS * 360 + (360 - center);
    rotationRef.current = next;
    void controls
      .start({ rotate: next, transition: { duration: 4.2, ease: [0.16, 1, 0.3, 1] } })
      .then(() => {
        setAnimating(false);
        onSpinEnd();
      });
  }

  if (prizes.length === 0) {
    return (
      <div className={cn("flex h-[320px] w-[320px] items-center justify-center rounded-full border-2 border-dashed border-border", className)}>
        <p className="px-8 text-center text-sm text-muted-foreground">Nenhum prêmio configurado ainda.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative mx-auto", className)} style={{ width: SIZE, height: SIZE + 24 }}>
      {/* Ponteiro */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
        <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
      </div>

      <motion.div
        animate={controls}
        style={{ width: SIZE, height: SIZE, marginTop: 12 }}
        className="rounded-full shadow-2xl ring-4 ring-primary/30"
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Roleta da sorte">
          {sectors.map(({ prize, path, labelPos, start }) => (
            <g key={prize.id}>
              <path d={path} fill={prize.color} stroke="hsl(var(--background))" strokeWidth={2} />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill="#fff"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${start + sliceAngle / 2} ${labelPos.x} ${labelPos.y})`}
                style={{ paintOrder: "stroke", pointerEvents: "none" }}
              >
                {prize.label.length > 18 ? `${prize.label.slice(0, 17)}…` : prize.label}
              </text>
            </g>
          ))}
          <circle cx={RADIUS} cy={RADIUS} r={34} fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth={3} />
        </svg>
      </motion.div>

      {/* Núcleo central */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        {spinning || animating ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        ) : (
          <span className="text-2xl" aria-hidden>🎯</span>
        )}
      </div>
    </div>
  );
}