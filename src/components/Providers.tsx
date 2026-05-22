import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AchievementNotificationProvider } from "@/contexts/AchievementNotificationContext";
import { SoundSettingsProvider } from "@/contexts/SoundSettingsContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IpAccessGuard } from "@/components/IpAccessGuard";
import { AccessibilityProvider } from "@/components/accessibility";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { GlobalMessageProvider } from "@/components/GlobalMessageProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GlobalMessageProvider>
            <AccessibilityProvider>
              <SoundSettingsProvider>
                <IpAccessGuard>
                  <AuthProvider>
                    <GamificationProvider>
                      <AchievementNotificationProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner />
                          {children}
                        </TooltipProvider>
                      </AchievementNotificationProvider>
                    </GamificationProvider>
                  </AuthProvider>
                </IpAccessGuard>
              </SoundSettingsProvider>
            </AccessibilityProvider>
          </GlobalMessageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
