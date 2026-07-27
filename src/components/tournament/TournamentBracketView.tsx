import { useMemo, useState } from "react";
import { Crown, Medal, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { roundLabel } from "@/lib/tournamentBracket";
import type {
  TournamentMatch,
  TournamentParticipant,
} from "@/services/tournamentService";

interface TournamentBracketViewProps {
  matches: TournamentMatch[];
  participants: TournamentParticipant[];
  rounds: number;
  isAdmin: boolean;
  isReporting: boolean;
  onReport: (matchId: string, homeScore: number, awayScore: number) => void;
}

function participantLabel(p?: TournamentParticipant): string {
  if (!p) return "A definir";
  return p.full_name?.trim() || "Participante";
}

export function TournamentBracketView({
  matches,
  participants,
  rounds,
  isAdmin,
  isReporting,
  onReport,
}: TournamentBracketViewProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [scores, setScores] = useState<{ home: string; away: string }>({ home: "", away: "" });

  const byId = useMemo(() => {
    const map = new Map<string, TournamentParticipant>();
    participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [participants]);

  const grouped = useMemo(() => {
    const map = new Map<number, TournamentMatch[]>();
    matches.forEach((m) => {
      const list = map.get(m.round) || [];
      list.push(m);
      map.set(m.round, list);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const submit = (matchId: string) => {
    const home = Number.parseInt(scores.home, 10);
    const away = Number.parseInt(scores.away, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) return;
    onReport(matchId, home, away);
    setEditing(null);
    setScores({ home: "", away: "" });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {grouped.map(([round, roundMatches]) => (
        <div key={round} className="min-w-[240px] flex-1 space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Swords className="h-4 w-4 text-primary" aria-hidden />
            {roundLabel(round, rounds)}
          </h3>
          {roundMatches.map((match) => {
            const home = match.home_participant_id ? byId.get(match.home_participant_id) : undefined;
            const away = match.away_participant_id ? byId.get(match.away_participant_id) : undefined;
            const canReport = isAdmin && match.status === "ready";
            return (
              <div
                key={match.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  match.status === "decided" ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                )}
              >
                {[
                  { p: home, score: match.home_score, side: "home" as const },
                  { p: away, score: match.away_score, side: "away" as const },
                ].map(({ p, score, side }) => (
                  <div
                    key={side}
                    className={cn(
                      "flex items-center justify-between gap-2 py-1 text-sm",
                      match.winner_participant_id && p && match.winner_participant_id === p.id
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {p?.seed ? (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          {p.seed}
                        </Badge>
                      ) : null}
                      <span className="truncate">{participantLabel(p)}</span>
                      {p?.placement === "champion" && <Crown className="h-3.5 w-3.5 text-primary" aria-hidden />}
                      {p?.placement === "runner_up" && <Medal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                    </span>
                    {match.status === "decided" && <span className="tabular-nums">{score}</span>}
                  </div>
                ))}

                {match.status === "bye" && (
                  <Badge variant="outline" className="mt-1 text-[10px]">Avanço automático</Badge>
                )}

                {canReport && editing !== match.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 min-h-11 w-full"
                    onClick={() => {
                      setEditing(match.id);
                      setScores({ home: "", away: "" });
                    }}
                  >
                    Registrar placar
                  </Button>
                )}

                {canReport && editing === match.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Placar de ${participantLabel(home)}`}
                      value={scores.home}
                      onChange={(e) => setScores((s) => ({ ...s, home: e.target.value }))}
                      className="h-11"
                    />
                    <span className="text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Placar de ${participantLabel(away)}`}
                      value={scores.away}
                      onChange={(e) => setScores((s) => ({ ...s, away: e.target.value }))}
                      className="h-11"
                    />
                    <Button
                      size="sm"
                      className="min-h-11"
                      disabled={isReporting}
                      onClick={() => submit(match.id)}
                    >
                      OK
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
