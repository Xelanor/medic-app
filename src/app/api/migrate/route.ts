import { runDatabaseMigration } from '@/lib/migrate'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const result = await runDatabaseMigration()

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}