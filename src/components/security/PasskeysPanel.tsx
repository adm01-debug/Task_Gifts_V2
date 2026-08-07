import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Fingerprint,
  Key,
  Smartphone,
  Monitor,
  Trash2,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Shield
} from "lucide-react";

export function PasskeysPanel() {
  const {
    isSupported,
    hasBiometric,
    credentials,
    isLoading,
    register,
    isRegistering,
    remove,
    isRemoving,
    rename,
    isRenaming
  } = useWebAuthn();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const handleAddPasskey = async () => {
    await register(deviceName || undefined);
    setAddDialogOpen(false);
    setDeviceName("");
  };

  const handleDelete = () => {
    if (selectedCredential) {
      remove(selectedCredential);
      setDeleteDialogOpen(false);
      setSelectedCredential(null);
    }
  };

  const handleRename = () => {
    if (selectedCredential && newName.trim()) {
      rename({ credentialId: selectedCredential, newName: newName.trim() });
      setRenameDialogOpen(false);
      setSelectedCredential(null);
      setNewName("");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "platform":
        return <Fingerprint className="h-5 w-5" />;
      case "security-key":
        return <Key className="h-5 w-5" />;
      default:
        return <Smartphone className="h-5 w-5" />;
    }
  };

  const getDeviceLabel = (deviceType: string) => {
    switch (deviceType) {
      case "platform":
        return "Biometria";
      case "security-key":
        return "Chave de Segurança";
      default:
        return "Dispositivo";
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys
          </CardTitle>
          <CardDescription>Login biométrico sem senha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Não suportado</p>
              <p className="text-sm text-muted-foreground">
                Seu navegador não suporta WebAuthn/Passkeys. Tente usar Chrome, Safari ou Edge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Passkeys
              </CardTitle>
              <CardDescription>
                Login biométrico usando impressão digital ou reconhecimento facial
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} disabled={isRegistering}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Passkey
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {hasBiometric ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  Biometria disponível neste dispositivo
                </span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Use uma chave de segurança externa
                </span>
              </>
            )}
          </div>

          {/* Lista de credenciais */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fingerprint className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhuma passkey configurada</p>
              <p className="text-sm">
                Adicione uma passkey para fazer login sem senha
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getDeviceIcon(credential.device_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {credential.device_name || "Dispositivo"}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getDeviceLabel(credential.device_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          Criado{" "}
                          {formatDistanceToNow(new Date(credential.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        {credential.last_used_at && (
                          <span>
                            • Último uso{" "}
                            {formatDistanceToNow(new Date(credential.last_used_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCredential(credential.id);
                        setNewName(credential.device_name || "");
                        setRenameDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedCredential(credential.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informações */}
          <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
            <p className="font-medium">Sobre Passkeys</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Mais seguro que senhas tradicionais</li>
              <li>Não pode ser roubado por phishing</li>
              <li>Funciona com impressão digital, Face ID ou Windows Hello</li>
              <li>Sincronizado com sua conta Apple, Google ou Microsoft</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para adicionar */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Adicionar Passkey
            </DialogTitle>
            <DialogDescription>
              Configure uma passkey para fazer login usando biometria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nome do dispositivo (opcional)
              </label>
              <Input
                placeholder="Ex: MacBook Pro, iPhone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              Você será solicitado a usar sua biometria ou chave de segurança
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPasskey} disabled={isRegistering}>
              {isRegistering ? "Registrando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para renomear */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Passkey</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do dispositivo"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
              {isRenaming ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para deletar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              Você não poderá mais usar esta passkey para fazer login. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
