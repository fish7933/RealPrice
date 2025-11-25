import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized')
    }

    const { data: requestingUserData, error: userError } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (userError || !requestingUserData) {
      throw new Error('User not found in database')
    }

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('Missing userId')
    }

    if (userId === requestingUser.id) {
      throw new Error('Cannot delete yourself')
    }

    const { data: targetUser } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .select('role, created_by')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      throw new Error('Target user not found')
    }

    if (targetUser.role === 'superadmin') {
      throw new Error('Cannot delete superadmin')
    }

    if (requestingUserData.role === 'admin') {
      if (targetUser.created_by !== requestingUser.id || targetUser.role !== 'viewer') {
        throw new Error('Admin can only delete viewer users they created')
      }
    } else if (requestingUserData.role !== 'superadmin') {
      throw new Error('Insufficient permissions')
    }

    // Delete from database first
    const { error: dbError } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      throw new Error('Failed to delete user from database')
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})