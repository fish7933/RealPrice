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

    if (requestingUserData.role !== 'superadmin' && requestingUserData.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const { userId, password } = await req.json()

    if (!userId || !password) {
      throw new Error('Missing required fields')
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
      throw new Error('Cannot update superadmin password')
    }

    if (requestingUserData.role === 'admin' && targetUser.created_by !== requestingUser.id) {
      throw new Error('Admin can only update passwords of users they created')
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    )

    if (updateError) {
      throw new Error('Failed to update password')
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