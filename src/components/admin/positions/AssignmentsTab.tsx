import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Trash2 } from "lucide-react";

interface AssignmentsTabProps {
  userPositions: Array<{
    id: string;
    is_primary: boolean;
    profiles?: { display_name: string | null; email: string | null } | null;
    positions?: { name: string } | null;
  }>;
  positions: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; display_name: string | null; email: string | null }>;
  onAssign: (data: { user_id: string; position_id: string; is_primary: boolean }) => Promise<void>;
  onRemove: (id: string) => void;
  isAssigning: boolean;
}

export function AssignmentsTab({ userPositions, positions, profiles, onAssign, onRemove, isAssigning }: AssignmentsTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ user_id: "", position_id: "", is_primary: true });

  const handleAssign = async () => {
    if (!form.user_id || !form.position_id) return;
    await onAssign(form);
    setIsOpen(false);
    setForm({ user_id: "", position_id: "", is_primary: true });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vínculos Usuário-Cargo</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Atribuir Cargo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Atribuir Cargo a Usuário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Usuário *</Label>
                  <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o usuário" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name || p.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cargo *</Label>
                  <Select value={form.position_id} onValueChange={(v) => setForm({ ...form, position_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                    <SelectContent>
                      {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_primary} onCheckedChange={(c) => setForm({ ...form, is_primary: c })} />
                  <Label>Cargo principal</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleAssign} disabled={isAssigning}>Atribuir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {userPositions.map((up, index) => (
              <motion.div
                key={up.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{up.profiles?.display_name || up.profiles?.email || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground">{up.positions?.name || "Cargo desconhecido"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {up.is_primary && <Badge>Principal</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => onRemove(up.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
