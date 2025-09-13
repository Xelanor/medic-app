export interface Patient {
  id: string
  full_name: string
  age: number
  file_number: string
  gender?: string
  additional_notes?: string
  created_by_doctor_id?: string
  created_by_doctor_name?: string
  created_by_doctor_email?: string
  created_at: string
  updated_at: string
}

export interface MedicalPhoto {
  id: string
  patient_id: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  description?: string
  photo_type: string
  taken_date: string
  uploaded_by?: string
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  visit_date: string
  diagnosis?: string
  symptoms?: string
  treatment?: string
  notes?: string
  doctor_name?: string
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      medical_photos: {
        Row: MedicalPhoto
        Insert: Omit<MedicalPhoto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MedicalPhoto, 'id' | 'created_at' | 'updated_at'>>
      }
      medical_records: {
        Row: MedicalRecord
        Insert: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}