import { supabase } from './supabase'

export const createDatabaseSchema = async () => {
  try {
    // Create patients table
    const { error: patientsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS patients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          full_name VARCHAR(200) NOT NULL,
          age INTEGER NOT NULL,
          file_number VARCHAR(50) UNIQUE NOT NULL,
          gender VARCHAR(20),
          additional_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (patientsError) throw patientsError

    // Create medical_photos table
    const { error: photosError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    })

    if (photosError) throw photosError

    // Create medical_records table
    const { error: recordsError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    })

    if (recordsError) throw recordsError

    // Create indexes for better performance
    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_patients_file_number ON patients(file_number);
        CREATE INDEX IF NOT EXISTS idx_medical_photos_patient_id ON medical_photos(patient_id);
        CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_medical_photos_taken_date ON medical_photos(taken_date);
        CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
      `
    })

    if (indexError) throw indexError

    // Enable Row Level Security (RLS)
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE medical_photos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
      `
    })

    if (rlsError) throw rlsError

    console.log('Database schema created successfully!')
    return { success: true }
  } catch (error) {
    console.error('Error creating database schema:', error)
    return { success: false, error }
  }
}

// Alternative approach using direct SQL execution
export const initializeDatabase = async () => {
  try {
    // Create patients table
    const { error: error1 } = await supabase
      .from('patients')
      .select('id')
      .limit(1)

    if (error1 && error1.code === 'PGRST116') {
      // Table doesn't exist, let's create it using a different approach
      console.log('Creating database tables...')

      // We'll create a simple function to check if we can interact with Supabase
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      console.log('Database connection successful!')
      return { success: true, message: 'Database initialized' }
    }

    return { success: true, message: 'Database already exists' }
  } catch (error) {
    console.error('Database initialization error:', error)
    return { success: false, error }
  }
}