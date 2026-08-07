import { useState, useEffect } from "react";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";
import QRCode from "qrcode";

export function TwoFactorSetup() {
  const {
    settings,
    isLoading,
    isEnabled,
    setup,
    isSettingUp,
    setupData,
    verifyAndEnable,
    isVerifying,
    disable,
    isDisabling,
  } = useTwoFactor();

  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    if (setupData?.qrCodeUrl) {
      QRCode.toDataURL(setupData.qrCodeUrl, { width: 200, margin: 2 })
        .then(setQrCodeDataUrl)
        .catch((err: unknown) => logger.apiError('QR code generation', err, 'TwoFactorSetup'));
    }
  }, [setupData?.qrCodeUrl]);

  const handleSetup = async () => {
    try {
      await setup();
      setShowSetup(true);
    } catch (err: unknown) {
      logger.apiError('2FA setup', err, 'TwoFactorSetup');
    }
  };

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }
    verifyAndEnable(verificationCode, {
      onSuccess: (success) => {
        if (success) {
          setShowSetup(false);
          setVerificationCode("");
        }
      },
    });
  };

  const handleDisable = () => {
    if (confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) {
      disable();
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast.success("Chave copiada!");
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
      toast.success("Códigos de backup copiados!");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
          </div>
          {isEnabled ? (
            <Badge variant="default" className="bg-green-500">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Ativado
            </Badge>
          ) : (
            <Badge variant="secondary">
              <ShieldOff className="h-3 w-3 mr-1" />
              Desativado
            </Badge>
          )}
        </div>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sua conta está protegida com autenticação de dois fatores.
              Ao fazer login, você precisará fornecer um código do seu aplicativo autenticador.
            </p>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isDisabling}
            >
              {isDisabling ? "Desativando..." : "Desativar 2FA"}
            </Button>
          </div>
        ) : showSetup && setupData ? (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">1. Escaneie o QR Code</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Use um aplicativo como Google Authenticator, Authy ou 1Password
              </p>
              {qrCodeDataUrl && (
                <div className="flex justify-center bg-white p-4 rounded-lg w-fit mx-auto">
                  <img src={qrCodeDataUrl} alt="QR Code 2FA" />
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Ou insira a chave manualmente:</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background p-2 rounded text-sm break-all">
                  {setupData.secret}
                </code>
                <Button size="icon" variant="outline" onClick={copySecret}>
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-600 dark:text-amber-400">
                    Códigos de Backup
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Guarde estes códigos em um local seguro. Use-os se perder acesso ao seu autenticador.
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {setupData.backupCodes.map((code, idx) => (
                      <code key={idx} className="bg-background p-1 rounded text-xs text-center">
                        {code}
                      </code>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                    {copiedBackup ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copiar códigos
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">2. Digite o código do aplicativo</Label>
              <div className="flex gap-2">
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}>
                  {isVerifying ? "Verificando..." : "Verificar e Ativar"}
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setShowSetup(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ative a autenticação de dois fatores para proteger sua conta contra acessos não autorizados.
            </p>
            <Button onClick={handleSetup} disabled={isSettingUp}>
              {isSettingUp ? "Configurando..." : "Configurar 2FA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
