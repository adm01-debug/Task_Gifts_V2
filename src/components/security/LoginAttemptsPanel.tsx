import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShieldAlert, Search, Globe, Mail, XCircle, CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  attempt_type: string;
  error_message: string | null;
  created_at: string;
}

export function LoginAttemptsPanel() {
  const [search, setSearch] = useState("");

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["login-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as LoginAttempt[];
    },
    refetchInterval: 30000,
  });

  const filteredAttempts = attempts?.filter(
    (a) =>
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.ip_address.includes(search)
  );

  const getAttemptTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      password: "bg-blue-500/10 text-blue-500",
      "2fa": "bg-purple-500/10 text-purple-500",
      recovery: "bg-yellow-500/10 text-yellow-500",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
            Tentativas de Login
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar email ou IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
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
        ) : filteredAttempts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p>Nenhuma tentativa registrada</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts?.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      {attempt.error_message ? (
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="w-4 h-4" />
                          Falha
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          OK
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{attempt.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{attempt.ip_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAttemptTypeBadge(attempt.attempt_type)}>
                        {attempt.attempt_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {attempt.error_message || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(attempt.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
