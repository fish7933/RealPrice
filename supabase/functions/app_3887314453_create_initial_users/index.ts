import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Request received:`, req.method);

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[${requestId}] Creating initial users...`);

    // Hash function using Web Crypto API
    async function hashPassword(password: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Create superadmin
    const superadminHash = await hashPassword('SuperAdmin2024!');
    const { data: superadmin, error: error1 } = await supabase
      .from('app_3887314453_users')
      .insert({
        username: 'superadmin',
        password_hash: superadminHash,
        name: '최고관리자',
        position: '시스템 관리자',
        role: 'superadmin',
      })
      .select()
      .single();

    if (error1) {
      console.error(`[${requestId}] Error creating superadmin:`, error1);
      throw error1;
    }

    console.log(`[${requestId}] Superadmin created:`, superadmin.id);

    // Create admin
    const adminHash = await hashPassword('admin123');
    const { data: admin, error: error2 } = await supabase
      .from('app_3887314453_users')
      .insert({
        username: 'admin',
        password_hash: adminHash,
        name: '관리자',
        position: '운영 관리자',
        role: 'admin',
        created_by: superadmin.id,
      })
      .select()
      .single();

    if (error2) {
      console.error(`[${requestId}] Error creating admin:`, error2);
      throw error2;
    }

    console.log(`[${requestId}] Admin created:`, admin.id);

    // Create viewer
    const viewerHash = await hashPassword('viewer123');
    const { data: viewer, error: error3 } = await supabase
      .from('app_3887314453_users')
      .insert({
        username: 'viewer',
        password_hash: viewerHash,
        name: '조회자',
        position: '조회 전용',
        role: 'viewer',
        created_by: superadmin.id,
      })
      .select()
      .single();

    if (error3) {
      console.error(`[${requestId}] Error creating viewer:`, error3);
      throw error3;
    }

    console.log(`[${requestId}] Viewer created:`, viewer.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Initial users created successfully',
        users: [
          { username: 'superadmin', id: superadmin.id },
          { username: 'admin', id: admin.id },
          { username: 'viewer', id: viewer.id },
        ],
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
        success: false,
        error: error.message,
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