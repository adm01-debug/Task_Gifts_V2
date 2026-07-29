import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface GoalBetSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  className?: string;
}

/** Campo de busca textual da vitrine de mercados de previsão. */
export function GoalBetSearchInput({
  value,
  onChange,
  resultCount,
  className,
}: GoalBetSearchInputProps) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar por título, descrição ou opção..."
          aria-label="Buscar mercados de previsão"
          className="h-11 rounded-full pl-9 pr-10"
        />
        {hasQuery && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Limpar busca"
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasQuery && (
        <p aria-live="polite" className="pl-4 text-xs text-muted-foreground">
          {resultCount === 0
            ? "Nenhum mercado encontrado"
            : `${resultCount} ${resultCount === 1 ? "mercado encontrado" : "mercados encontrados"}`}
        </p>
      )}
    </div>
  );
}
