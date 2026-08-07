import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Search, Globe, Monitor, LogOut, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";

interface SessionLog {
  id: string;
  user_id: string;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  login_at: string;
  logout_at: string | null;
  is_active: boolean;
  last_activity_at: string;
}

export function SessionsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["session-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_logs")
        .select("*")
        .order("login_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SessionLog[];
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("session_logs")
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sessão encerrada");
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["security-stats"] });
    },
    onError: () => {
      toast.error("Erro ao encerrar sessão");
    },
  });

  const terminateAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("session_logs")
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
        })
        .eq("is_active", true)
        .neq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Todas as sessões foram encerradas");
      queryClient.invalidateQueries({ queryKey: ["session-logs"] });
      queryClient.invalidateQueries({ queryKey: ["security-stats"] });
    },
    onError: () => {
      toast.error("Erro ao encerrar sessões");
    },
  });

  const activeSessions = sessions?.filter((s) => s.is_active) || [];
  
  // Fuzzy search with Fuse.js
  const searchResults = useFuseSearch(
    sessions || [],
    ['ip_address', 'browser', 'os', 'city', 'country'],
    search,
    { ...SEARCH_PRESETS.loose, limit: 100 }
  );
  const filteredSessions = searchResults.map(r => r.item);

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: "Desconhecido", os: "Desconhecido" };
    
    let browser = "Outro";
    let os = "Outro";

    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";

    return { browser, os };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Sessões
            <Badge variant="secondary">{activeSessions.length} ativas</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => terminateAllMutation.mutate()}
              disabled={terminateAllMutation.isPending || activeSessions.length <= 1}
            >
              {terminateAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Encerrar Todas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Navegador/OS</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions?.map((session) => {
                  const { browser, os } = session.browser && session.os 
                    ? { browser: session.browser, os: session.os }
                    : parseUserAgent(session.user_agent);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {session.is_active ? (
                          <Badge className="bg-green-500">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Encerrada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{session.ip_address || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {browser} / {os}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(session.login_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(session.last_activity_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {session.is_active && session.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => terminateMutation.mutate(session.id)}
                            disabled={terminateMutation.isPending}
                          >
                            <LogOut className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
