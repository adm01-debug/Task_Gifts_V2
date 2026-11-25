-- Alinha a nulabilidade de external_api_keys entre producao e o banco reconstruido.
--
-- Medicao em 2026-11-25 (information_schema.columns, 16 colunas dos dois lados):
--   producao : secret_salt = YES, secret_hash = YES
--   rebuild  : secret_salt = NO,  secret_hash = NO
--
-- O rebuild ficou mais restritivo porque as duas colunas foram criadas por
-- 20260728205541 com NOT NULL, enquanto em producao elas nasceram sem a constraint.
-- Hoje isso nao quebra nada - os dois unicos caminhos de escrita
-- (create_external_api_key em 20260728205541 e 20260728210216) inserem salt e hash
-- sempre -, mas um ambiente reconstruido recusaria um INSERT que producao aceita, e
-- essa e a unica divergencia estrutural que sobra nessa tabela. Alinhar para YES
-- mantem o comportamento identico nas duas pontas; a ordem fisica das colunas
-- (api_secret e a 4a em producao e a ultima no rebuild) nao e ajustavel sem recriar
-- a tabela e nao tem efeito: nenhum codigo seleciona por posicao.

ALTER TABLE public.external_api_keys ALTER COLUMN secret_salt DROP NOT NULL;
ALTER TABLE public.external_api_keys ALTER COLUMN secret_hash DROP NOT NULL;