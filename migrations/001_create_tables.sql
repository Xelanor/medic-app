-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  age INTEGER NOT NULL,
  file_number VARCHAR(50) UNIQUE NOT NULL,
  gender VARCHAR(20),
  additional_notes TEXT,
  created_by_doctor_id UUID,
  created_by_doctor_name VARCHAR(200),
  created_by_doctor_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_photos table
CREATE TABLE IF NOT EXISTS medical_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  description TEXT,
  photo_type VARCHAR(50) DEFAULT 'general',
  taken_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diagnosis TEXT,
  symptoms TEXT,
  treatment TEXT,
  notes TEXT,
  doctor_name VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_file_number ON patients(file_number);
CREATE INDEX IF NOT EXISTS idx_medical_photos_patient_id ON medical_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_taken_date ON medical_photos(taken_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for medical photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-photos', 'medical-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for patients table (basic - can be customized based on auth requirements)
CREATE POLICY "Allow authenticated users to view patients" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert patients" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update patients" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for medical_photos table
CREATE POLICY "Allow authenticated users to view medical photos" ON medical_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert medical photos" ON medical_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update medical photos" ON medical_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for medical_records table
CREATE POLICY "Allow authenticated users to view medical records" ON medical_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert medical records" ON medical_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update medical records" ON medical_records
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Storage policies for medical photos bucket
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');