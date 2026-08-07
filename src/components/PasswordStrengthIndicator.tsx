import { useState, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPasswordStrength, checkPasswordLeaked } from "@/lib/authValidations";
import { cn } from "@/lib/utils";
import { 
  Check, 
  X, 
  AlertTriangle, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  Eye,
  KeyRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showLeakCheck?: boolean;
}

export const PasswordStrengthIndicator = forwardRef<HTMLDivElement, PasswordStrengthIndicatorProps>(
  function PasswordStrengthIndicator({ 
    password, 
    className,
    showLeakCheck = true
  }, ref) {
  const [leakStatus, setLeakStatus] = useState<{
    checked: boolean;
    checking: boolean;
    isLeaked: boolean;
    occurrences: number;
  }>({
    checked: false,
    checking: false,
    isLeaked: false,
    occurrences: 0,
  });

  // Debounce leak check
  useEffect(() => {
    if (!password || password.length < 8 || !showLeakCheck) {
      setLeakStatus({ checked: false, checking: false, isLeaked: false, occurrences: 0 });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLeakStatus(prev => ({ ...prev, checking: true }));
      const result = await checkPasswordLeaked(password);
      setLeakStatus({
        checked: true,
        checking: false,
        isLeaked: result.isLeaked,
        occurrences: result.occurrences,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password, showLeakCheck]);

  if (!password) return null;
  
  const { score, label, color, checks } = getPasswordStrength(password);
  const maxScore = 6;
  const percentage = (score / maxScore) * 100;

  const getStrengthIcon = () => {
    if (score <= 2) return <ShieldAlert className="h-4 w-4 text-destructive" />;
    if (score <= 4) return <Shield className="h-4 w-4 text-yellow-500" />;
    return <ShieldCheck className="h-4 w-4 text-green-500" />;
  };

  const requirements = [
    { 
      key: 'minLength', 
      label: 'Mínimo 8 caracteres', 
      met: checks.minLength,
      icon: KeyRound
    },
    { 
      key: 'hasUppercase', 
      label: 'Uma letra maiúscula (A-Z)', 
      met: checks.hasUppercase,
      icon: null
    },
    { 
      key: 'hasLowercase', 
      label: 'Uma letra minúscula (a-z)', 
      met: checks.hasLowercase,
      icon: null
    },
    { 
      key: 'hasNumber', 
      label: 'Um número (0-9)', 
      met: checks.hasNumber,
      icon: null
    },
    { 
      key: 'hasSpecial', 
      label: 'Um caractere especial (!@#$%)', 
      met: checks.hasSpecial,
      icon: null
    },
  ];

  const formatOccurrences = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div ref={ref} className={cn("space-y-3", className)}>
      {/* Strength Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStrengthIcon()}
          <span className="text-sm font-medium">Força da senha</span>
        </div>
        <Badge 
          variant={score <= 2 ? "destructive" : score <= 4 ? "secondary" : "default"}
          className={cn(
            "transition-all duration-300",
            score <= 2 ? "bg-destructive/20 text-destructive border-destructive/30" : 
            score <= 4 ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" : 
            "bg-green-500/20 text-green-600 border-green-500/30"
          )}
        >
          {label}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors duration-300", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Segment markers */}
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-background/50 last:border-0" />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5 pt-1">
        {requirements.map((req, index) => (
          <motion.div
            key={req.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            <AnimatePresence mode="wait">
              {req.met ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/20"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </motion.div>
              ) : (
                <motion.div
                  key="x"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-muted"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
            <span>{req.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Leaked Password Check */}
      {showLeakCheck && password.length >= 8 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pt-2 border-t border-border/50"
        >
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Verificação de vazamentos
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            {leakStatus.checking ? (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Verificando em bases de dados vazados...</span>
              </motion.div>
            ) : leakStatus.checked ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-start gap-2 mt-2 p-2 rounded-md text-xs",
                  leakStatus.isLeaked 
                    ? "bg-destructive/10 border border-destructive/30" 
                    : "bg-green-500/10 border border-green-500/30"
                )}
              >
                {leakStatus.isLeaked ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">
                        Senha encontrada em vazamentos!
                      </p>
                      <p className="text-destructive/80 mt-0.5">
                        Esta senha apareceu {formatOccurrences(leakStatus.occurrences)} vezes em vazamentos de dados. 
                        Escolha uma senha diferente.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-600">
                        Senha não encontrada em vazamentos
                      </p>
                      <p className="text-green-600/80 mt-0.5">
                        Esta senha não foi exposta em vazamentos conhecidos.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
});
