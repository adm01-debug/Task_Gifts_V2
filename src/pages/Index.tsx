// Core & Libs
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

 // Components
 import { AppSidebar } from "@/components/AppSidebar";
import { MobileDrawer } from "@/components/MobileDrawer";
import { MobileBottomNav } from "@/components/mobile";
import { StatsGrid, QuickActions } from "@/components/StatsGrid";
import { AchievementContainer, useAchievements } from "@/components/AchievementSystem";
import { OnboardingWidget } from "@/components/onboarding/OnboardingWidget";
import { SeasonalEventBanner } from "@/components/SeasonalEventBanner";
import { DashboardHeader, DashboardLeftColumn, DashboardRightColumn, DashboardFooter } from "@/components/dashboard";
 import { SectionWrapper } from "@/components/PageWrapper";
 import { SEOHead } from "@/components/SEOHead";
import { PageShell } from "@/components/navigation";

// Hooks
import { useIsMobileWithHydration } from "@/hooks/use-mobile";
import { useListenToRankChanges } from "@/hooks/useListenToRankChanges";
import { useCompetencyAlerts } from "@/hooks/useCompetencyAlerts";
import { useSEO } from "@/hooks/useSEO";
import { useTour } from "@/contexts/OnboardingTourContext";
import { dashboardTour } from "@/components/onboarding";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

/**
 * Index - Main Dashboard Page
 * 
 * Architecture Notes:
 * - Auth redirect is handled by ProtectedRoute wrapper in App.tsx
 * - Layout is split into semantic sub-components for maintainability
 * - Below-the-fold widgets use LazyWidget with Intersection Observer
 * - Side-effect hooks are explicitly named for clarity
 * - Sidebar state persists in localStorage
 */
function Index() {
  // SEO configuration
  const seoConfig = useSEO();

  // Persist sidebar state in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Defensive defaults for useAchievements
  const { 
    achievements = [], 
    hideAchievement = () => {}, 
    levelUp = null, 
    closeLevelUp = () => {} 
  } = useAchievements() ?? {};
  
  // Use hydration-aware mobile detection to prevent layout shift
  const { isMobile, isHydrated } = useIsMobileWithHydration();

  // Side-effect listeners - explicitly named for clarity
  useListenToRankChanges();
  useCompetencyAlerts();
  
  // Register dashboard tour
  useTour(dashboardTour);

  // Persist sidebar state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore localStorage errors (e.g., private browsing)
    }
  }, [sidebarCollapsed]);

  // Close mobile drawer when switching to desktop viewport
  useEffect(() => {
    if (!isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, mobileDrawerOpen]);

  // Memoized handlers
   const handleCloseMobileDrawer = useCallback(() => setMobileDrawerOpen(false), []);
   const handleToggleSidebar = useCallback(() => {
     setSidebarCollapsed(prev => !prev);
   }, []);
   
   const handleMenuClick = useCallback(() => {
     if (isMobile) {
       setMobileDrawerOpen(true);
     } else {
       handleToggleSidebar();
     }
   }, [isMobile, handleToggleSidebar]);

   return (
      <PageShell
        title="Dashboard"
        hideBackButton
        hideBreadcrumbs
        hideHeader
        className="flex bg-background min-h-screen relative overflow-hidden"
      >
        {/* Premium Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" 
            style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
            animate={{ 
              x: [0, 50, 0], 
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[150px]" 
            style={{ background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)" }}
            animate={{ 
              x: [0, -40, 0], 
              y: [0, 60, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />
        </div>

       <SEOHead 
         title={seoConfig.title}
         description={seoConfig.description}
         keywords={seoConfig.keywords}
       />
       
       {/* Achievement System */}
       <AchievementContainer
         achievements={achievements}
         onHide={hideAchievement}
         levelUp={levelUp}
         onCloseLevelUp={closeLevelUp}
       />
 
       {/* Mobile Drawer */}
       <MobileDrawer open={mobileDrawerOpen} onClose={handleCloseMobileDrawer} />
 
       {/* Desktop Sidebar - Skeleton placeholder prevents layout shift during hydration */}
       {!isMobile && (
         isHydrated ? (
           <AppSidebar 
             collapsed={sidebarCollapsed} 
             onToggle={handleToggleSidebar} 
           />
         ) : (
           <div 
             className="hidden lg:block w-64 shrink-0 bg-card border-r border-border" 
             aria-hidden="true" 
           />
         )
       )}
 
        {/* Main Content Container */}
        <div id="main-content" className={`flex-1 overflow-auto relative z-10 ${isMobile ? 'pb-24' : ''}`} aria-label="Dashboard principal">
         {/* Top Header */}
         <DashboardHeader onMenuClick={handleMenuClick} />
 
         {/* Dashboard Content */}
         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
           {/* Seasonal Event Banner */}
           <SeasonalEventBanner />
           
           {/* Onboarding Widget */}
           <OnboardingWidget />
 
           {/* Stats Grid */}
           <SectionWrapper sectionName="Estatísticas">
             <section aria-labelledby="stats-heading">
               <h2 id="stats-heading" className="sr-only">Estatísticas do usuário</h2>
               <StatsGrid />
             </section>
           </SectionWrapper>
 
           {/* Quick Actions */}
           <SectionWrapper sectionName="Ações Rápidas">
             <section className="flex flex-wrap items-center gap-2 md:gap-4" aria-label="Ações rápidas">
               <QuickActions />
             </section>
           </SectionWrapper>
 
           {/* Main Grid - Split into semantic columns */}
           <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
             {/* Left Column - Missions, Quests, Team & Recognition */}
             <SectionWrapper sectionName="Coluna Principal">
               <DashboardLeftColumn />
             </SectionWrapper>
 
             {/* Right Column - Combo, Attendance, Rankings, Leaderboard, Analytics & Rewards */}
             <SectionWrapper sectionName="Coluna Lateral">
               <DashboardRightColumn />
             </SectionWrapper>
           </div>
         </div>
 
         {/* Footer */}
         <DashboardFooter />
       </div>
 
       {/* Mobile Bottom Navigation */}
       {isMobile && <MobileBottomNav />}
     </PageShell>
   );
}

export default Index;
