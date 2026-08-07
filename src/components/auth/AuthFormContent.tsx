import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Clock, AlertTriangle, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";

type AuthView = "login" | "signup" | "forgot-password" | "2fa-verify";

interface AuthFormErrors {
  email?: string;
  password?: string;
  displayName?: string;
}

interface LoginFormProps {
  view: AuthView;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  errors: AuthFormErrors;
  setErrors: (v: AuthFormErrors) => void;
  loading: boolean;
  isLocked: boolean;
  failedAttempts: number;
  formatRemainingTime: () => string;
  onSubmit: (e: React.FormEvent) => void;
  onVerify2FA: (code: string) => Promise<boolean>;
  onCancel2FA: () => void;
  verifying2FA: boolean;
}

export function AuthFormContent({
  view,
  email,
  setEmail,
  password,
  setPassword,
  displayName,
  setDisplayName,
  showPassword,
  setShowPassword,
  errors,
  setErrors,
  loading,
  isLocked,
  failedAttempts,
  formatRemainingTime,
  onSubmit,
  onVerify2FA,
  onCancel2FA,
  verifying2FA,
}: LoginFormProps) {
  if (view === "2fa-verify") {
    return (
      <motion.div
        key="2fa-verify"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <TwoFactorVerify
          onVerify={onVerify2FA}
          onCancel={onCancel2FA}
          isLoading={verifying2FA}
        />
      </motion.div>
    );
  }

  if (view === "forgot-password") {
    return (
      <motion.div
        key="forgot-password"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-5"
      >
        <button
          type="button"
          onClick={onCancel2FA}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Redefinir senha</h3>
          <p className="text-sm text-muted-foreground">
            Por segurança, a redefinição de senha requer aprovação do seu gestor.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <InputField
            label="Email"
            type="email"
            icon={<Mail className="w-5 h-5" />}
            value={email}
            onChange={(v) => { setEmail(v); setErrors({ ...errors, email: undefined }); }}
            placeholder="seu@email.com"
            error={errors.email}
          />
          <Button type="submit" disabled={loading} className="w-full h-12 text-base" variant="hero">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Solicitar redefinição<ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.form
      key={view}
      initial={{ opacity: 0, x: view === "login" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: view === "login" ? 20 : -20 }}
      transition={{ duration: 0.2 }}
      onSubmit={onSubmit}
      className="space-y-5"
    >
      {view === "signup" && (
        <InputField
          label="Nome de exibição"
          type="text"
          icon={<User className="w-5 h-5" />}
          value={displayName}
          onChange={setDisplayName}
          placeholder="Seu nome no game"
        />
      )}

      <InputField
        label="Email"
        type="email"
        icon={<Mail className="w-5 h-5" />}
        value={email}
        onChange={(v) => { setEmail(v); setErrors({ ...errors, email: undefined }); }}
        placeholder="seu@email.com"
        error={errors.email}
      />

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Senha</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: undefined }); }}
            placeholder="••••••••"
            className={`w-full pl-12 pr-12 py-3 rounded-xl bg-muted/50 border outline-none transition-all ${
              errors.password
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1" role="alert">{errors.password}</p>}
        {view === "signup" && <PasswordStrengthIndicator password={password} className="mt-3" />}
      </div>

      {view === "login" && (
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Esqueceu sua senha?
          </Link>
        </div>
      )}

      {view === "login" && isLocked && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <Timer className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Conta bloqueada após {failedAttempts} tentativas.</span>
              <span className="font-mono font-bold text-lg">{formatRemainingTime()}</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {view === "login" && !isLocked && failedAttempts >= 3 && failedAttempts < 5 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              Atenção: {5 - failedAttempts} tentativa(s) restante(s) antes do bloqueio temporário.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Button
        type="submit"
        disabled={loading || (view === "login" && isLocked)}
        className="w-full h-12 text-base"
        variant="hero"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isLocked && view === "login" ? (
          <><Timer className="w-5 h-5 mr-2" />Aguarde {formatRemainingTime()}</>
        ) : (
          <>{view === "login" ? "Entrar" : "Criar conta"}<ArrowRight className="w-5 h-5 ml-2" /></>
        )}
      </Button>
    </motion.form>
  );
}

// Reusable input field
function InputField({
  label,
  type,
  icon,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  type: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-2 block">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-3 rounded-xl bg-muted/50 border outline-none transition-all ${
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1" role="alert">{error}</p>}
    </div>
  );
}
