-- Fix system INSERT policies: from WITH CHECK (true) to WITH CHECK (auth.uid() IS NOT NULL)
-- These are used by edge functions (service_role bypasses RLS anyway)

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service can insert webhook logs" ON bitrix24_webhook_logs;
CREATE POLICY "Authenticated insert webhook logs" ON bitrix24_webhook_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can create celebrations" ON celebrations;
CREATE POLICY "Authenticated create celebrations" ON celebrations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Sistema pode inserir logs de acesso geográfico" ON geo_access_logs;
CREATE POLICY "Authenticated insert geo logs" ON geo_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert league history" ON league_history;
CREATE POLICY "Authenticated insert league history" ON league_history
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert alerts" ON new_device_alerts;
CREATE POLICY "Authenticated insert device alerts" ON new_device_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "Authenticated insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert certifications" ON user_certifications;
CREATE POLICY "Authenticated insert certifications" ON user_certifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can insert devices" ON user_devices;
CREATE POLICY "Authenticated insert devices" ON user_devices
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());