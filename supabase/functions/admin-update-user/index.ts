// supabase/functions/admin-update-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Función para verificar la contraseña del admin
async function verifyAdminPassword(supabase, adminId, adminPassword) {
  // 1. Buscamos al admin por su ID
  const { data: adminUser, error } = await supabase
    .from('usuarios')
    .select('password') // Traemos solo su password hasheado
    .eq('id', adminId)
    .single()

  if (error || !adminUser) {
    throw new Error('No se encontró al administrador.')
  }

  // 2. Hasheamos la contraseña que el admin escribió en el formulario
  const encoder = new TextEncoder()
  const data = encoder.encode(adminPassword)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // 3. Comparamos los hashes
  if (adminUser.password !== hashedPassword) {
    throw new Error('Contraseña de administrador incorrecta.')
  }
  
  // Si todo está bien, no devolvemos nada
  return true
}

// Función principal
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
    const { 
      admin_id,            // Tu ID de admin
      admin_password,      // Tu contraseña de admin para confirmar
      target_user_id,      // El ID del operador que estás editando
      nombre,              // Los nuevos datos
      email,
      rol,
      nueva_password       // La nueva contraseña (opcional)
    } = await req.json()

    // --- 1. Validaciones de datos ---
    if (!admin_id || !admin_password || !target_user_id || !nombre || !email || !rol) {
      throw new Error('Faltan datos para la actualización (admin, target, nombre, email, rol).')
    }

    // --- 2. Conexión a Supabase (con permisos de admin) ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- 3. ¡VERIFICACIÓN DE SEGURIDAD! ---
    // Verificamos la contraseña del admin que está haciendo la solicitud
    await verifyAdminPassword(supabaseAdmin, admin_id, admin_password)

    // --- 4. Preparar los datos a actualizar ---
    const dataToUpdate: { 
      nombre: string, 
      email: string, 
      rol: string, 
      password?: string 
    } = {
      nombre,
      email,
      rol,
    }

    // --- 5. Si se pasó una nueva contraseña, la hasheamos ---
    if (nueva_password) {
      if (nueva_password.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.')
      }
      const encoder = new TextEncoder()
      const data = encoder.encode(nueva_password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      dataToUpdate.password = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // --- 6. Actualizar al usuario ---
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(dataToUpdate)
      .eq('id', target_user_id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') { // Error de 'unique constraint'
        throw new Error('Ese email ya está en uso por otro usuario.')
      }
      throw updateError
    }

    // --- 7. Responder con éxito ---
    return new Response(JSON.stringify({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'UPDATE_USER_ERROR',
        message: error.message,
      },
    }), {
      status: 400, // Error de cliente (ej: contraseña incorrecta)
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})