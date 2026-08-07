import { motion } from "framer-motion";
import { Gift } from "lucide-react";

export function AuthBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
      <div className="relative z-10 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Gift className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Task Gifts</h1>
              <p className="text-sm text-muted-foreground">Gamify your work</p>
            </div>
          </div>

          <h2 className="text-display-lg mb-4">
            Transforme trabalho em{" "}
            <span className="gradient-text">diversão</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Complete quests diárias, suba de nível, desbloqueie recompensas e 
            compita com sua equipe. Produtividade nunca foi tão divertida.
          </p>

          <div className="space-y-4">
            {[
              { icon: "🎯", text: "Quests diárias personalizadas" },
              { icon: "🏆", text: "Leaderboards em tempo real" },
              { icon: "🎁", text: "Recompensas exclusivas" },
              { icon: "👥", text: "Desafios em equipe" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-muted-foreground">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function AuthBackground() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, hsl(24 95% 55%) 0%, transparent 70%)",
          top: "10%",
          left: "20%",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(210 100% 60%) 0%, transparent 70%)",
          bottom: "20%",
          right: "10%",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
