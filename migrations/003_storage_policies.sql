-- Storage policies for medical photos bucket
-- Run this to enable photo viewing for authenticated users

-- Allow authenticated users to view photos
CREATE POLICY "Allow authenticated users to view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their photos
CREATE POLICY "Allow authenticated users to delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-photos', 'medical-photos', false)
ON CONFLICT (id) DO NOTHING;