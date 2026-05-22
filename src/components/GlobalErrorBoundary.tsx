import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-destructive/20 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ops! Algo deu errado</h2>
          <p className="text-muted-foreground leading-relaxed">
            Encontramos um problema inesperado. Nossa equipe foi notificada.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={resetErrorBoundary}
            className="rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Tentar novamente
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              navigate("/");
              resetErrorBoundary();
            }}
            className="rounded-xl h-12 text-base font-medium border-border/50 hover:bg-muted active:scale-95 transition-transform"
          >
            <Home className="mr-2 h-5 w-5" />
            Ir para início
          </Button>
        </div>

        <div className="pt-2">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground/60 flex items-center justify-center mx-auto hover:text-muted-foreground transition-colors"
          >
            {showDetails ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {showDetails ? "Ocultar detalhes" : "Detalhes técnicos (dev)"}
          </button>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl text-left overflow-auto max-h-40 border border-border/20 backdrop-blur-sm">
              <code className="text-[10px] text-destructive break-words font-mono">
                {error instanceof Error ? error.message : String(error)}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Opcional: registrar o erro em algum serviço de telemetria
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
