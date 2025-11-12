// supabase/functions/create-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Este código es muy similar al de auth-register,
// pero está pensado para ser llamado por un admin.
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
    // 1. Obtener los datos del formulario del admin
    const { email, password, nombre, rol } = await req.json();

    // 2. Validar los datos
    if (!email || !password || !nombre || !rol) {
      throw new Error('Email, contraseña, nombre y rol son requeridos');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // 3. Conectar a Supabase (con permisos de admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 4. Hashear la contraseña (LA PARTE CLAVE)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 5. Crear el nuevo usuario (con el HASH)
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        email,
        password: hashedPassword, // ¡Guardamos el hash!
        nombre,
        rol: rol, // El admin define el rol (en tu caso, 'operador')
      })
      .select()
      .single();

    if (insertError) {
      // Manejar error de email duplicado
      if (insertError.code === '23505') { 
        throw new Error('Este email ya está registrado');
      }
      throw new Error(`Error al crear usuario: ${insertError.message}`);
    }

    // 6. Responder con éxito
    return new Response(JSON.stringify({
      message: 'Usuario creado exitosamente',
      user: newUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'CREATE_USER_ERROR',
        message: error.message,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});