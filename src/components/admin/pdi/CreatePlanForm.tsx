import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useCreateDevelopmentPlan } from "@/hooks/useDevelopmentPlans";

interface CreatePlanFormProps {
  profiles: { id: string; display_name: string | null; avatar_url: string | null }[];
  onClose: () => void;
}

export function CreatePlanForm({ profiles, onClose }: CreatePlanFormProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const createPlan = useCreateDevelopmentPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !title) return;

    await createPlan.mutateAsync({
      user_id: selectedUser,
      title,
      description: description || undefined,
      target_date: targetDate || undefined,
      status: "active",
    });

    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo Plano de Desenvolvimento</DialogTitle>
        <DialogDescription>Crie um PDI para um colaborador</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Colaborador</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>{profile.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {profile.display_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Título do Plano</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Desenvolvimento de Liderança" />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objetivos e contexto do plano..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Data Alvo</Label>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!selectedUser || !title || createPlan.isPending}>
            {createPlan.isPending ? "Criando..." : "Criar PDI"}
          </Button>
        </div>
      </form>
    </>
  );
}
