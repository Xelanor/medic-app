-- Add doctor tracking fields to existing patients table
-- Run this migration to add doctor information to patient records

-- Add doctor tracking columns to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS created_by_doctor_id UUID,
ADD COLUMN IF NOT EXISTS created_by_doctor_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS created_by_doctor_email VARCHAR(255);

-- Create index for doctor lookups
CREATE INDEX IF NOT EXISTS idx_patients_created_by_doctor_id ON patients(created_by_doctor_id);

-- Optionally update existing records with a placeholder doctor
-- (You can modify this to set a specific doctor if needed)
UPDATE patients
SET
  created_by_doctor_name = 'Legacy Doctor',
  created_by_doctor_email = 'legacy@system.com'
WHERE created_by_doctor_name IS NULL;