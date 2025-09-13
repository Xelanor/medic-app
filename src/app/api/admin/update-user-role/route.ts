import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Update user metadata using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: role
      }
    })

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: 'Failed to update user role: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: data.user
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}