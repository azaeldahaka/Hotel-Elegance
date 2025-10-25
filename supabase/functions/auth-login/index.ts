Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Buscar usuario por email
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/usuarios?email=eq.${email}`, {
      headers: {
        'apikey': serviceRoleKey!,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    const users = await userResponse.json();

    if (!users || users.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const user = users[0];

    // Hash de la contraseña ingresada para comparar
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verificar contraseña hasheada
    if (user.password !== hashedPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token
    const token = btoa(`${user.id}:${Date.now()}`);

    // Devolver usuario sin contraseña
    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify({
      data: {
        user: userWithoutPassword,
        token,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'AUTH_ERROR',
        message: error.message,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
