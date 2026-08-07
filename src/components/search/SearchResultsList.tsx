import { Search, BookOpen, Target, User, Zap, Clock, Award, History, X } from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getHighlightSegments } from "@/hooks/useFuseSearch";
import { getDifficultyColor, type CategoryFilter } from "./SearchFilters";

interface RecentSearch {
  id: string;
  type: "trail" | "quest" | "user" | "action";
  label: string;
  icon: string;
  timestamp: number;
}

function HighlightText({ text, indices }: { text: string; indices?: [number, number][] }) {
  const segments = getHighlightSegments(text, indices);
  return (
    <>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{segment.text}</mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}

function getTypeIcon(type: RecentSearch["type"]) {
  switch (type) {
    case "trail": return <BookOpen className="w-3 h-3" />;
    case "quest": return <Target className="w-3 h-3" />;
    case "user": return <User className="w-3 h-3" />;
    case "action": return <Zap className="w-3 h-3" />;
  }
}

interface SearchResultsListProps {
  categoryFilter: CategoryFilter;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  recentSearches: RecentSearch[];
  handleRecentSelect: (recent: RecentSearch) => void;
  handleRemoveRecent: (e: React.MouseEvent, id: string, type: string) => void;
  handleClearAllRecent: () => void;
  quickActions: Array<{ id: string; label: string; icon: string; route: string }>;
  handleQuickAction: (action: { id: string; label: string; icon: string; route: string }) => void;
  trailSearchResults: Array<{ item: { id: string; title: string; icon?: string | null; estimated_hours?: number | null; xp_reward?: number | null }; matches?: Array<{ key?: string; indices?: readonly [number, number][] }> }>;
  questSearchResults: Array<{ item: { id: string; title: string; icon?: string; difficulty: string; xp_reward: number }; matches?: Array<{ key?: string; indices?: readonly [number, number][] }> }>;
  userSearchResults: Array<{ item: { id: string; display_name: string | null; email: string | null; avatar_url: string | null; level: number; xp: number }; matches?: Array<{ key?: string; indices?: readonly [number, number][] }> }>;
  handleSelect: (type: string, id: string, label: string, icon: string) => void;
}

export function SearchResultsList({
  categoryFilter,
  hasActiveFilters,
  clearFilters,
  recentSearches,
  handleRecentSelect,
  handleRemoveRecent,
  handleClearAllRecent,
  quickActions,
  handleQuickAction,
  trailSearchResults,
  questSearchResults,
  userSearchResults,
  handleSelect,
}: SearchResultsListProps) {
  return (
    <CommandList>
      <CommandEmpty>
        <div className="flex flex-col items-center gap-2 py-4">
          <Search className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
          {hasActiveFilters && (
            <Button variant="link" size="sm" onClick={clearFilters} className="text-xs">Limpar filtros</Button>
          )}
        </div>
      </CommandEmpty>

      {recentSearches.length > 0 && categoryFilter === "all" && (
        <>
          <CommandGroup heading={
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><History className="w-3 h-3" />Buscas Recentes</span>
              <Button variant="ghost" size="sm" onClick={handleClearAllRecent} className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground">Limpar tudo</Button>
            </div>
          }>
            {recentSearches.map((recent) => (
              <CommandItem key={`${recent.type}-${recent.id}`} onSelect={() => handleRecentSelect(recent)} className="flex items-center gap-3 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><span className="text-sm">{recent.icon}</span></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{recent.label}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{getTypeIcon(recent.type)}<span className="capitalize">{recent.type === "action" ? "Ação rápida" : recent.type}</span></div>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => handleRemoveRecent(e, recent.id, recent.type)} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></Button>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {categoryFilter === "all" && (
        <>
          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((action) => (
              <CommandItem key={action.label} onSelect={() => handleQuickAction(action)} className="flex items-center gap-3 cursor-pointer">
                <span className="text-lg">{action.icon}</span>
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "trails") && trailSearchResults.length > 0 && (
        <>
          <CommandGroup heading="Trilhas de Aprendizado">
            {trailSearchResults.map((result) => {
              const trail = result.item;
              const titleMatch = result.matches?.find(m => m.key === 'title');
              return (
                <CommandItem key={trail.id} onSelect={() => handleSelect("trail", trail.id, trail.title, trail.icon || "📚")} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-sm">{trail.icon || "📚"}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate"><HighlightText text={trail.title} indices={titleMatch?.indices as [number, number][] | undefined} /></p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {trail.estimated_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trail.estimated_hours}h</span>}
                      {trail.xp_reward && <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3" />{trail.xp_reward} XP</span>}
                    </div>
                  </div>
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "quests") && questSearchResults.length > 0 && (
        <>
          <CommandGroup heading="Quests">
            {questSearchResults.map((result) => {
              const quest = result.item;
              const titleMatch = result.matches?.find(m => m.key === 'title');
              return (
                <CommandItem key={quest.id} onSelect={() => handleSelect("quest", quest.id, quest.title, quest.icon || "🎯")} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><span className="text-sm">{quest.icon || "🎯"}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate"><HighlightText text={quest.title} indices={titleMatch?.indices as [number, number][] | undefined} /></p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", getDifficultyColor(quest.difficulty))}>{quest.difficulty}</Badge>
                      <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3" />{quest.xp_reward} XP</span>
                    </div>
                  </div>
                  <Target className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {(categoryFilter === "all" || categoryFilter === "users") && userSearchResults.length > 0 && (
        <CommandGroup heading="Usuários">
          {userSearchResults.map((result) => {
            const profile = result.item;
            const nameMatch = result.matches?.find(m => m.key === 'display_name' || m.key === 'email');
            return (
              <CommandItem key={profile.id} onSelect={() => handleSelect("user", profile.id, profile.display_name || profile.email || "Usuário", "👤")} className="flex items-center gap-3 cursor-pointer">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{(profile.display_name || profile.email || "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate"><HighlightText text={profile.display_name || profile.email || "Usuário"} indices={nameMatch?.indices as [number, number][] | undefined} /></p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" />Nível {profile.level}</span>
                    <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3" />{profile.xp} XP</span>
                  </div>
                </div>
                <User className="w-4 h-4 text-muted-foreground" />
              </CommandItem>
            );
          })}
        </CommandGroup>
      )}
    </CommandList>
  );
}
