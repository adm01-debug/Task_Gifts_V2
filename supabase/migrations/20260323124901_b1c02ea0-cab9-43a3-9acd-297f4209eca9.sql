CREATE INDEX IF NOT EXISTS idx_query_telemetry_created_at ON public.query_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_severity ON public.query_telemetry (severity);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_table_name ON public.query_telemetry (table_name);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_severity_created ON public.query_telemetry (severity, created_at DESC);