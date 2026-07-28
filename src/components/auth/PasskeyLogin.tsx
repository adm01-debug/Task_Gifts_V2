import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { webauthnService, isWebAuthnSupported } from "@/services/webauthnService";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

interface PasskeyLoginProps {
  onSuccess: () => void;
  defaultEmail?: string;
}

export function PasskeyLogin({ onSuccess, defaultEmail = "" }: PasskeyLoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(!defaultEmail);

  const handlePasskeyLogin = async () => {
    if (!isWebAuthnSupported()) {
      toast.error("Seu navegador não suporta login com passkey");
      return;
    }

    setIsLoading(true);
    try {
      const result = await webauthnService.authenticate(email || undefined);
      
      if (!result.success) {
        toast.error(result.error || "Falha na autenticação");
        return;
      }

      // A biometria por si só NÃO cria sessão: a emissão do token é
      // responsabilidade exclusiva do servidor de autenticação. Só liberamos
      // o fluxo se existir uma sessão válida emitida pelo backend — nunca
      // confiamos apenas no resultado verificado no cliente.
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        toast.error(
          "Biometria reconhecida, mas a sessão não pôde ser emitida. Entre com e-mail e senha."
        );
        return;
      }

      toast.success("Autenticação biométrica bem-sucedida!");
      onSuccess();
      
    } catch (error: unknown) {
      logger.apiError("Passkey login", error, "PasskeyLogin");
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer login";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isWebAuthnSupported()) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showEmailInput && (
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      )}
      
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handlePasskeyLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {isLoading ? "Autenticando..." : "Entrar com Passkey"}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Use sua impressão digital, Face ID ou chave de segurança
      </p>
    </div>
  );
}
