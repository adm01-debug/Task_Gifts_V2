import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { OnboardingTourProvider } from "@/contexts/OnboardingTourContext";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MobileBottomNav, ScrollToTopFAB, NetworkStatusBar } from "@/components/mobile";
import { AccessibilityProvider, SkipLinks } from "@/components/accessibility";
import { TourSpotlight, TourLauncher } from "@/components/onboarding";
import { CommandPalette } from "@/components/CommandPalette";
import { FloatingCommandHint } from "@/components/ui/command-trigger";
import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useScrollRestoration } from "@/hooks/useNavigationHelpers";
 import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Providers } from "@/components/Providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Eagerly loaded routes (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy loaded routes (code splitting)
const Profile = lazy(() => import("./pages/Profile"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const QuestBuilder = lazy(() => import("./pages/QuestBuilder"));
const EngagementReports = lazy(() => import("./pages/EngagementReports"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const RealTimeAnalytics = lazy(() => import("./pages/RealTimeAnalytics"));
const LearningTrails = lazy(() => import("./pages/LearningTrails"));
const TrailDetail = lazy(() => import("./pages/TrailDetail"));
const Attendance = lazy(() => import("./pages/Attendance"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const Shop = lazy(() => import("./pages/Shop"));
const ShopAdmin = lazy(() => import("./pages/ShopAdmin"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const Achievements = lazy(() => import("./pages/Achievements"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PersonalStats = lazy(() => import("./pages/PersonalStats"));
const SeasonalEventDetail = lazy(() => import("./pages/SeasonalEventDetail"));
const Duels = lazy(() => import("./pages/Duels"));
const DailyQuiz = lazy(() => import("./pages/DailyQuiz"));
const QuizAdmin = lazy(() => import("./pages/QuizAdmin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const BIDashboard = lazy(() => import("./pages/BIDashboard"));
const Goals = lazy(() => import("./pages/Goals"));
const Checkins = lazy(() => import("./pages/Checkins"));
const Leagues = lazy(() => import("./pages/Leagues"));
const Surveys = lazy(() => import("./pages/Surveys"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Announcements = lazy(() => import("./pages/Announcements"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RateLimitDashboard = lazy(() => import("./pages/RateLimitDashboard"));
const SecurityDashboard = lazy(() => import("./pages/SecurityDashboard"));
const PermissionsAdmin = lazy(() => import("./pages/PermissionsAdmin"));
const AdminTelemetria = lazy(() => import("./pages/AdminTelemetria"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}

// Global mobile components wrapper
function MobileGlobalComponents() {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const hideBottomNav = location.pathname === "/auth" || 
                        location.pathname === "/forgot-password" || 
                        location.pathname === "/reset-password";
  
  if (!isMobile) return null;
  
  return (
    <>
      {!hideBottomNav && <MobileBottomNav />}
      <ScrollToTopFAB />
      <NetworkStatusBar />
      <PWAInstallPrompt />
    </>
  );
}

// Scroll restoration wrapper
function ScrollRestorationProvider({ children }: { children: React.ReactNode }) {
  useScrollRestoration();
   useSwipeNavigation();
  return <>{children}</>;
}

const App = () => (
  <Providers>
    <BrowserRouter>
      <OnboardingTourProvider>
        <ScrollRestorationProvider>
          <Suspense fallback={<PageLoader />}>
            <SkipLinks />
            <OfflineIndicator />
            <KeyboardShortcutsHelp />
            <CommandPalette />
            <FloatingCommandHint />
            <TourSpotlight />
            <TourLauncher />
            <MobileGlobalComponents />
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/security" element={<ProtectedRoute requiredRole="admin"><RateLimitDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/manager" element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>} />
              <Route path="/quest-builder" element={<ProtectedRoute requiredRole="manager"><QuestBuilder /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute requiredRole="manager"><EngagementReports /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute requiredRole="admin"><AuditLogs /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><RealTimeAnalytics /></ProtectedRoute>} />
              <Route path="/trails" element={<ProtectedRoute><LearningTrails /></ProtectedRoute>} />
              <Route path="/trails/:id" element={<ProtectedRoute><TrailDetail /></ProtectedRoute>} />
              <Route path="/ponto" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/executivo" element={<ProtectedRoute requiredRole="admin"><ExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
              <Route path="/conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
              <Route path="/estatisticas" element={<ProtectedRoute><PersonalStats /></ProtectedRoute>} />
              <Route path="/loja" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
              <Route path="/eventos/:eventId" element={<ProtectedRoute><SeasonalEventDetail /></ProtectedRoute>} />
              <Route path="/duelos" element={<ProtectedRoute><Duels /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><DailyQuiz /></ProtectedRoute>} />
              <Route path="/quiz/admin" element={<ProtectedRoute requiredRole="manager"><QuizAdmin /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
              <Route path="/bi" element={<ProtectedRoute requiredRole="manager"><BIDashboard /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
              <Route path="/checkins" element={<ProtectedRoute requiredRole="manager"><Checkins /></ProtectedRoute>} />
              <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
              <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
              <Route path="/security-dashboard" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
              <Route path="/admin/permissions" element={<ProtectedRoute requiredRole="admin"><PermissionsAdmin /></ProtectedRoute>} />
              <Route path="/admin/telemetria" element={<ProtectedRoute requiredRole="admin"><AdminTelemetria /></ProtectedRoute>} />
              <Route path="/loja/admin" element={<ProtectedRoute requiredRole="admin"><ShopAdmin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ScrollRestorationProvider>
      </OnboardingTourProvider>
    </BrowserRouter>
  </Providers>
);

export default App;
