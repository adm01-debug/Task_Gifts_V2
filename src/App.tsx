import { TopLoadingBar } from "@/components/navigation/TopLoadingBar";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/navigation/PageTransition";
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
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useScrollRestoration } from "@/hooks/useNavigationHelpers";
 import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Providers } from "@/components/Providers";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

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
const WebhooksAdmin = lazy(() => import("./pages/WebhooksAdmin"));
const WebhookSubscriptionDetail = lazy(() => import("./pages/WebhookSubscriptionDetail"));
const WebhookSubscriptionNew = lazy(() => import("./pages/WebhookSubscriptionNew"));
const WebhooksExecutive = lazy(() => import("./pages/WebhooksExecutive"));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 1],
            opacity: 1,
          }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-xl overflow-hidden">
            <Shield className="w-10 h-10 text-primary" />
            
            {/* Shimmer effect inside the logo box */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
        
        {/* Pulse rings */}
        <motion.div 
          className="absolute inset-0 rounded-2xl border-2 border-primary/30"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute inset-0 rounded-2xl border-2 border-primary/20"
          animate={{ scale: [1, 2], opacity: [0.3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="mt-12 text-center max-w-xs">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
        >
          Gamificação Corporativa
        </motion.h2>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1 bg-muted rounded-full mt-4 overflow-hidden"
        >
          <motion.div 
            className="h-full bg-primary"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4 }}
          className="text-sm mt-3 font-medium text-muted-foreground animate-pulse"
        >
          Preparando sua experiência 10/10...
        </motion.p>
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

const AnimatedRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <PageTransition><Auth /></PageTransition>} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/security" element={<ProtectedRoute requiredRole="admin"><PageTransition><RateLimitDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute requiredRole="manager"><PageTransition><ManagerDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/quest-builder" element={<ProtectedRoute requiredRole="manager"><PageTransition><QuestBuilder /></PageTransition></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredRole="manager"><PageTransition><EngagementReports /></PageTransition></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute requiredRole="admin"><PageTransition><AuditLogs /></PageTransition></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageTransition><RealTimeAnalytics /></PageTransition></ProtectedRoute>} />
        <Route path="/trails" element={<ProtectedRoute><PageTransition><LearningTrails /></PageTransition></ProtectedRoute>} />
        <Route path="/trails/:id" element={<ProtectedRoute><PageTransition><TrailDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/ponto" element={<ProtectedRoute><PageTransition><Attendance /></PageTransition></ProtectedRoute>} />
        <Route path="/executivo" element={<ProtectedRoute requiredRole="admin"><PageTransition><ExecutiveDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><PageTransition><SocialFeed /></PageTransition></ProtectedRoute>} />
        <Route path="/conquistas" element={<ProtectedRoute><PageTransition><Achievements /></PageTransition></ProtectedRoute>} />
        <Route path="/estatisticas" element={<ProtectedRoute><PageTransition><PersonalStats /></PageTransition></ProtectedRoute>} />
        <Route path="/loja" element={<ProtectedRoute><PageTransition><Shop /></PageTransition></ProtectedRoute>} />
        <Route path="/eventos/:eventId" element={<ProtectedRoute><PageTransition><SeasonalEventDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/duelos" element={<ProtectedRoute><PageTransition><Duels /></PageTransition></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><PageTransition><DailyQuiz /></PageTransition></ProtectedRoute>} />
        <Route path="/quiz/admin" element={<ProtectedRoute requiredRole="manager"><PageTransition><QuizAdmin /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><PageTransition><AdminPanel /></PageTransition></ProtectedRoute>} />
        <Route path="/bi" element={<ProtectedRoute requiredRole="manager"><PageTransition><BIDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><PageTransition><Goals /></PageTransition></ProtectedRoute>} />
        <Route path="/checkins" element={<ProtectedRoute requiredRole="manager"><PageTransition><Checkins /></PageTransition></ProtectedRoute>} />
        <Route path="/leagues" element={<ProtectedRoute><PageTransition><Leagues /></PageTransition></ProtectedRoute>} />
        <Route path="/surveys" element={<ProtectedRoute><PageTransition><Surveys /></PageTransition></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><PageTransition><Feedback /></PageTransition></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><PageTransition><Announcements /></PageTransition></ProtectedRoute>} />
        <Route path="/security-dashboard" element={<ProtectedRoute><PageTransition><SecurityDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/permissions" element={<ProtectedRoute requiredRole="admin"><PageTransition><PermissionsAdmin /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/telemetria" element={<ProtectedRoute requiredRole="admin"><PageTransition><AdminTelemetria /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/webhooks" element={<ProtectedRoute requiredRole="admin"><PageTransition><WebhooksAdmin /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/webhooks/executive" element={<ProtectedRoute requiredRole="admin"><PageTransition><WebhooksExecutive /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/webhooks/new" element={<ProtectedRoute requiredRole="admin"><PageTransition><WebhookSubscriptionNew /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/webhooks/:id" element={<ProtectedRoute requiredRole="admin"><PageTransition><WebhookSubscriptionDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/loja/admin" element={<ProtectedRoute requiredRole="admin"><PageTransition><ShopAdmin /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <Providers>
    <GlobalErrorBoundary>
      <BrowserRouter>
      <OnboardingTourProvider>
        <ScrollRestorationProvider>
          <Suspense fallback={<PageLoader />}>
            <TopLoadingBar />
            <SkipLinks />
            <KeyboardShortcutsHelp />
            <CommandPalette />
            <FloatingCommandHint />
            <TourSpotlight />
            <TourLauncher />
            <MobileGlobalComponents />
            <AnimatedRoutes />
          </Suspense>
        </ScrollRestorationProvider>
      </OnboardingTourProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </Providers>
);

export default App;
