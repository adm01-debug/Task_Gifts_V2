import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createApiKey, type IssuedApiCredential } from "@/services/apiKeysService";

const AVAILABLE_PERMISSIONS = ["read", "write", "webhook"] as const;

export interface CreateApiKeyDialogProps {
  onIssued: (credential: IssuedApiCredential) => void;
}

export function CreateApiKeyDialog({ onIssued }: CreateApiKeyDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [permissions, setPermissions] = useState<string[]>(["read"]);

  const reset = () => {
    setName("");
    setDescription("");
    setRateLimit(60);
    setPermissions(["read"]);
  };

  const mutation = useMutation({
    mutationFn: () =>
      createApiKey({
        name: name.trim(),
        description: description.trim() || null,
        permissions,
        rateLimitPerMinute: rateLimit,
      }),
    onSuccess: (credential) => {
      queryClient.invalidateQueries({ queryKey: ["external-api-keys"] });
      setOpen(false);
      reset();
      onIssued(credential);
      toast.success("Chave de API criada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Falha ao criar a chave de API.");
    },
  });

  const nameInvalid = name.trim().length === 0;
  const rateInvalid = !Number.isFinite(rateLimit) || rateLimit < 1 || rateLimit > 10000;
  const permissionsInvalid = permissions.length === 0;
  const disabled = nameInvalid || rateInvalid || permissionsInvalid || mutation.isPending;

  const togglePermission = (permission: string, checked: boolean) => {
    setPermissions((prev) =>
      checked ? Array.from(new Set([...prev, permission])) : prev.filter((p) => p !== permission),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova chave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova chave de API</DialogTitle>
          <DialogDescription>
            A chave e o segredo são gerados no servidor e exibidos apenas uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="api-key-name">Nome</Label>
            <Input
              id="api-key-name"
              value={name}
              maxLength={80}
              placeholder="Ex.: ERP Financeiro"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="api-key-description">Descrição (opcional)</Label>
            <Input
              id="api-key-description"
              value={description}
              maxLength={200}
              placeholder="Para que essa integração será usada"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="api-key-rate">Limite por minuto</Label>
            <Input
              id="api-key-rate"
              type="number"
              min={1}
              max={10000}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
            />
            {rateInvalid && (
              <p className="text-xs text-destructive">Informe um valor entre 1 e 10000.</p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Permissões</legend>
            <div className="flex flex-wrap gap-4">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${permission}`}
                    checked={permissions.includes(permission)}
                    onCheckedChange={(checked) => togglePermission(permission, checked === true)}
                  />
                  <Label htmlFor={`perm-${permission}`} className="font-normal">
                    {permission}
                  </Label>
                </div>
              ))}
            </div>
            {permissionsInvalid && (
              <p className="text-xs text-destructive">Selecione ao menos uma permissão.</p>
            )}
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={disabled} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Emitindo…" : "Emitir chave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
