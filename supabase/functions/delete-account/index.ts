// supabase/functions/delete-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { user_id, password } = await req.json()
    if (!user_id || !password) {
      throw new Error('Faltan datos (ID, contraseña).')
    }
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscamos al usuario
    const { data: user, error: findError } = await supabaseAdmin
      .from('usuarios')
      .select('password')
      .eq('id', user_id)
      .single()

    if (findError || !user) throw new Error('Usuario no encontrado.')

    // 2. Verificamos la contraseña
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    if (user.password !== hashedPassword) {
      throw new Error('La contraseña es incorrecta.')
    }

    // 3. Borramos al usuario
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', user_id)
      
    if (deleteError) {
      // Si falla por una Foreign Key (tiene reservas, etc.)
      if (deleteError.code === '23503') { 
        throw new Error('No se puede borrar: el usuario tiene reservas o consultas activas.')
      }
      throw deleteError
    }
    
    return new Response(JSON.stringify({ message: 'Cuenta borrada con éxito.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})