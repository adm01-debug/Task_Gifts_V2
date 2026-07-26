import { useState } from "react";
import { Download, Link2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useOrganization } from "@/hooks/useOrganization";
import { buildVerificationUrl, downloadCertificatePdf } from "@/lib/certificatePdf";
import type { UserCertification } from "@/services/certificationsService";
import { logger } from "@/services/loggingService";

export interface CertificateActionsProps {
  userCert: UserCertification;
}

/**
 * Ações de emissão do certificado: download do PDF (com QR de verificação)
 * e cópia do link público de validação.
 */
export function CertificateActions({ userCert }: CertificateActionsProps) {
  const { toast } = useToast();
  const { data: profile } = useCurrentProfile();
  const { data: organization } = useOrganization();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = userCert.certificate_code;
  const cert = userCert.certification;
  if (!code || !cert) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadCertificatePdf({
        certificateCode: code,
        holderName: profile?.display_name || "Colaborador",
        certificationName: cert.name,
        certificationCategory: cert.category,
        issuedAt: userCert.issued_at,
        expiresAt: userCert.expires_at,
        organizationName: organization?.name ?? null,
      });
      toast({ title: "Certificado gerado", description: "O download do PDF foi iniciado." });
    } catch (err: unknown) {
      logger.error("Falha ao gerar PDF do certificado", "CertificateActions", err);
      toast({
        title: "Não foi possível gerar o PDF",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const url = buildVerificationUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copiado", description: "Compartilhe para validação pública." });
    } catch {
      toast({ title: "Copie manualmente", description: url });
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="secondary" onClick={handleDownload} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {isGenerating ? "Gerando..." : "Baixar PDF"}
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCopy} aria-label="Copiar link de verificação">
        {copied ? (
          <Check className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        Link de verificação
      </Button>
      <span className="font-mono text-xs text-muted-foreground">{code}</span>
    </div>
  );
}
