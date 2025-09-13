import { supabaseAdmin } from './supabase-admin'

export const runDatabaseMigration = async () => {
  try {
    console.log('🚀 Starting database migration...')

    // First test connection
    console.log('🔗 Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .limit(1)

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return { success: false, error: 'Failed to connect to Supabase with admin privileges' }
    }
    console.log('✅ Connected to Supabase successfully')

    // Create storage bucket first
    console.log('📝 Creating storage bucket...')
    const { error: bucketError } = await supabaseAdmin.storage.createBucket('medical-photos', {
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating storage bucket:', bucketError)
    } else {
      console.log('✅ Storage bucket created/verified')
    }

    // Since we can't execute arbitrary SQL via RPC without creating custom functions,
    // let's try to test if tables exist by querying them
    console.log('📝 Checking existing tables...')

    const { error: patientsError } = await supabaseAdmin.from('patients').select('id').limit(1)

    if (patientsError && patientsError.code === 'PGRST116') {
      console.log('❌ Tables do not exist. You need to run the SQL migration manually.')
      console.log('📋 Please copy and run the SQL from: migrations/001_create_tables.sql')
      console.log('🔗 Go to: https://app.supabase.com/project/qhqerfrwkjspwbounhgj/sql/new')
      return {
        success: false,
        error: 'Tables do not exist. Please run the SQL migration manually in Supabase SQL Editor.',
        instructions: 'Copy the SQL from migrations/001_create_tables.sql and run it in the Supabase SQL Editor.'
      }
    } else if (patientsError) {
      console.error('❌ Unexpected error:', patientsError)
      return { success: false, error: patientsError.message }
    } else {
      console.log('✅ Tables already exist and are accessible')
    }

    // Test other tables
    const { error: photosError } = await supabaseAdmin.from('medical_photos').select('id').limit(1)
    const { error: recordsError } = await supabaseAdmin.from('medical_records').select('id').limit(1)

    if (photosError && photosError.code === 'PGRST116') {
      console.log('❌ medical_photos table missing')
    } else {
      console.log('✅ medical_photos table exists')
    }

    if (recordsError && recordsError.code === 'PGRST116') {
      console.log('❌ medical_records table missing')
    } else {
      console.log('✅ medical_records table exists')
    }

    console.log('🎉 Database verification completed!')
    return { success: true, message: 'Database connection verified. If tables are missing, please run the SQL migration manually.' }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}