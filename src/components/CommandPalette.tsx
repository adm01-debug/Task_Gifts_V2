import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, Target, Trophy, TrendingUp, Clock, BookOpen,
  Gamepad2, ShoppingBag, Swords, Heart, Award,
  ClipboardCheck, BarChart3, Megaphone, MessageSquare,
  User, Settings, Shield, LogOut, Search, Bell,
  Moon, Sun, Activity, Dices, Gift
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useFuseSearch, getHighlightSegments, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
import { toast } from "sonner";

interface CommandItemData {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  category: "navigation" | "actions" | "settings";
}

// Highlight component for fuzzy search results
function HighlightLabel({ 
  text, 
  indices 
}: { 
  text: string; 
  indices?: [number, number][];
}) {
  const segments = getHighlightSegments(text, indices);
  
  return (
    <>
      {segments.map((segment, i) => 
        segment.isMatch ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Toggle with keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    toast.success("Até logo! 👋");
    navigate("/auth");
    setOpen(false);
  }, [signOut, navigate]);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast.success(`Tema ${theme === "dark" ? "claro" : "escuro"} ativado`);
    setOpen(false);
  }, [theme, setTheme]);

  const commands: CommandItemData[] = useMemo(() => [
    // Navigation
    { id: "home", label: "Dashboard", icon: Home, action: () => handleNavigate("/"), keywords: ["início", "home"], category: "navigation" },
    { id: "stats", label: "Estatísticas", icon: TrendingUp, action: () => handleNavigate("/estatisticas"), keywords: ["stats", "números"], category: "navigation" },
    { id: "achievements", label: "Conquistas", icon: Trophy, action: () => handleNavigate("/conquistas"), keywords: ["badges", "troféus"], category: "navigation" },
    { id: "goals", label: "Metas & OKRs", icon: Target, action: () => handleNavigate("/goals"), keywords: ["objetivos", "okr"], category: "navigation" },
    { id: "engagement", label: "Engajamento", icon: Activity, action: () => handleNavigate("/engajamento"), keywords: ["pesquisa", "clima", "continua"], category: "navigation" },
    { id: "climate-diagnostics", label: "Diagnóstico de Clima", icon: Activity, action: () => handleNavigate("/engajamento/diagnostico"), keywords: ["clima", "enps", "favorabilidade", "pilares", "fatores"], category: "navigation" },
    { id: "opinion-channel", label: "Canal de Opiniões", icon: Activity, action: () => handleNavigate("/engajamento/opinioes"), keywords: ["opiniao", "opinioes", "anonimo", "sugestao", "reclamacao", "elogio", "voz"], category: "navigation" },
    { id: "action-plans", label: "Planos de Ação", icon: ClipboardCheck, action: () => handleNavigate("/planos-acao"), keywords: ["5w2h", "plano", "acao", "clima", "melhoria"], category: "navigation" },
    { id: "nr1-risks", label: "Riscos Psicossociais (NR-1)", icon: Activity, action: () => handleNavigate("/engajamento/nr1"), keywords: ["nr1", "nr-1", "psicossocial", "iso 45003", "saude mental", "risco"], category: "navigation" },
    { id: "checkins", label: "Check-ins 1:1", icon: ClipboardCheck, action: () => handleNavigate("/checkins"), keywords: ["reunião", "one on one"], category: "navigation" },
    { id: "attendance", label: "Ponto", icon: Clock, action: () => handleNavigate("/ponto"), keywords: ["registro", "hora"], category: "navigation" },
    { id: "trails", label: "Trilhas de Aprendizado", icon: BookOpen, action: () => handleNavigate("/trails"), keywords: ["cursos", "learning"], category: "navigation" },
    { id: "quiz", label: "Quiz Diário", icon: Gamepad2, action: () => handleNavigate("/quiz"), keywords: ["perguntas", "game"], category: "navigation" },
    { id: "mentorship", label: "Mentoria", icon: Heart, action: () => handleNavigate("/mentoria"), keywords: ["mentor", "coach"], category: "navigation" },
    { id: "leagues", label: "Ligas", icon: Award, action: () => handleNavigate("/leagues"), keywords: ["competição", "ranking"], category: "navigation" },
    { id: "duels", label: "Duelos", icon: Swords, action: () => handleNavigate("/duelos"), keywords: ["batalha", "1v1"], category: "navigation" },
    { id: "lucky-wheel", label: "Roleta da Sorte", icon: Dices, action: () => handleNavigate("/roleta"), keywords: ["roleta", "sorte", "giro", "premio"], category: "navigation" },
    { id: "scratch-card", label: "Raspadinha Digital", icon: Gift, action: () => handleNavigate("/raspadinha"), keywords: ["raspadinha", "sorte", "premio", "surpresa"], category: "navigation" },
    { id: "lightning-quiz", label: "Verdadeiro ou Falso Relâmpago", icon: Gamepad2, action: () => handleNavigate("/relampago"), keywords: ["relampago", "verdadeiro", "falso", "quiz", "rapido"], category: "navigation" },
    { id: "surveys", label: "Pulse Surveys", icon: BarChart3, action: () => handleNavigate("/surveys"), keywords: ["pesquisa", "opinião"], category: "navigation" },
    { id: "feedback", label: "Feedback 360°", icon: MessageSquare, action: () => handleNavigate("/feedback"), keywords: ["avaliação", "review"], category: "navigation" },
    { id: "announcements", label: "Anúncios", icon: Megaphone, action: () => handleNavigate("/announcements"), keywords: ["comunicados", "news"], category: "navigation" },
    { id: "shop", label: "Loja de Recompensas", icon: ShoppingBag, action: () => handleNavigate("/loja"), keywords: ["comprar", "rewards", "coins"], category: "navigation" },
    
    // Actions
    { id: "search", label: "Buscar...", icon: Search, action: () => { setOpen(false); document.querySelector<HTMLButtonElement>('[data-search-trigger]')?.click(); }, keywords: ["pesquisar", "find"], category: "actions" },
    { id: "notifications", label: "Notificações", icon: Bell, action: () => { setOpen(false); document.querySelector<HTMLButtonElement>('[data-notifications-trigger]')?.click(); }, keywords: ["alertas", "mensagens"], category: "actions" },
    
    // Settings
    { id: "profile", label: "Meu Perfil", icon: User, action: () => handleNavigate("/profile"), keywords: ["conta", "avatar"], category: "settings" },
    { id: "settings", label: "Configurações", icon: Settings, action: () => handleNavigate("/profile"), keywords: ["preferências", "config"], category: "settings" },
    { id: "security", label: "Segurança", icon: Shield, action: () => handleNavigate("/security"), keywords: ["senha", "2fa"], category: "settings" },
    { id: "theme", label: `Tema ${theme === "dark" ? "Claro" : "Escuro"}`, icon: theme === "dark" ? Sun : Moon, action: handleToggleTheme, keywords: ["dark", "light", "modo"], category: "settings" },
    { id: "logout", label: "Sair", icon: LogOut, action: handleSignOut, keywords: ["logout", "desconectar"], category: "settings" },
  ], [handleNavigate, handleSignOut, handleToggleTheme, theme]);

  // Fuzzy search with Fuse.js
  const searchResults = useFuseSearch(
    commands,
    ['label', 'keywords'],
    searchQuery,
    { ...SEARCH_PRESETS.commands, limit: 20 }
  );

  // Group results by category
  const groupedResults = useMemo(() => {
    const navigation: typeof searchResults = [];
    const actions: typeof searchResults = [];
    const settings: typeof searchResults = [];

    searchResults.forEach(result => {
      switch (result.item.category) {
        case "navigation":
          navigation.push(result);
          break;
        case "actions":
          actions.push(result);
          break;
        case "settings":
          settings.push(result);
          break;
      }
    });

    return { navigation, actions, settings };
  }, [searchResults]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Digite um comando ou busque..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6">
            <Search className="w-10 h-10 text-muted-foreground/50" />
            <p>Nenhum resultado encontrado.</p>
            <p className="text-sm text-muted-foreground">Tente buscar por outra palavra</p>
          </div>
        </CommandEmpty>
        
        {groupedResults.navigation.length > 0 && (
          <CommandGroup heading="Navegação">
            {groupedResults.navigation.map((result) => {
              const command = result.item;
              const labelMatch = result.matches?.find(m => m.key === 'label');
              return (
                <CommandItem
                  key={command.id}
                  onSelect={command.action}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <HighlightLabel text={command.label} indices={labelMatch?.indices} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {groupedResults.navigation.length > 0 && groupedResults.actions.length > 0 && (
          <CommandSeparator />
        )}
        
        {groupedResults.actions.length > 0 && (
          <CommandGroup heading="Ações Rápidas">
            {groupedResults.actions.map((result) => {
              const command = result.item;
              const labelMatch = result.matches?.find(m => m.key === 'label');
              return (
                <CommandItem
                  key={command.id}
                  onSelect={command.action}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <HighlightLabel text={command.label} indices={labelMatch?.indices} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {(groupedResults.navigation.length > 0 || groupedResults.actions.length > 0) && groupedResults.settings.length > 0 && (
          <CommandSeparator />
        )}
        
        {groupedResults.settings.length > 0 && (
          <CommandGroup heading="Configurações">
            {groupedResults.settings.map((result) => {
              const command = result.item;
              const labelMatch = result.matches?.find(m => m.key === 'label');
              return (
                <CommandItem
                  key={command.id}
                  onSelect={command.action}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <HighlightLabel text={command.label} indices={labelMatch?.indices} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
      
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
          <span>selecionar</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
          <span>navegar</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
          <span>fechar</span>
        </div>
      </div>
    </CommandDialog>
  );
}
