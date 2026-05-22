import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-destructive/20 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Ops! Algo deu errado</h2>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado na aplicação. Nossa equipe técnica foi notificada.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-muted rounded-xl text-left overflow-auto max-h-40">
            <code className="text-xs text-destructive">{error.message}</code>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              navigate("/");
              resetErrorBoundary();
            }}
            className="rounded-xl"
          >
            <Home className="mr-2 h-4 w-4" />
            Página Inicial
          </Button>
          <Button 
            onClick={resetErrorBoundary}
            className="rounded-xl"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
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
        // Reset the state of your app so the error doesn't happen again
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
