import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Command } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePublishedTrails } from "@/hooks/useTrails";
import { useQuests } from "@/hooks/useQuests";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { useDebounce } from "@/hooks/useDebounce";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
import { cn } from "@/lib/utils";
import { SearchFilters, type CategoryFilter, type DifficultyFilter } from "@/components/search/SearchFilters";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import {
  getRecentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches,
  type RecentSearch,
} from "@/components/search/searchUtils";

interface GlobalSearchProps {
  trigger?: React.ReactNode;
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const { data: trails } = usePublishedTrails();
  const { data: quests } = useQuests();
  const { data: profiles } = useProfiles();
  const { data: departments } = useDepartments();

  const hasActiveFilters = categoryFilter !== "all" || difficultyFilter !== "all" || selectedDepartments.length > 0;

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setDifficultyFilter("all");
    setSelectedDepartments([]);
  }, []);

  useEffect(() => { if (open) setRecentSearches(getRecentSearches()); }, [open]);
  useEffect(() => { if (!open) { setShowFilters(false); setSearchQuery(""); } }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
      if (!open) return;
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); setShowFilters(prev => !prev); }
      if (e.key === "Escape" && hasActiveFilters) { e.preventDefault(); e.stopPropagation(); clearFilters(); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, showFilters, hasActiveFilters, clearFilters]);

  const handleSelect = useCallback((type: string, id: string, label: string, icon: string) => {
    setRecentSearches(saveRecentSearch({ id, type: type as RecentSearch["type"], label, icon }));
    setOpen(false);
    switch (type) {
      case "trail": navigate(`/trails/${id}`); break;
      case "quest": navigate("/manager"); break;
      case "user": navigate(`/profile`); break;
    }
  }, [navigate]);

  const handleRecentSelect = useCallback((recent: RecentSearch) => {
    setRecentSearches(saveRecentSearch({ id: recent.id, type: recent.type, label: recent.label, icon: recent.icon }));
    setOpen(false);
    const actionRoutes: Record<string, string> = { dashboard: "/", trails: "/trails", quiz: "/quiz", shop: "/shop", achievements: "/achievements", profile: "/profile" };
    switch (recent.type) {
      case "trail": navigate(`/trails/${recent.id}`); break;
      case "quest": navigate("/manager"); break;
      case "user": navigate(`/profile`); break;
      case "action": if (actionRoutes[recent.id]) navigate(actionRoutes[recent.id]); break;
    }
  }, [navigate]);

  const handleRemoveRecent = useCallback((e: React.MouseEvent, id: string, type: string) => {
    e.stopPropagation();
    setRecentSearches(removeRecentSearch(id, type));
  }, []);

  const handleClearAllRecent = useCallback(() => { setRecentSearches(clearRecentSearches()); }, []);

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev => prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]);
  };

  const preFilteredTrails = useMemo(() => {
    if (!trails) return [];
    let result = trails;
    if (selectedDepartments.length > 0) result = result.filter(t => t.department_id && selectedDepartments.includes(t.department_id));
    return result;
  }, [trails, selectedDepartments]);

  const preFilteredQuests = useMemo(() => {
    if (!quests) return [];
    let result = quests;
    if (difficultyFilter !== "all") result = result.filter(q => q.difficulty === difficultyFilter);
    if (selectedDepartments.length > 0) result = result.filter(q => q.department_id && selectedDepartments.includes(q.department_id));
    return result;
  }, [quests, difficultyFilter, selectedDepartments]);

  const trailSearchResults = useFuseSearch(preFilteredTrails, ['title', 'description'], debouncedSearchQuery, { ...SEARCH_PRESETS.content, limit: 8 });
  const questSearchResults = useFuseSearch(preFilteredQuests, ['title', 'description'], debouncedSearchQuery, { ...SEARCH_PRESETS.content, limit: 8 });
  const userSearchResults = useFuseSearch(profiles || [], ['display_name', 'email'], debouncedSearchQuery, { ...SEARCH_PRESETS.loose, limit: 8 });

  const quickActions = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", route: "/" },
    { id: "trails", label: "Trilhas de Aprendizado", icon: "📚", route: "/trails" },
    { id: "quiz", label: "Quiz Diário", icon: "🎯", route: "/quiz" },
    { id: "shop", label: "Loja de Recompensas", icon: "🛍️", route: "/shop" },
    { id: "achievements", label: "Conquistas", icon: "🏆", route: "/achievements" },
    { id: "profile", label: "Perfil", icon: "👤", route: "/profile" },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setRecentSearches(saveRecentSearch({ id: action.id, type: "action", label: action.label, icon: action.icon }));
    setOpen(false);
    navigate(action.route);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors min-w-[200px]"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground flex-1 text-left">Buscar...</span>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="w-3 h-3" />K
          </kbd>
        </motion.button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b border-border">
          <CommandInput placeholder="Buscar trilhas, quests, usuários..." className="flex-1" value={searchQuery} onValueChange={setSearchQuery} />
          <Button
            variant="ghost" size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("mr-2 gap-1.5 h-8", hasActiveFilters && "text-primary")}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {(categoryFilter !== "all" ? 1 : 0) + (difficultyFilter !== "all" ? 1 : 0) + (selectedDepartments.length > 0 ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        <SearchFilters
          showFilters={showFilters}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          selectedDepartments={selectedDepartments}
          toggleDepartment={toggleDepartment}
          departments={departments}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />

        <SearchResultsList
          categoryFilter={categoryFilter}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          recentSearches={recentSearches}
          handleRecentSelect={handleRecentSelect}
          handleRemoveRecent={handleRemoveRecent}
          handleClearAllRecent={handleClearAllRecent}
          quickActions={quickActions}
          handleQuickAction={handleQuickAction}
          trailSearchResults={trailSearchResults}
          questSearchResults={questSearchResults}
          userSearchResults={userSearchResults}
          handleSelect={handleSelect}
        />
      </CommandDialog>
    </>
  );
}
