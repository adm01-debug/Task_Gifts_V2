import { motion } from "framer-motion";
import { BookOpen, Play, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TrailStatsCardsProps {
  totalTrails: number;
  inProgressCount: number;
  completedCount: number;
  totalXpEarned: number;
}

export function TrailStatsCards({ totalTrails, inProgressCount, completedCount, totalXpEarned }: TrailStatsCardsProps) {
  const stats = [
    { label: "Catalog", value: totalTrails, icon: BookOpen, gradient: "from-primary/15 to-primary/5", border: "border-primary/30", iconBg: "bg-primary/20", iconColor: "text-primary", subtitle: "Active Protocols" },
    { label: "Active", value: inProgressCount, icon: Play, gradient: "from-amber-500/15 to-amber-500/5", border: "border-amber-500/30", iconBg: "bg-amber-500/20", iconColor: "text-amber-500", subtitle: "In Progress" },
    { label: "Mastered", value: completedCount, icon: CheckCircle2, gradient: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/30", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-500", subtitle: "Total Finished" },
    { label: "Reward", value: totalXpEarned, icon: Sparkles, gradient: "from-purple-500/15 to-purple-500/5", border: "border-purple-500/30", iconBg: "bg-purple-500/20", iconColor: "text-purple-500", subtitle: "Total XP" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          whileHover={{ y: -5, scale: 1.02 }}
          className="h-full"
        >
          <Card className={`h-full bg-gradient-to-br ${stat.gradient} ${stat.border} border-2 overflow-hidden relative group`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rotate-45 translate-x-8 -translate-y-8 group-hover:translate-x-6 group-hover:-translate-y-6 transition-transform duration-500" />
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center justify-between w-full">
                <div className={`p-2.5 rounded-xl ${stat.iconBg} shadow-inner`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</span>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
