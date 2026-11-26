import { Users, ListChecks } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/navigation";
import { DemographicAttributesManager } from "@/components/admin/DemographicAttributesManager";
import { DemographicValuesPanel } from "@/components/admin/DemographicValuesPanel";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Tela do perfil demografico. Existe porque `demographic_attributes` e
 * `user_demographic_values` estavam em producao sem nenhuma interface: criar um
 * atributo ou ler as respostas exigia SQL direto no Dashboard.
 *
 * Administrador cria/edita/reordena/exclui atributos e ve todos os valores.
 * Gestor apenas consulta, e nao ve valor de atributo marcado como restrito.
 */
export default function DemographicAttributesAdmin() {
  const { userRoles, isLoading } = usePermissions();
  const ehAdmin = userRoles.some((r) => r.role === "admin");

  return (
    <PageShell title="Perfil demográfico" backFallback="/admin">
      <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-6 lg:p-8">
        <header className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Perfil demográfico</h1>
            <p className="text-muted-foreground">
              Atributos dos colaboradores e as respostas coletadas
            </p>
          </div>
        </header>

        <Tabs defaultValue="atributos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="atributos" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" aria-hidden />
              Atributos
            </TabsTrigger>
            <TabsTrigger value="valores" className="flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden />
              Respostas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="atributos">
            {isLoading ? null : <DemographicAttributesManager podeEditar={ehAdmin} />}
          </TabsContent>

          <TabsContent value="valores">
            {isLoading ? null : <DemographicValuesPanel ehAdmin={ehAdmin} />}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}