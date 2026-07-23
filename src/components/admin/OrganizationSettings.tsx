import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Building2, Upload, RotateCcw, Palette } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { organizationService, type OrganizationUpdate } from "@/services/organizationService";
import { getContrastRatio, hexToHslString } from "@/utils/colorContrast";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded-md border border-border cursor-pointer bg-background"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}

export function OrganizationSettings() {
  const { user } = useAuth();
  const { data: org, isLoading } = useOrganization();
  const qc = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primary, setPrimary] = useState("#6366f1");
  const [secondary, setSecondary] = useState("#a855f7");
  const [accent, setAccent] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setTagline(org.tagline ?? "");
    setPrimary(org.primary_color ?? "#6366f1");
    setSecondary(org.secondary_color ?? "#a855f7");
    setAccent(org.accent_color ?? "#10b981");
    setLogoUrl(org.logo_url);
    setFaviconUrl(org.favicon_url);
  }, [org]);

  const contrast = getContrastRatio(primary, "#ffffff");
  const wcagOk = contrast >= 4.5;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!org || !user) throw new Error("Sem organização");
      if (!wcagOk) throw new Error("Cor primária não atinge contraste WCAG AA (4.5:1)");
      const patch: OrganizationUpdate = {
        name,
        tagline: tagline || null,
        primary_color: hexToHslString(primary),
        secondary_color: hexToHslString(secondary),
        accent_color: hexToHslString(accent),
        logo_url: logoUrl,
        favicon_url: faviconUrl,
      };
      return organizationService.updateOrganization(org.id, patch, user.id);
    },
    onSuccess: () => {
      toast.success("Identidade atualizada com sucesso!");
      qc.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    },
  });

  const handleUpload = async (file: File, kind: "logo" | "favicon") => {
    if (!org) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo maior que 2MB");
      return;
    }
    try {
      const url = await organizationService.uploadAsset(org.id, file, kind);
      if (kind === "logo") setLogoUrl(url);
      else setFaviconUrl(url);
      toast.success(`${kind === "logo" ? "Logo" : "Favicon"} enviado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload falhou");
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">Carregando organização...</div>;

  if (!org) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhuma organização configurada. O sistema está usando a identidade padrão Task Gifts.
          </p>
          <p className="text-xs text-muted-foreground">
            Solicite ao suporte para provisionar sua organização white-label.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Customize logo, cores e marca da sua organização</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo (máx 2MB)</Label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-lg border border-border object-contain bg-muted"
                  />
                )}
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Enviar
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon (máx 2MB)</Label>
              <div className="flex items-center gap-3">
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    alt="Favicon"
                    className="w-10 h-10 rounded border border-border object-contain bg-muted"
                  />
                )}
                <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Enviar
                </Button>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "favicon")}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <ColorField label="Cor primária" value={primary} onChange={setPrimary} />
            <ColorField label="Cor secundária" value={secondary} onChange={setSecondary} />
            <ColorField label="Cor de destaque" value={accent} onChange={setAccent} />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
            <Badge variant={wcagOk ? "default" : "destructive"}>
              Contraste {contrast.toFixed(2)}:1
            </Badge>
            <span className="text-sm text-muted-foreground">
              {wcagOk
                ? "✓ Atende WCAG AA (mín. 4.5:1)"
                : "✗ Contraste insuficiente — ajuste a cor primária"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{ backgroundColor: primary }}
              />
              <div
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{ backgroundColor: secondary }}
              />
              <div
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{ backgroundColor: accent }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!org) return;
                  setName(org.name);
                  setTagline(org.tagline ?? "");
                  setPrimary(org.primary_color ?? "#6366f1");
                  setSecondary(org.secondary_color ?? "#a855f7");
                  setAccent(org.accent_color ?? "#10b981");
                  setLogoUrl(org.logo_url);
                  setFaviconUrl(org.favicon_url);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reverter
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !wcagOk}>
                {saveMutation.isPending ? "Salvando..." : "Salvar identidade"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}