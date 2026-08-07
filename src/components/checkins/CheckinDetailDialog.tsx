import { useState } from "react";
import { CheckCircle2, Star, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Checkin, ActionItem } from "@/services/checkinsService";

interface CheckinDetailDialogProps {
  checkin: Checkin | null;
  onClose: () => void;
  onComplete: (responses: Record<string, string | number>, moodRating: number) => void;
  onAddActionItem: (text: string) => void;
  onToggleActionItem: (checkinId: string, index: number, completed: boolean) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

const moodEmojis = ["😢", "😕", "😐", "🙂", "😄"];

export function CheckinDetailDialog({ checkin, onClose, onComplete, onAddActionItem, onToggleActionItem, getStatusBadge }: CheckinDetailDialogProps) {
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [moodRating, setMoodRating] = useState<number>(3);
  const [newActionItem, setNewActionItem] = useState("");

  const handleComplete = () => {
    onComplete(responses, moodRating);
    setResponses({});
    setMoodRating(3);
  };

  const handleAddAction = () => {
    if (!newActionItem.trim()) return;
    onAddActionItem(newActionItem);
    setNewActionItem("");
  };

  return (
    <Dialog open={!!checkin} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detalhes do Check-in</DialogTitle></DialogHeader>
        {checkin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={checkin.employee?.avatar_url || undefined} />
                  <AvatarFallback>{checkin.employee?.display_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{checkin.employee?.display_name}</p>
                  <p className="text-sm text-muted-foreground">{checkin.employee?.display_name}</p>
                </div>
              </div>
              {getStatusBadge(checkin.status)}
            </div>

            {checkin.status !== "completed" && (
              <>
                <div>
                  <Label className="text-base font-medium">Como você está se sentindo?</Label>
                  <div className="flex gap-3 mt-2">
                    {moodEmojis.map((emoji, idx) => (
                      <button key={idx} onClick={() => setMoodRating(idx + 1)}
                        className={`text-3xl p-2 rounded-lg transition-all ${moodRating === idx + 1 ? "bg-primary/20 scale-110" : "hover:bg-muted"}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleComplete} className="w-full gap-2"><CheckCircle2 className="h-4 w-4" />Concluir Check-in ({checkin.xp_reward} XP)</Button>
              </>
            )}

            <div>
              <Label className="text-base font-medium mb-2 block">Ações ({(checkin.action_items as ActionItem[] || []).length})</Label>
              <div className="space-y-2">
                {(checkin.action_items as ActionItem[] || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox checked={item.completed} onCheckedChange={(checked) => onToggleActionItem(checkin.id, idx, !!checked)} />
                    <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input value={newActionItem} onChange={(e) => setNewActionItem(e.target.value)} placeholder="Nova ação..." onKeyDown={(e) => e.key === "Enter" && handleAddAction()} />
                <Button variant="outline" onClick={handleAddAction}>Adicionar</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
