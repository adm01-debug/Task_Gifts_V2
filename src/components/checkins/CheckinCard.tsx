import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Star, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Checkin, ActionItem } from "@/services/checkinsService";

const moodEmojis = ["😢", "😕", "😐", "🙂", "😄"];

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
    case "in_progress":
      return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">Agendado</Badge>;
  }
}

interface CheckinCardProps {
  checkin: Checkin;
  onSelect: (checkin: Checkin) => void;
  onPrepare: (employeeId: string) => void;
  isPreparationLoading: boolean;
}

export function CheckinCard({ checkin, onSelect, onPrepare, isPreparationLoading }: CheckinCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(checkin)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={checkin.employee?.avatar_url || undefined} />
                <AvatarFallback>{checkin.employee?.display_name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  1:1 com {checkin.employee?.display_name || "Colaborador"}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(checkin.scheduled_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(checkin.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checkin.notes && <p className="text-sm text-muted-foreground line-clamp-2">{checkin.notes}</p>}
            {checkin.mood_rating && (
              <div className="flex items-center gap-2 text-sm">
                <span>Humor:</span>
                <span className="text-lg">{moodEmojis[checkin.mood_rating - 1]}</span>
              </div>
            )}
            {checkin.action_items && checkin.action_items.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {(checkin.action_items as ActionItem[]).filter((a) => a.completed).length}/{checkin.action_items.length} ações concluídas
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-primary">
              <Star className="h-4 w-4" />
              <span>{checkin.xp_reward} XP ao concluir</span>
            </div>
            {checkin.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={(e) => { e.stopPropagation(); onPrepare(checkin.employee_id); }}
                disabled={isPreparationLoading}
              >
                <Brain className="h-4 w-4" />
                {isPreparationLoading ? "Preparando..." : "Preparar com IA"}
                <Sparkles className="h-3 w-3 text-primary" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { getStatusBadge, moodEmojis };
