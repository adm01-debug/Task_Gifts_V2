import { ClipboardList } from "lucide-react";
import { PulseSurveyWidget } from "@/components/PulseSurveyWidget";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
 import { PageShell } from "@/components/navigation";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { MobilePageLayout } from "@/components/mobile";

export default function Surveys() {
  const seoData = useSEO();

   const isMobile = useIsMobile();
 
   const pageContent = (
     <main className="p-4 md:p-6 max-w-4xl mx-auto pb-24">
       {!isMobile && (
         <header className="flex h-16 shrink-0 items-center gap-2 mb-4">
           <ClipboardList className="h-6 w-6 text-primary" />
           <h1 className="text-xl font-bold">Pulse Surveys</h1>
         </header>
       )}
       <PulseSurveyWidget />
     </main>
   );
 
   return (
     <PageShell title="Pulse Surveys">
       <PageWrapper pageName="Pesquisas" className="min-h-screen bg-background">
         <SEOHead {...seoData} />
         {isMobile ? (
           <MobilePageLayout title="Pulse Surveys" icon={ClipboardList} backPath="/">
             {pageContent}
           </MobilePageLayout>
         ) : (
           pageContent
         )}
       </PageWrapper>
     </PageShell>
   );
}
