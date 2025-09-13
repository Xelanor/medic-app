const { runDatabaseMigration } = require('../src/lib/migrate.ts')

async function main() {
  console.log('Starting database migration...')
  const result = await runDatabaseMigration()

  if (result.success) {
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } else {
    console.error('❌ Migration failed:', result.error)
    process.exit(1)
  }
}

main().catch(console.error)