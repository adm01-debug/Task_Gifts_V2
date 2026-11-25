import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);

    try {
      // A RPC registra o pedido e não informa se o e-mail tem conta,
      // para não permitir descobrir quem está cadastrado.
      const { error } = await supabase.rpc("request_password_reset_by_email", {
        p_email: data.email.trim(),
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("Muitas tentativas. Aguarde alguns minutos.");
          return;
        }
        throw error;
      }

      setEmailSent(true);
      setSentEmail(data.email);
      toast.success("Solicitação registrada!");
    } catch {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Solicitação Registrada!</CardTitle>
            <CardDescription className="text-base">
              Se existe uma conta com <strong>{sentEmail}</strong>, o pedido de redefinição de senha
              aguarda a aprovação do seu gestor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Quem libera a redefinição é o seu gestor. Assim que ele aprovar, você recebe um link
                válido por <strong>1 hora</strong>.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
              >
                Enviar para outro email
              </Button>
              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription className="text-base">
            Digite seu email para pedir a redefinição. Por segurança, a liberação é feita pelo seu gestor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Solicitar redefinição
                  </>
                )}
              </Button>

              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
