import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface TwoFactorVerifyProps {
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TwoFactorVerify = forwardRef<HTMLDivElement, TwoFactorVerifyProps>(
  function TwoFactorVerify({ onVerify, onCancel, isLoading }, ref) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Digite um código de 6 dígitos");
      return;
    }

    setError("");
    const success = await onVerify(code);
    
    if (!success) {
      setError("Código inválido. Tente novamente.");
      setCode("");
    }
  };

  const handleCodeComplete = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      // Auto-submit when complete
      setTimeout(() => {
        onVerify(value).then((success) => {
          if (!success) {
            setError("Código inválido. Tente novamente.");
            setCode("");
          }
        });
      }, 100);
    }
  };

  return (
    <Card ref={ref} className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Verificação em Duas Etapas</CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={handleCodeComplete}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? "Verificando..." : "Verificar"}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Você também pode usar um código de backup se perdeu acesso ao seu autenticador
        </p>
      </CardContent>
    </Card>
  );
});
