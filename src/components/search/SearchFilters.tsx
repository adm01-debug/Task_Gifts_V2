import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, BookOpen, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CategoryFilter = "all" | "trails" | "quests" | "users";
export type DifficultyFilter = "all" | "easy" | "medium" | "hard" | "expert";

interface SearchFiltersProps {
  showFilters: boolean;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (v: CategoryFilter) => void;
  difficultyFilter: DifficultyFilter;
  setDifficultyFilter: (v: DifficultyFilter) => void;
  selectedDepartments: string[];
  toggleDepartment: (id: string) => void;
  departments: Array<{ id: string; name: string; color: string | null }> | undefined;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy": return "bg-green-500/20 text-green-600";
    case "medium": return "bg-yellow-500/20 text-yellow-600";
    case "hard": return "bg-orange-500/20 text-orange-600";
    case "expert": return "bg-red-500/20 text-red-600";
    default: return "bg-muted text-muted-foreground";
  }
};

const getDifficultyLabel = (diff: DifficultyFilter) => {
  switch (diff) {
    case "all": return "Todas";
    case "easy": return "Fácil";
    case "medium": return "Médio";
    case "hard": return "Difícil";
    case "expert": return "Expert";
  }
};

const getCategoryLabel = (cat: CategoryFilter) => {
  switch (cat) {
    case "all": return "Todos";
    case "trails": return "Trilhas";
    case "quests": return "Quests";
    case "users": return "Usuários";
  }
};

export function SearchFilters({
  showFilters,
  categoryFilter,
  setCategoryFilter,
  difficultyFilter,
  setDifficultyFilter,
  selectedDepartments,
  toggleDepartment,
  departments,
  hasActiveFilters,
  clearFilters,
}: SearchFiltersProps) {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-border"
        >
          <div className="p-3 flex flex-wrap gap-2 items-center bg-muted/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Target className="w-3 h-3" />
                  {getCategoryLabel(categoryFilter)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">Categoria</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["all", "trails", "quests", "users"] as CategoryFilter[]).map((cat, index) => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={categoryFilter === cat}
                    onCheckedChange={() => setCategoryFilter(cat)}
                    className="flex items-center justify-between"
                  >
                    <span>{getCategoryLabel(cat)}</span>
                    <kbd className="ml-2 h-4 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                      {index + 1}
                    </kbd>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Zap className="w-3 h-3" />
                  {getDifficultyLabel(difficultyFilter)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">Dificuldade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["all", "easy", "medium", "hard", "expert"] as DifficultyFilter[]).map((diff) => (
                  <DropdownMenuCheckboxItem
                    key={diff}
                    checked={difficultyFilter === diff}
                    onCheckedChange={() => setDifficultyFilter(diff)}
                    className={diff !== "all" ? getDifficultyColor(diff) : ""}
                  >
                    {getDifficultyLabel(diff)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <BookOpen className="w-3 h-3" />
                  {selectedDepartments.length === 0
                    ? "Departamento"
                    : `${selectedDepartments.length} selecionado${selectedDepartments.length > 1 ? 's' : ''}`
                  }
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[200px] overflow-y-auto">
                <DropdownMenuLabel className="text-xs">Departamento</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {departments?.map((dept) => (
                  <DropdownMenuCheckboxItem
                    key={dept.id}
                    checked={selectedDepartments.includes(dept.id)}
                    onCheckedChange={() => toggleDepartment(dept.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: dept.color || '#6366f1' }}
                      />
                      {dept.name}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
                Limpar
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
