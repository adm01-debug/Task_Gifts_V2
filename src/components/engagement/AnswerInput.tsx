import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EngagementAnswerFormat } from "@/services/continuousEngagementService";

export interface AnswerInputProps {
  format: EngagementAnswerFormat;
  options: string[];
  /** Chamado sempre que o usuário produz um valor válido para o formato. */
  onChange: (value: unknown) => void;
  value: unknown;
}

const EMOJIS = ["😞", "🙁", "😐", "🙂", "😄"];
const EMOJI_LABELS = ["Muito ruim", "Ruim", "Neutro", "Bom", "Excelente"];

export function AnswerInput({ format, options, onChange, value }: AnswerInputProps) {
  switch (format) {
    case "slider":
      return <SliderAnswer value={value} onChange={onChange} />;
    case "percentage":
      return <SliderAnswer value={value} onChange={onChange} max={100} suffix="%" step={5} />;
    case "stars":
      return <StarsAnswer value={value} onChange={onChange} />;
    case "emoji":
      return <EmojiAnswer value={value} onChange={onChange} />;
    case "cards":
      return <CardsAnswer options={options} value={value} onChange={onChange} />;
    case "checkbox":
      return <BooleanAnswer value={value} onChange={onChange} />;
    case "text":
      return <TextAnswer value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function SliderAnswer({
  value,
  onChange,
  max = 10,
  step = 1,
  suffix = "",
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const current = typeof value === "number" ? value : Math.round(max / 2);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-4xl font-bold text-primary tabular-nums">
          {current}
          {suffix}
        </span>
      </div>
      <Slider
        value={[current]}
        min={0}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label="Nota da resposta"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Discordo totalmente</span>
        <span>Concordo totalmente</span>
      </div>
    </div>
  );
}

function StarsAnswer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const current = typeof value === "number" ? value : 0;
  const active = hover ?? current;

  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Avaliação em estrelas">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={current === n}
          aria-label={`${n} de 5 estrelas`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          className="min-h-11 min-w-11 rounded-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              "mx-auto h-9 w-9 transition-colors",
              n <= active ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function EmojiAnswer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const current = typeof value === "number" ? value : 0;
  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Como você se sente">
      {EMOJIS.map((emoji, index) => {
        const n = index + 1;
        return (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={current === n}
            aria-label={EMOJI_LABELS[index]}
            onClick={() => onChange(n)}
            className={cn(
              "flex min-h-14 min-w-14 items-center justify-center rounded-2xl border text-3xl transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === n
                ? "border-primary bg-primary/10 scale-110"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

function CardsAnswer({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const list = options.length > 0 ? options : ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];
  const current = typeof value === "number" ? value : -1;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Escolha uma opção">
      {list.map((label, index) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={current === index}
          onClick={() => onChange(index)}
          className={cn(
            "min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            current === index
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-accent",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BooleanAnswer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="flex justify-center gap-3">
      {[true, false].map((option) => (
        <Button
          key={String(option)}
          type="button"
          variant={value === option ? "default" : "outline"}
          className="min-h-11 min-w-28"
          onClick={() => onChange(option)}
        >
          {option ? "Sim" : "Não"}
        </Button>
      ))}
    </div>
  );
}

function TextAnswer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  return (
    <Textarea
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Escreva sua resposta (opcional, mas ajuda muito)"
      rows={4}
      maxLength={2000}
      aria-label="Resposta em texto"
    />
  );
}