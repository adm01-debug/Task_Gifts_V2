import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Lock, AlertTriangle } from "lucide-react";
import { logger } from "@/services/loggingService";
import { toast } from "sonner";

interface ReauthContextType {
  requireReauth: (action: string, onSuccess: () => void | Promise<void>) => void;
  isReauthenticating: boolean;
}

const ReauthContext = createContext<ReauthContextType | undefined>(undefined);

export function useReauth() {
  const context = useContext(ReauthContext);
  if (!context) {
    throw new Error("useReauth must be used within a ReauthProvider");
  }
  return context;
}

interface ReauthProviderProps {
  children: ReactNode;
}

export function ReauthProvider({ children }: ReauthProviderProps) {
  const { user } = useAuth();
  const { isEnabled: is2FAEnabled, verifyToken } = useTwoFactor();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState<"password" | "2fa">("password");
  const [error, setError] = useState("");
  const [pendingCallback, setPendingCallback] = useState<(() => void | Promise<void>) | null>(null);

  const reset = useCallback(() => {
    setPassword("");
    setTwoFactorCode("");
    setStep("password");
    setError("");
    setIsLoading(false);
    setPendingCallback(null);
    setAction("");
  }, []);

  const requireReauth = useCallback((actionName: string, onSuccess: () => void | Promise<void>) => {
    setAction(actionName);
    setPendingCallback(() => onSuccess);
    setIsOpen(true);
  }, []);

  const handlePasswordVerify = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError("");

    try {
      // Re-authenticate with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError) {
        setError("Senha incorreta");
        setIsLoading(false);
        return;
      }

      // If 2FA is enabled, go to 2FA step
      if (is2FAEnabled) {
        setStep("2fa");
        setIsLoading(false);
        return;
      }

      // Success - execute callback
      await executeCallback();
    } catch (err: unknown) {
      logger.apiError('Password verification', err, 'ReauthProvider');
      setError("Erro ao verificar senha");
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerify = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError("");

    try {
      const isValid = await verifyToken({ userId: user.id, token: twoFactorCode });

      if (!isValid) {
        setError("Código 2FA inválido");
        setIsLoading(false);
        return;
      }

      // Success - execute callback
      await executeCallback();
    } catch (err: unknown) {
      logger.apiError('2FA verification', err, 'ReauthProvider');
      setError("Erro ao verificar código 2FA");
      setIsLoading(false);
    }
  };

  const executeCallback = async () => {
    try {
      if (pendingCallback) {
        await pendingCallback();
      }
      toast.success("Ação autorizada com sucesso");
      setIsOpen(false);
      reset();
    } catch (err: unknown) {
      logger.apiError('Callback execution', err, 'ReauthProvider');
      setError("Erro ao executar ação");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <ReauthContext.Provider value={{ requireReauth, isReauthenticating: isLoading }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Confirmação de Segurança
            </DialogTitle>
            <DialogDescription>
              Para {action}, confirme sua identidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta é uma ação sensível. Por segurança, confirme sua identidade.
              </AlertDescription>
            </Alert>

            {step === "password" ? (
              <div className="space-y-4">
                <div>
                  <Label>Senha atual</Label>
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordVerify()}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handlePasswordVerify} 
                    disabled={isLoading || !password}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Verificar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Código 2FA</Label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleTwoFactorVerify()}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("password")} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleTwoFactorVerify} 
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ReauthContext.Provider>
  );
}
