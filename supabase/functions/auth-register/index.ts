import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // --- 1. Validaciones primero ---
    if (!email || !password || !nombre) {
      throw new Error('Email, contraseña y nombre son requeridos');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // --- 2. Conectar a Supabase (con permisos de admin) ---
    // (Usamos el cliente de Supabase, es más limpio que fetch)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- 3. Verificar si el email ya existe ---
    const { data: existingUser } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Este email ya está registrado');
    }

    // --- 4. Hashear la contraseña (LA PARTE CLAVE) ---
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // --- 5. Crear el nuevo usuario (con el HASH) ---
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        password: hashedPassword, // ¡Guardamos el hash, no la contraseña simple!
        nombre,
        rol: 'usuario',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al crear usuario: ${insertError.message}`);
    }

    // --- 6. Generar token y responder ---
    const token = btoa(`${newUser.id}:${Date.now()}`);
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