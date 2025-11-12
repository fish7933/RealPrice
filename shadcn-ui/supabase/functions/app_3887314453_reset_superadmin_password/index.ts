import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received:`, {
    method: req.method,
    url: req.url,
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`[${requestId}] Resetting superadmin password...`);

    // Get superadmin user
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error(`[${requestId}] Error listing users:`, getUserError);
      throw getUserError;
    }

    const superadminUser = users.users.find(
      (u) => u.email === 'superadmin@freight.local'
    );

    if (!superadminUser) {
      console.error(`[${requestId}] Superadmin user not found`);
      return new Response(
        JSON.stringify({ error: 'Superadmin user not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`[${requestId}] Found superadmin user:`, superadminUser.id);

    // Update password using Admin API
    const newPassword = 'SuperAdmin2024!';
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      superadminUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`[${requestId}] Error updating password:`, updateError);
      throw updateError;
    }

    console.log(`[${requestId}] Password reset successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Superadmin password reset successfully',
        email: 'superadmin@freight.local',
        newPassword: newPassword,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({
        error: error.message,
        requestId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});