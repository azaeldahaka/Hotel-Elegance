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
    const { email, password, nombre } = await req.json();

    if (!email || !password || !nombre) {
      throw new Error('Email, contraseña y nombre son requeridos');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Verificar si el email ya existe
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/usuarios?email=eq.${email}`, {
      headers: {
        'apikey': serviceRoleKey!,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    const existingUsers = await checkResponse.json();

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Este email ya está registrado');
    }

    // Hash de la contraseña usando Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Crear nuevo usuario
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/usuarios`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey!,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        email,
        password: hashedPassword,
        nombre,
        rol: 'usuario',
      }),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Error al crear usuario: ${errorText}`);
    }

    const newUsers = await insertResponse.json();
    const newUser = newUsers[0];

    // Generar token
    const token = btoa(`${newUser.id}:${Date.now()}`);

    // Devolver usuario sin contraseña
    const { password: _, ...userWithoutPassword } = newUser;

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
        code: 'REGISTER_ERROR',
        message: error.message,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
