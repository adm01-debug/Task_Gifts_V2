import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLoginLockout } from "@/hooks/useLoginLockout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { passwordResetService } from "@/services/passwordResetService";
import { twoFactorService } from "@/services/twoFactorService";
import { lovable } from "@/integrations/lovable/index";
import { emailSchema, loginSchema, signupSchema } from "@/lib/authValidations";
import { IpCheckingScreen, IpBlockedScreen, AuthLoadingScreen } from "@/components/auth/AuthScreens";
import { AuthBranding, AuthBackground } from "@/components/auth/AuthBranding";
import { AuthFormContent } from "@/components/auth/AuthFormContent";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";

type AuthView = "login" | "signup" | "forgot-password" | "2fa-verify";

interface IpVerificationResult {
  allowed: boolean;
  ip: string;
  reason: string;
  message: string;
}

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [isCheckingIp, setIsCheckingIp] = useState(true);
  const [isIpAllowed, setIsIpAllowed] = useState<boolean | null>(null);
  const [ipInfo, setIpInfo] = useState<IpVerificationResult | null>(null);

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isLocked, failedAttempts, checkLockout, logFailedAttempt, resetAttempts, formatRemainingTime } = useLoginLockout(email);

  const checkIpAccess = async () => {
    setIsCheckingIp(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-ip');
      if (fnError) {
        logger.apiError('verifyIP', fnError, 'Auth');
        setIsIpAllowed(true);
        return;
      }
      const result = data as IpVerificationResult;
      setIpInfo(result);
      setIsIpAllowed(result.allowed);
      if (!result.allowed) toast.error('Acesso bloqueado: IP não autorizado');
    } catch (err: unknown) {
      logger.apiError('IP check', err, 'Auth');
      setIsIpAllowed(true);
    } finally {
      setIsCheckingIp(false);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) {
            logger.apiError('setSession callback', error, 'Auth');
            toast.error('Erro ao processar autenticação. Tente novamente.');
          } else {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err: unknown) {
          logger.apiError('Auth callback', err, 'Auth');
        }
      }
    };
    handleAuthCallback();
    checkIpAccess();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Gate screens
  if (isCheckingIp) return <IpCheckingScreen />;
  if (isIpAllowed === false) return <IpBlockedScreen ipInfo={ipInfo} onRetry={checkIpAccess} />;
  if (authLoading || user) return <AuthLoadingScreen />;

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (view === "forgot-password") {
      const r = emailSchema.safeParse(email);
      if (!r.success) newErrors.email = r.error.errors[0].message;
    } else if (view === "login") {
      const r = loginSchema.safeParse({ email, password });
      if (!r.success) r.error.errors.forEach((e) => {
        if (e.path[0] === "email") newErrors.email = e.message;
        if (e.path[0] === "password") newErrors.password = e.message;
      });
    } else {
      const r = signupSchema.safeParse({ email, password, displayName: displayName || undefined });
      if (!r.success) r.error.errors.forEach((e) => {
        if (e.path[0] === "email") newErrors.email = e.message;
        if (e.path[0] === "password") newErrors.password = e.message;
        if (e.path[0] === "displayName") newErrors.displayName = e.message;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const r = emailSchema.safeParse(email);
    if (!r.success) { setErrors({ email: r.error.errors[0].message }); return; }
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles").select("id").eq("email", email).maybeSingle();
      if (userError || !userData) { toast.error("Email não encontrado no sistema"); setLoading(false); return; }
      await passwordResetService.requestPasswordReset();
      toast.success("Solicitação enviada! Aguarde a aprovação do seu gestor.", { duration: 6000 });
      setView("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("pendente")) toast.info("Você já possui uma solicitação pendente.");
      else toast.error("Erro ao solicitar reset de senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "forgot-password") { await handleForgotPassword(); return; }
    if (!validateForm()) return;
    if (view === "login") {
      const lockoutStatus = await checkLockout();
      if (lockoutStatus?.is_locked) {
        toast.error(`Conta bloqueada. Tente em ${Math.ceil(lockoutStatus.remaining_seconds / 60)} min.`);
        return;
      }
    }
    setLoading(true);
    try {
      if (view === "login") {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const lr = await logFailedAttempt(error.message);
          if (error.message.includes("Invalid login credentials")) {
            if (lr?.is_locked) toast.error(`Conta bloqueada por ${Math.ceil(lr.remaining_seconds / 60)} min.`);
            else if (lr && lr.failed_attempts >= 3) toast.error(`Credenciais incorretas. ${5 - lr.failed_attempts} tentativa(s).`);
            else toast.error("Email ou senha incorretos");
          } else toast.error(error.message);
        } else if (data.user) {
          await resetAttempts();
          const is2FA = await twoFactorService.isTwoFactorEnabled(data.user.id);
          if (is2FA) {
            await supabase.auth.signOut();
            setPendingUserId(data.user.id);
            setView("2fa-verify");
          } else {
            toast.success("Bem-vindo de volta! 🎮");
            navigate("/");
          }
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) {
          toast.error(error.message.includes("User already registered") ? "Este email já está cadastrado" : error.message);
        } else {
          toast.success("Conta criada! Vamos jogar! 🚀");
          navigate("/");
        }
      }
    } catch (err: unknown) {
      logger.apiError('Auth submit', err, 'Auth');
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code: string): Promise<boolean> => {
    if (!pendingUserId) return false;
    setVerifying2FA(true);
    try {
      const isValid = await twoFactorService.verifyToken(pendingUserId, code);
      if (isValid) {
        const { error } = await signIn(email, password);
        if (error) { toast.error("Erro ao finalizar login"); return false; }
        toast.success("Bem-vindo de volta! 🎮");
        navigate("/");
        return true;
      }
      return false;
    } catch (err: unknown) {
      logger.apiError('2FA verification', err, 'Auth');
      return false;
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleCancel2FA = () => { setPendingUserId(null); setView("login"); setPassword(""); };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Erro ao fazer login com Google"); logger.apiError("Google OAuth", result.error, "Auth"); }
    } catch (err: unknown) {
      logger.apiError("Google OAuth", err, "Auth");
      toast.error("Erro ao fazer login com Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <AuthBackground />
      <AuthBranding />

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-3xl p-8 border border-border">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Task Gifts</span>
            </div>

            {/* Tabs */}
            {view !== "forgot-password" && view !== "2fa-verify" && (
              <div className="flex gap-1 p-1 rounded-xl bg-muted/50 mb-8">
                {["Login", "Cadastro"].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setView(i === 0 ? "login" : "signup")}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      (i === 0 ? view === "login" : view === "signup")
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              <AuthFormContent
                view={view}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                displayName={displayName}
                setDisplayName={setDisplayName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                setErrors={setErrors}
                loading={loading}
                isLocked={isLocked}
                failedAttempts={failedAttempts}
                formatRemainingTime={formatRemainingTime}
                onSubmit={handleSubmit}
                onVerify2FA={handle2FAVerify}
                onCancel2FA={handleCancel2FA}
                verifying2FA={verifying2FA}
              />
            </AnimatePresence>

            {view !== "forgot-password" && view !== "2fa-verify" && (
              <GoogleOAuthButton loading={googleLoading} onClick={handleGoogleLogin} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
