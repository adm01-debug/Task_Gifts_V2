import { motion } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CopilotSuggestion {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

const priorityConfig = {
  high: { label: "Alta", color: "bg-red-500/20 text-red-500 border-red-500/30" },
  medium: { label: "Média", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  low: { label: "Baixa", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
};

export function CopilotSuggestions({ suggestions }: { suggestions: CopilotSuggestion[] }) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Sugestões Inteligentes
        </CardTitle>
        <CardDescription>Recomendações baseadas nos dados da equipe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-muted">
                <suggestion.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{suggestion.title}</p>
                  <Badge variant="outline" className={`text-[10px] py-0 ${priorityConfig[suggestion.priority].color}`}>
                    {priorityConfig[suggestion.priority].label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
