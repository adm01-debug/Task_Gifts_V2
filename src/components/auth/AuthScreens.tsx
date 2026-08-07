import { motion } from "framer-motion";
import { Globe, Loader2, ShieldX, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IpVerificationResult {
  allowed: boolean;
  ip: string;
  reason: string;
  message: string;
}

export function IpCheckingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <motion.div
            className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Verificando acesso...</h2>
        <p className="text-sm text-muted-foreground">Validando seu endereço IP</p>
      </motion.div>
    </div>
  );
}

interface IpBlockedScreenProps {
  ipInfo: IpVerificationResult | null;
  onRetry: () => void;
}

export function IpBlockedScreen({ ipInfo, onRetry }: IpBlockedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-md w-full border-destructive/50 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Seu endereço IP não está autorizado para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Seu IP:</span>
                <span className="font-mono font-medium">{ipInfo?.ip || 'Desconhecido'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-destructive font-medium">Bloqueado</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {ipInfo?.message || 'Entre em contato com o administrador para solicitar acesso.'}
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
