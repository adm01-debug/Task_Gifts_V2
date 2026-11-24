import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webauthnService, isWebAuthnSupported } from "@/services/webauthnService";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

interface PasskeyLoginProps {
  onSuccess: () => void;
  defaultEmail?: string;
}

/**
 * Login por biometria/passkey. A verificação da assinatura acontece na edge
 * function `passkey-auth`, que devolve o token de sessão; aqui só confirmamos
 * que a sessão existe antes de navegar. O e-mail é opcional: passkeys
 * residentes (o padrão do registro) dispensam digitar nada.
 */
export function PasskeyLogin({ onSuccess, defaultEmail = "" }: PasskeyLoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasskeyLogin = async () => {
    if (!isWebAuthnSupported()) {
      toast.error("Seu navegador não suporta login com passkey");
      return;
    }

    setIsLoading(true);
    try {
      const result = await webauthnService.authenticate(email.trim() || undefined);

      if (!result.success) {
        toast.error(result.error || "Falha na autenticação");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Passkey validada, mas a sessão não foi criada. Entre com e-mail e senha.");
        return;
      }

      toast.success("Login com passkey realizado!");
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
      <div className="space-y-2">
        <Label htmlFor="passkey-email">E-mail (opcional)</Label>
        <Input
          id="passkey-email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="username webauthn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button
        type="button"
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
        {isLoading ? "Autenticando..." : "Entrar com passkey"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Use sua impressão digital, Face ID, PIN do dispositivo ou chave de segurança
      </p>
    </div>
  );
}