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
    const { habitacion_id, fecha_entrada, fecha_salida, reserva_id_excluir } = await req.json();

    if (!habitacion_id || !fecha_entrada || !fecha_salida) {
      throw new Error('Datos incompletos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Buscar reservas que se solapen con las fechas solicitadas
    let query = `${supabaseUrl}/rest/v1/reservas?habitacion_id=eq.${habitacion_id}&estado=eq.activa&or=(and(fecha_entrada.lte.${fecha_salida},fecha_salida.gte.${fecha_entrada}))`;
    
    if (reserva_id_excluir) {
      query += `&id=neq.${reserva_id_excluir}`;
    }

    const response = await fetch(query, {
      headers: {
        'apikey': serviceRoleKey!,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    const conflictingReservations = await response.json();

    const isAvailable = !conflictingReservations || conflictingReservations.length === 0;

    return new Response(JSON.stringify({
      data: {
        available: isAvailable,
        conflicting_count: conflictingReservations?.length || 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'AVAILABILITY_CHECK_ERROR',
        message: error.message,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
