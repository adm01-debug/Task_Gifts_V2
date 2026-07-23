
CREATE POLICY "Auth users read org assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'org-assets');

CREATE POLICY "Org admins upload assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND public.is_org_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Org admins update assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND public.is_org_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Org admins delete assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND public.is_org_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
