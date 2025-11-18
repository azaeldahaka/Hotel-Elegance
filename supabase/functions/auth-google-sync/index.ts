// supabase/functions/auth-google-sync/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Headers para evitar problemas de CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, nombre, google_token } = await req.json()

    // Conectamos con permisos de SUPER ADMIN para poder escribir en la tabla usuarios
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. ¿Ya existe este email en MI tabla de usuarios?
    const { data: existingUser } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    let userToReturn = existingUser

    // 2. Si NO existe, lo creamos automáticamente (Registro silencioso)
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('usuarios')
        .insert([{
          email: email,
          nombre: nombre || email.split('@')[0], // Usamos el nombre de Google o el email
          password: 'GOOGLE_LOGIN_SECURE', // Contraseña interna (nadie la usa)
          rol: 'usuario', // Por defecto es cliente
          fecha_creacion: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (createError) throw createError
      userToReturn = newUser
    }

    // 3. Devolvemos el usuario de NUESTRA base de datos
    return new Response(JSON.stringify({ user: userToReturn }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})