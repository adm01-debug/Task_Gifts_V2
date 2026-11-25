-- ============================================
-- Paridade prod x repositorio: triggers de updated_at dos departamentos e auditoria da roleta
-- ============================================
--
-- Dois deltas reais medidos entre producao e o rebuild do repositorio:
--
-- 1) Producao tem 3 triggers de updated_at que o repositorio nao cria
--    (public.department_wars, public.department_war_metrics, public.department_war_departments).
--    As 3 tabelas tem coluna updated_at; sem o trigger uma reconstrucao perde a atualizacao
--    automatica do timestamp nessas tabelas. Nome e funcao iguais aos de producao para que
--    rebuild e producao fiquem identicos.
--
-- 2) A auditoria da Roleta da Sorte estava ligada na funcao antiga
--    (audit_lucky_wheel_prize) em producao, enquanto o repositorio (20260727205544) ja define
--    log_lucky_wheel_prize_change - que ignora UPDATE que nao mudou nenhum campo relevante e
--    portanto nao polui a trilha. Reaponta o trigger para a funcao atual do repositorio.
--
-- Idempotente: DROP TRIGGER IF EXISTS antes de cada CREATE TRIGGER.

DROP TRIGGER IF EXISTS department_wars_updated_at ON public.department_wars;
CREATE TRIGGER department_wars_updated_at
  BEFORE UPDATE ON public.department_wars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS department_war_metrics_updated_at ON public.department_war_metrics;
CREATE TRIGGER department_war_metrics_updated_at
  BEFORE UPDATE ON public.department_war_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS dept_war_departments_updated_at ON public.department_war_departments;
CREATE TRIGGER dept_war_departments_updated_at
  BEFORE UPDATE ON public.department_war_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS lucky_wheel_prizes_audit ON public.lucky_wheel_prizes;
CREATE TRIGGER lucky_wheel_prizes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.lucky_wheel_prizes
  FOR EACH ROW EXECUTE FUNCTION public.log_lucky_wheel_prize_change();