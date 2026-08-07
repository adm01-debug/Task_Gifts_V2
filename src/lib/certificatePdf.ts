/**
 * Geração de certificados em PDF (A4 paisagem) com QR Code de verificação.
 *
 * Estratégia: imports dinâmicos de `jspdf` e `qrcode` para manter o bundle
 * inicial enxuto — o PDF só é necessário sob ação explícita do usuário.
 */
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CertificatePdfInput {
  /** Código público (formato XXXX-XXXX-XXXX). */
  certificateCode: string;
  holderName: string;
  certificationName: string;
  certificationCategory?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  /** Nome da organização emissora (white-label). */
  organizationName?: string | null;
  /** Base absoluta usada no QR (ex.: https://app.exemplo.com). */
  verificationBaseUrl?: string;
}

/** URL pública de verificação de um certificado. */
export function buildVerificationUrl(code: string, baseUrl?: string): string {
  const base = (baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");
  return `${base}/verificar/${encodeURIComponent(code)}`;
}

/** Nome de arquivo determinístico e seguro para o sistema de arquivos. */
export function buildCertificateFileName(input: Pick<CertificatePdfInput, "certificationName" | "certificateCode">): string {
  const slug = input.certificationName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "certificado";
  return `certificado-${slug}-${input.certificateCode}.pdf`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Blob> {
  const [{ default: jsPDF }, QRCode] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const verificationUrl = buildVerificationUrl(input.certificateCode, input.verificationBaseUrl);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fundo e moldura
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.3);
  doc.rect(13.5, 13.5, pageWidth - 27, pageHeight - 27);

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text((input.organizationName || "Certificado Corporativo").toUpperCase(), pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(30);
  doc.setTextColor(15, 23, 42);
  doc.text("CERTIFICADO DE CONCLUSÃO", pageWidth / 2, 45, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("Certificamos que", pageWidth / 2, 62, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(input.holderName, pageWidth / 2, 76, { align: "center", maxWidth: pageWidth - 80 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("concluiu com aproveitamento o programa", pageWidth / 2, 88, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(30, 41, 59);
  doc.text(input.certificationName, pageWidth / 2, 100, { align: "center", maxWidth: pageWidth - 80 });

  // Metadados
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Emitido em: ${formatDate(input.issuedAt)}`, 30, pageHeight - 45);
  doc.text(
    input.expiresAt ? `Válido até: ${formatDate(input.expiresAt)}` : "Validade: sem prazo de expiração",
    30,
    pageHeight - 38,
  );
  if (input.certificationCategory) {
    doc.text(`Categoria: ${input.certificationCategory}`, 30, pageHeight - 31);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Código: ${input.certificateCode}`, 30, pageHeight - 22);

  // QR de verificação
  const qrSize = 34;
  doc.addImage(qrDataUrl, "PNG", pageWidth - 30 - qrSize, pageHeight - 52, qrSize, qrSize);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Verifique a autenticidade", pageWidth - 30 - qrSize / 2, pageHeight - 15, { align: "center" });
  doc.text(verificationUrl, pageWidth - 30 - qrSize / 2, pageHeight - 11, { align: "center", maxWidth: 90 });

  return doc.output("blob");
}

/** Gera e dispara o download do certificado no navegador. */
export async function downloadCertificatePdf(input: CertificatePdfInput): Promise<void> {
  const blob = await generateCertificatePdf(input);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = buildCertificateFileName(input);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoga no próximo tick para não abortar o download em navegadores lentos.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
