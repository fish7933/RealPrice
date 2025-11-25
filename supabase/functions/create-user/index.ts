import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized')
    }

    // Get the requesting user's role from the database
    const { data: requestingUserData, error: userError } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (userError || !requestingUserData) {
      throw new Error('User not found in database')
    }

    // Only superadmin and admin can create users
    if (requestingUserData.role !== 'superadmin' && requestingUserData.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Parse request body
    const { username, password, name, position, role } = await req.json()

    // Validate input
    if (!username || !password || !name || !position || !role) {
      throw new Error('Missing required fields')
    }

    // Prevent creating superadmin users
    if (role === 'superadmin') {
      throw new Error('Cannot create superadmin users')
    }

    // Only superadmin can create admin users
    if (role === 'admin' && requestingUserData.role !== 'superadmin') {
      throw new Error('Only superadmin can create admin users')
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Create the auth user
    const email = `${username}@freight.local`
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username
      }
    })

    if (createAuthError || !authData.user) {
      console.error('Failed to create auth user:', createAuthError)
      throw new Error('Failed to create auth user')
    }

    // Create the user record in the database
    const { error: dbError } = await supabaseAdmin
      .from('app_51335ed80f_users')
      .insert({
        id: authData.user.id,
        username,
        name,
        position,
        role,
        created_by: requestingUser.id,
      })

    if (dbError) {
      console.error('Failed to create user record:', dbError)
      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error('Failed to create user record')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authData.user.id,
          username,
          name,
          position,
          role
        }
      }),
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