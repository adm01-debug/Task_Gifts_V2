import { useState } from "react";
import { Copy, Check, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IssuedApiCredential } from "@/services/apiKeysService";

export interface IssuedCredentialDialogProps {
  credential: IssuedApiCredential | null;
  onClose: () => void;
}

/**
 * Exibe a credencial recém-emitida. O segredo só existe em memória neste
 * momento — o banco guarda apenas o hash, então não há como recuperá-lo depois.
 */
export function IssuedCredentialDialog({ credential, onClose }: IssuedCredentialDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  return (
    <Dialog open={!!credential} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Credencial emitida</DialogTitle>
          <DialogDescription>
            Guarde o segredo agora. Ele não poderá ser exibido novamente.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Exibição única</AlertTitle>
          <AlertDescription>
            O sistema armazena apenas o hash do segredo. Se perder, será necessário rotacionar.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {credential && ([
            { label: "x-api-key", value: credential.api_key },
            { label: "x-api-secret", value: credential.api_secret },
          ]).map((field) => (
            <div key={field.label} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                  {field.value}
                </code>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Copiar ${field.label}`}
                  onClick={() => copy(field.label, field.value)}
                >
                  {copied === field.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Já guardei em local seguro</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
