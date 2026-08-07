import { motion } from "framer-motion";
import { Activity, Zap, Trophy, Star, CheckCircle } from "lucide-react";

interface FeedStatsBarProps {
  stats: {
    total: number;
    xpGained: number;
    levelUps: number;
    kudos: number;
    quests: number;
  };
}

const items = [
  { key: "total", icon: Activity, color: "text-primary", label: "Total" },
  { key: "xpGained", icon: Zap, color: "text-yellow-500", label: "XP Ganho" },
  { key: "levelUps", icon: Trophy, color: "text-purple-500", label: "Level Ups" },
  { key: "kudos", icon: Star, color: "text-amber-500", label: "Kudos" },
  { key: "quests", icon: CheckCircle, color: "text-green-500", label: "Quests" },
] as const;

export function FeedStatsBar({ stats }: FeedStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card border border-border rounded-xl p-4 text-center"
        >
          <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
          <p className="text-2xl font-bold">{stats[item.key]}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
