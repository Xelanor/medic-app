-- Simple fix for storage - make bucket public for easier photo access
-- Run this to enable photo viewing

-- Update the bucket to be public (easier for development)
UPDATE storage.buckets
SET public = true
WHERE id = 'medical-photos';

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-photos', 'medical-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;