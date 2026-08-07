import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface CopilotAlert {
  id: string;
  type: "urgent" | "warning" | "positive" | "suggestion";
  icon: React.ElementType;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  }[];
  metadata?: Record<string, unknown>;
}

export function getAlertStyle(type: CopilotAlert["type"]) {
  switch (type) {
    case "urgent": return "bg-red-500/10 border-red-500/30 hover:border-red-500/50";
    case "warning": return "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50";
    case "positive": return "bg-green-500/10 border-green-500/30 hover:border-green-500/50";
    case "suggestion": return "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50";
    default: return "bg-muted/30 border-border/50";
  }
}

export function getAlertIconColor(type: CopilotAlert["type"]) {
  switch (type) {
    case "urgent": return "text-red-500";
    case "warning": return "text-amber-500";
    case "positive": return "text-green-500";
    case "suggestion": return "text-blue-500";
    default: return "text-muted-foreground";
  }
}

interface CopilotAlertCardProps {
  alert: CopilotAlert;
  onDismiss: (id: string) => void;
  variant?: "full" | "compact";
}

export function CopilotAlertCard({ alert, onDismiss, variant = "full" }: CopilotAlertCardProps) {
  if (variant === "compact") {
    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-3 rounded-lg border ${getAlertStyle(alert.type)}`}
      >
        <div className="flex items-start gap-3">
          <alert.icon className={`w-5 h-5 ${getAlertIconColor(alert.type)} shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6" onClick={() => onDismiss(alert.id)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border ${getAlertStyle(alert.type)} transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <alert.icon className={`w-5 h-5 ${getAlertIconColor(alert.type)}`} />
            </div>
            {alert.userAvatar !== undefined && (
              <Avatar className="w-10 h-10">
                <AvatarImage src={alert.userAvatar || ""} />
                <AvatarFallback>{alert.userName?.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
              {alert.actions && alert.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {alert.actions.map((action, idx) => (
                    <Button key={idx} size="sm" variant={action.variant || "default"} onClick={action.onClick}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onDismiss(alert.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
