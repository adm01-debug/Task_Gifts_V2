import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetection } from "./useDeviceDetection";
import { logger } from "@/services/loggingService";
import { useGlobalMessage } from "@/components/GlobalMessageProvider";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useGlobalMessage();

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { registerDevice } = useDeviceDetection();

   const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        showMessage(error.message, "error", "Falha na Autenticação");
        return { error };
      }

      // Registrar dispositivo após login bem-sucedido
      if (data?.user) {
        registerDevice(data.user.id).catch((err: unknown) => logger.apiError('registerDevice', err, 'useAuth'));
      }
      
      return { error: null };
    } catch (err: unknown) {
      const error = err as Error;
      showMessage(error.message, "error", "Erro Inesperado");
      return { error };
    }
   }, [registerDevice, showMessage]);

   const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        showMessage(error.message, "error", "Falha no Cadastro");
        return { error };
      }

      if (data?.user) {
        // Registrar dispositivo após cadastro bem-sucedido (auto-login dependendo da config)
        registerDevice(data.user.id).catch((err: unknown) => logger.apiError('registerDevice', err, 'useAuth'));
      }
      
      return { error: null };
    } catch (err: unknown) {
      const error = err as Error;
      showMessage(error.message, "error", "Erro Inesperado");
      return { error };
    }
   }, [registerDevice, showMessage]);

   const signOut = useCallback(async () => {
     try {
       await supabase.auth.signOut();
       // Clear local state if needed (most is handled by onAuthStateChange)
       window.location.href = "/auth"; // Force redirect to clear any sensitive state
     } catch (err: unknown) {
       logger.apiError('signOut', err, 'useAuth');
       // Fallback redirect
       window.location.href = "/auth";
     }
   }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
