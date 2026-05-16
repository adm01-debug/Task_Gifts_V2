import { Megaphone } from "lucide-react";
import { AnnouncementsBoard } from "@/components/AnnouncementsBoard";
 import { PageWrapper } from "@/components/PageWrapper";
 import { SEOHead } from "@/components/SEOHead";
 import { useSEO } from "@/hooks/useSEO";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { MobilePageLayout } from "@/components/mobile";
 import { PageShell } from "@/components/navigation";

export default function Announcements() {
  const seoData = useSEO();
  const isMobile = useIsMobile();

  const pageContent = (
    <>
      <SEOHead {...seoData} />
      <main className="p-4 md:p-6 max-w-4xl mx-auto pb-24">
        <AnnouncementsBoard />
      </main>
    </>
  );

   return (
     <PageShell title="Mural de Anúncios">
       <PageWrapper pageName="Anúncios" className="min-h-screen bg-background">
         {isMobile ? (
           <MobilePageLayout title="Mural de Anúncios" icon={Megaphone} backPath="/">
             {pageContent}
           </MobilePageLayout>
         ) : (
           <>
             <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
               <Megaphone className="h-6 w-6 text-primary" />
               <h1 className="text-xl font-bold">Mural de Anúncios</h1>
             </header>
             {pageContent}
           </>
         )}
       </PageWrapper>
     </PageShell>
   );
}