
CREATE POLICY "Users upload to own folder in course-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own files in course-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'course-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own files in course-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
