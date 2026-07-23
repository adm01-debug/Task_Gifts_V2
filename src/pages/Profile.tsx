import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Flame, Star, Target, Edit2 } from "lucide-react";
import { RankingBadge } from "@/components/RankingBadge";
import { AvatarPreview } from "@/components/AvatarPreview";
import { ProfileAvatarSection } from "@/components/ProfileAvatarSection";
import { ProfileKudosSection } from "@/components/ProfileKudosSection";
import { CompetencyRadar } from "@/components/CompetencyRadar";
import { CertificationsPanel } from "@/components/CertificationsPanel";
import { SoundSettingsCard } from "@/components/SoundSettingsCard";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PushNotificationHistory } from "@/components/PushNotificationHistory";
import { CampaignNotificationPreferences } from "@/components/CampaignNotificationPreferences";
import { ExecutiveReportPreferenceToggle } from "@/components/ExecutiveReportPreferenceToggle";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { MyNineBoxWidget } from "@/components/MyNineBoxWidget";
import { MyDevelopmentPlanWidget } from "@/components/MyDevelopmentPlanWidget";
import { ProfileActivityTimeline } from "@/components/profile/ProfileActivityTimeline";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { MyCampaignBadgeCard } from "@/components/campaigns/MyCampaignBadgeCard";
import { logger } from "@/services/loggingService";
import { useAvatarConfig } from "@/hooks/useAvatar";
import { useUserRank } from "@/hooks/useUserRank";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
 import { PageShell } from "@/components/navigation";
 import { MobilePageLayout } from "@/components/mobile/MobilePageLayout";
import { User, Settings } from "lucide-react";

interface ProfileData {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  best_streak: number;
  quests_completed: number;
  created_at: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { data: rankData } = useUserRank();
  const { data: avatarConfig } = useAvatarConfig(user?.id);
  const isScrolled = useScrollHeader(10);
  const seoConfig = useSEO();

  useEffect(() => {
    if (!loading && !user) { navigate("/auth"); return; }
    if (user) fetchProfile();
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (data) setProfile(data as ProfileData);
    } catch (err: unknown) {
      logger.apiError('Profile load', err, 'Profile');
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoadingProfile(false);
    }
  };

  const xpForNextLevel = (level: number) => level * 500 + 500;
  const currentLevelXP = profile ? profile.xp % xpForNextLevel(profile.level) : 0;
  const xpProgress = profile ? (currentLevelXP / xpForNextLevel(profile.level)) * 100 : 0;

  if (loading || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const stats = [
    { icon: Zap, label: "XP Total", value: profile?.xp?.toLocaleString() || "0", color: "success" },
    { icon: Flame, label: "Streak Atual", value: `${profile?.streak || 0} dias`, color: "primary" },
    { icon: Star, label: "Coins", value: profile?.coins?.toLocaleString() || "0", color: "warning" },
    { icon: Target, label: "Quests", value: profile?.quests_completed?.toLocaleString() || "0", color: "secondary" },
  ];

   return (
     <PageShell title="Perfil">
       <MobilePageLayout
         title="Meu Perfil"
         icon={User}
         headerActions={
           <Button
             variant="ghost"
             size="icon"
             className="rounded-xl"
             onClick={() => toast.info("Configurações em breve")}
           >
             <Settings className="w-5 h-5" />
           </Button>
         }
       >
         <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
         <div className="fixed inset-0 pointer-events-none overflow-hidden">
           <motion.div className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]" style={{ background: "radial-gradient(circle, hsl(24 95% 55%) 0%, transparent 70%)", top: "5%", right: "10%" }} animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 15, repeat: Infinity }} />
         </div>
 
         <div className="container max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8 space-y-8 relative z-10">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="glass rounded-3xl p-8 border border-border">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <AvatarPreview userId={user?.id || ""} userLevel={profile?.level || 1} userStreak={profile?.streak || 0} displayName={profile?.display_name || "Jogador"} size="xl" showEffects={true} onClick={() => setAvatarOpen(true)} />
                {rankData?.rank && <div className="absolute -top-2 -left-2"><RankingBadge rank={rankData.rank} size="md" /></div>}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{profile?.display_name || "Jogador"}</h2>
                  <motion.button whileHover={{ scale: 1.1 }} className="p-1 rounded hover:bg-muted"><Edit2 className="w-4 h-4 text-muted-foreground" /></motion.button>
                </div>
                <p className="text-muted-foreground mb-4">{profile?.email}</p>
                <div className="max-w-md">
                  <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Nível {profile?.level || 1}</span><span className="text-xp font-semibold">{currentLevelXP.toLocaleString()} / {xpForNextLevel(profile?.level || 1).toLocaleString()} XP</span></div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full xp-bar rounded-full" /></div>
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-streak/20 to-streak/5 border border-streak/30 flex flex-col items-center justify-center glow-primary"><Flame className="w-6 h-6 text-streak streak-fire mb-1" /><span className="text-lg font-bold text-streak">{profile?.best_streak || 0}</span></div>
                <p className="text-xs text-muted-foreground mt-2">Melhor Streak</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }} whileHover={{ y: -4 }}
              className={`p-4 rounded-2xl border border-border bg-card ${stat.color === "success" ? "hover:border-success/50" : stat.color === "primary" ? "hover:border-primary/50" : stat.color === "warning" ? "hover:border-warning/50" : "hover:border-secondary/50"} transition-all duration-200`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color === "success" ? "bg-success/20 text-success" : stat.color === "primary" ? "bg-primary/20 text-primary" : stat.color === "warning" ? "bg-warning/20 text-warning" : "bg-secondary/20 text-secondary"}`}><stat.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {user?.id && profile && <SectionErrorBoundary sectionName="Coleção de Avatar"><ProfileAvatarSection userId={user.id} userLevel={profile.level} userStreak={profile.streak} userCoins={profile.coins} displayName={profile.display_name || "Jogador"} /></SectionErrorBoundary>}
        <SectionErrorBoundary sectionName="Metas de Campanha"><MyCampaignBadgeCard /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Conquistas"><ProfileAchievements /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Competências"><CompetencyRadar /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Certificações"><CertificationsPanel /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Kudos"><ProfileKudosSection userId={user?.id as string} /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="9-Box"><MyNineBoxWidget /></SectionErrorBoundary>
        <SectionErrorBoundary sectionName="PDI"><MyDevelopmentPlanWidget /></SectionErrorBoundary>
        <ProfileActivityTimeline userId={user?.id as string} />
        <SectionErrorBoundary sectionName="Segurança"><TwoFactorSetup /></SectionErrorBoundary>
        <SoundSettingsCard />
        <PushNotificationToggle />
        <SectionErrorBoundary sectionName="Histórico de Push"><PushNotificationHistory /></SectionErrorBoundary>
        <CampaignNotificationPreferences />
        <ExecutiveReportPreferenceToggle />
         </div>
       </MobilePageLayout>
     </PageShell>
   );
};

export default Profile;
