import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Filter, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useKudosReceived, useKudosBadges, useKudosCount } from "@/hooks/useKudos";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, subDays, subMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileKudosSectionProps {
  userId: string;
}

type PeriodFilter = "all" | "week" | "month" | "quarter";

export const ProfileKudosSection = ({ userId }: ProfileKudosSectionProps) => {
  const { data: kudosReceived = [], isLoading } = useKudosReceived(userId);
  const { data: badges = [] } = useKudosBadges();
  const { data: kudosCount } = useKudosCount(userId);
  const { data: profiles = [] } = useProfiles();
  
  const [selectedBadge, setSelectedBadge] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.display_name || "Usuário";
  };

  const getProfileInitial = (profileId: string) => {
    const name = getProfileName(profileId);
    return name.charAt(0).toUpperCase();
  };

  const getBadgeInfo = (badgeId: string | null) => {
    if (!badgeId) return null;
    return badges.find(b => b.id === badgeId);
  };

  // Filter kudos based on selections
  const filteredKudos = useMemo(() => {
    let filtered = [...kudosReceived];

    // Filter by badge
    if (selectedBadge !== "all") {
      filtered = filtered.filter(k => k.badge_id === selectedBadge);
    }

    // Filter by period
    if (selectedPeriod !== "all") {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (selectedPeriod) {
        case "week":
          cutoffDate = subDays(now, 7);
          break;
        case "month":
          cutoffDate = subMonths(now, 1);
          break;
        case "quarter":
          cutoffDate = subMonths(now, 3);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(k => isAfter(new Date(k.created_at), cutoffDate));
    }

    // Filter by search (message content or sender name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.message.toLowerCase().includes(query) ||
        getProfileName(k.from_user_id).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [kudosReceived, selectedBadge, selectedPeriod, searchQuery, profiles]);

  // Group badges by category for the filter
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, typeof badges> = {};
    badges.forEach(badge => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    });
    return grouped;
  }, [badges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <div>
              <h3 className="font-bold">Reconhecimentos Recebidos</h3>
              <p className="text-xs text-muted-foreground">
                {kudosCount?.received || 0} kudos recebidos • {kudosCount?.given || 0} dados
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Badge Filter */}
          <Select value={selectedBadge} onValueChange={setSelectedBadge}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Badge" />
            </SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Todos os badges" />
              {badges.map((badge) => (
                <SelectItem key={badge.id} value={badge.id}>
                  <span className="flex items-center gap-2">
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Filter */}
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Todo período" />
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kudos List */}
      <ScrollArea className="max-h-96">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-8 h-8 rounded shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredKudos.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {kudosReceived.length === 0 
                ? "Nenhum reconhecimento recebido ainda" 
                : "Nenhum resultado para os filtros selecionados"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filteredKudos.map((kudos, index) => {
                const badge = getBadgeInfo(kudos.badge_id);
                
                return (
                  <motion.div
                    key={kudos.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Sender Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                        {getProfileInitial(kudos.from_user_id)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {getProfileName(kudos.from_user_id)}
                          </span>
                          {badge && (
                            <span 
                              className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
                              title={badge.description || undefined}
                            >
                              <span>{badge.icon}</span>
                              <span>{badge.name}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {kudos.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(kudos.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>

                      {/* Badge Icon */}
                      {badge && (
                        <div className="text-2xl shrink-0" title={badge.name}>
                          {badge.icon}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Summary Footer */}
      {kudosReceived.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-2 justify-center">
            {badges.slice(0, 5).map((badge) => {
              const count = kudosReceived.filter(k => k.badge_id === badge.id).length;
              if (count === 0) return null;
              
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-card border border-border text-xs"
                  title={`${count}x ${badge.name}`}
                >
                  <span>{badge.icon}</span>
                  <span className="font-medium">{count}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
