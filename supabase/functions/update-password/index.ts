// supabase/functions/update-password/index.ts
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
    const { user_id, old_password, new_password } = await req.json()

    if (!user_id || !old_password || !new_password) {
      throw new Error('Faltan datos (ID, contraseña anterior, contraseña nueva).')
    }
    if (new_password.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.')
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

    // 2. Verificamos la contraseña ANTERIOR
    const encoder = new TextEncoder()
    const data = encoder.encode(old_password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const oldHashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (user.password !== oldHashedPassword) {
      throw new Error('La contraseña anterior es incorrecta.')
    }

    // 3. Hasheamos la NUEVA contraseña
    const newData = encoder.encode(new_password)
    const newHashBuffer = await crypto.subtle.digest('SHA-256', newData)
    const newHashedPassword = Array.from(new Uint8Array(newHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    // 4. Actualizamos la BDD
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ password: newHashedPassword })
      .eq('id', user_id)
      
    if (updateError) throw updateError
    
    return new Response(JSON.stringify({ message: 'Contraseña actualizada con éxito.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})