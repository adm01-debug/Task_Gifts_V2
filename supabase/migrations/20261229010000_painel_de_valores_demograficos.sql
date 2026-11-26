-- Valores demograficos: fecha o vazamento no banco, nao so' na tela.
--
-- Ate' aqui a policy "Admins and managers can view demographic values" liberava
-- SELECT de qualquer linha para o papel manager. A tela pedia a projecao sem as
-- colunas de valor, mas quem abrisse o console do navegador com o proprio JWT
-- podia pedir `select *` e ler o valor de um atributo restrito — a protecao
-- dependia do cliente.
--
-- Correcao em tres partes:
--   1. a policy de SELECT passa a valer so' para administrador; o dono continua
--      lendo e gravando as proprias linhas pela policy que ja' existia;
--   2. a view `demographic_values_panel` roda como dona das tabelas e entrega a
--      linha ja' mascarada: valor nulo quando o atributo esta' inativo ou e'
--      restrito e quem le nao e' admin; metadados nulos quando o atributo esta'
--      inativo (a policy de `demographic_attributes` esconde inativo de
--      nao-admin);
--   3. o painel le a view — uma consulta, igual para admin e gestor.
--
-- Mascarar na view (e nao com privilegio de coluna) porque privilegio de coluna
-- vale para o papel inteiro: revogar `value` de `authenticated` quebraria a
-- leitura da propria resposta, que e' o fluxo do colaborador no perfil.

CREATE OR REPLACE VIEW public.demographic_values_panel AS
WITH quem AS (
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)   AS eh_admin,
         public.has_role(auth.uid(), 'manager'::public.app_role) AS eh_gestor
)
SELECT
  v.id,
  v.user_id,
  v.attribute_id,
  v.created_at,
  v.updated_at,
  -- Valor: admin sempre; gestor so' quando o atributo esta' ativo e nao e'
  -- restrito. Restrito ou desativado fica nulo, e a tela nao tem como exibir.
  CASE WHEN q.eh_admin OR (a.is_active AND NOT a.is_restricted) THEN v.value        END AS value,
  CASE WHEN q.eh_admin OR (a.is_active AND NOT a.is_restricted) THEN v.values_array END AS values_array,
  CASE WHEN q.eh_admin OR (a.is_active AND NOT a.is_restricted) THEN v.number_value END AS number_value,
  CASE WHEN q.eh_admin OR (a.is_active AND NOT a.is_restricted) THEN v.date_value   END AS date_value,
  CASE WHEN q.eh_admin OR a.is_active THEN a.name                END AS attribute_name,
  CASE WHEN q.eh_admin OR a.is_active THEN a.attribute_type      END AS attribute_type,
  CASE WHEN q.eh_admin OR a.is_active THEN a.is_visible_in_reports END AS attribute_is_visible_in_reports,
  CASE WHEN q.eh_admin OR a.is_active THEN a.is_restricted       END AS attribute_is_restricted
FROM public.user_demographic_values v
JOIN public.demographic_attributes a ON a.id = v.attribute_id
CROSS JOIN quem q
WHERE q.eh_admin OR q.eh_gestor;

COMMENT ON VIEW public.demographic_values_panel IS
  'Painel de respostas demograficas. Mascara valor de atributo restrito para quem nao e'' admin e metadados de atributo inativo para quem nao e'' admin. Lida por src/services/demographicsService.ts (listAllValues).';

REVOKE ALL ON public.demographic_values_panel FROM PUBLIC, anon;
GRANT SELECT ON public.demographic_values_panel TO authenticated;

-- Leitura direta da tabela: admin (tudo) ou dono da linha. Manager perde o
-- acesso as linhas de terceiros e passa a usar a view acima.
DROP POLICY IF EXISTS "Admins and managers can view demographic values" ON public.user_demographic_values;
DROP POLICY IF EXISTS "Admins can view demographic values" ON public.user_demographic_values;
CREATE POLICY "Admins can view demographic values" ON public.user_demographic_values
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));