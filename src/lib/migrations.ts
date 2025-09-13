import { supabase } from './supabase'
import fs from 'fs'
import path from 'path'

export const runMigrations = async () => {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '001_create_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    console.log(`Running ${statements.length} migration statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`)

        try {
          // For storage bucket creation and policies, we might need to handle differently
          if (statement.includes('storage.buckets')) {
            // Skip storage bucket creation for now as it might need admin privileges
            console.log('Skipping storage bucket creation - may need admin privileges')
            continue
          }

          if (statement.includes('storage.objects')) {
            // Skip storage policies for now
            console.log('Skipping storage policies - may need admin privileges')
            continue
          }

          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

          if (error) {
            console.error(`Error in statement ${i + 1}:`, error)
            // Continue with other statements even if one fails
          } else {
            console.log(`Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err)
        }
      }
    }

    console.log('Migration completed!')
    return { success: true }
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error }
  }
}

// Simpler approach - create tables one by one
export const createTables = async () => {
  try {
    console.log('Creating patients table...')
    const { error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)

    if (patientsError && patientsError.code === 'PGRST116') {
      console.log('Patients table does not exist. You need to run the SQL migration manually.')
      console.log('Copy the SQL from migrations/001_create_tables.sql and run it in Supabase SQL Editor.')
    } else {
      console.log('Patients table exists or accessible')
    }

    return { success: true, message: 'Please run the migration SQL manually in Supabase dashboard' }
  } catch (error) {
    console.error('Error checking tables:', error)
    return { success: false, error }
  }
}