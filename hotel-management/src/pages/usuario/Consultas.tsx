import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail, MessageSquare, Trash2, Clock, CheckCircle, XCircle, ArrowLeft, Edit, AlertCircle, Send, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Habitacion, Reserva } from '@/types'

// Definimos el tipo aquí
type Consulta = {
  id: string
  asunto: string
  mensaje: string
  respuesta: string | null
  estado: 'pendiente' | 'respondida' | 'cerrada'
  fecha_consulta: string
  fecha_respuesta: string | null
  usuario_id: string
}

export const Consultas = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para el modal de edición de solicitud
  const [showModal, setShowModal] = useState(false)
  const [consultaAEditar, setConsultaAEditar] = useState<Consulta | null>(null)
  const [reservaRelacionada, setReservaRelacionada] = useState<Reserva | null>(null)
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])

  // Estados para nueva consulta simple
  const [nuevoAsunto, setNuevoAsunto] = useState('')
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // 1. Cargar Consultas
      const consultasPromise = supabase
        .from('consultas')
        .select('*')
        .eq('usuario_id', user?.id)
        .order('fecha_consulta', { ascending: false })

      // 2. Cargar Habitaciones (necesarias para el modal de edición)
      const habitacionesPromise = supabase
        .from('habitaciones')
        .select('*')
        .order('numero')

      const [consultasData, habitacionesData] = await Promise.all([
        consultasPromise,
        habitacionesPromise
      ])
      
      setConsultas(consultasData.data || [])
      setHabitaciones(habitacionesData.data || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta consulta? Se cancelará la solicitud.')) return

    try {
      await supabase.from('consultas').delete().eq('id', id)
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

 // --- LÓGICA DE BÚSQUEDA CORREGIDA (CLIENT SIDE FILTER) ---
  const handleEditarClick = async (consulta: Consulta) => {
    // 1. Extraemos el ID parcial del asunto
    const match = consulta.asunto.match(/#([a-zA-Z0-9-]{8,})/);
    
    if (match && match[1]) {
      const partialId = match[1];
      console.log("Buscando reserva que empiece con:", partialId);

      try {
        // 2. CAMBIO: En lugar de filtrar en la BDD con ilike (que falla con UUIDs),
        // traemos todas las reservas DEL USUARIO ACTUAL.
        const { data, error } = await supabase
          .from('reservas')
          .select('*')
          .eq('usuario_id', user?.id); // Solo mis reservas

        if (error) {
          console.error("Error de Supabase:", error);
          throw error;
        }

        // 3. CAMBIO: Hacemos el filtrado aquí en JavaScript
        // Buscamos la reserva cuyo ID comience con el ID parcial
        const reservaEncontrada = data?.find(r => r.id.startsWith(partialId));

        if (reservaEncontrada) {
          setReservaRelacionada(reservaEncontrada);
          setConsultaAEditar(consulta);
          setShowModal(true);
        } else {
          console.warn("No se encontró coincidencia local para:", partialId);
          alert(`No se encontró la reserva activa asociada a esta solicitud (#${partialId}).`);
        }
      } catch (error) {
        console.error("Error buscando reserva:", error);
        alert("Error técnico al intentar cargar los datos de la reserva.");
      }
    } else {
      alert("No se pudo identificar el ID de la reserva en el asunto.");
    }
  }

  const handleEnviarConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await supabase.from('consultas').insert([{
        usuario_id: user?.id,
        asunto: nuevoAsunto,
        mensaje: nuevoMensaje,
        estado: 'pendiente',
        fecha_consulta: new Date().toISOString()
      }])
      setNuevoAsunto('')
      setNuevoMensaje('')
      setShowForm(false)
      cargarDatos()
    } catch (error) {
      console.error('Error al enviar:', error)
    }
  }

  // Callback cuando se guarda la edición
  const onEdicionGuardada = () => {
    setShowModal(false);
    setConsultaAEditar(null);
    setReservaRelacionada(null);
    cargarDatos(); // Recargar para ver el mensaje nuevo
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> Pendiente</span>
      case 'respondida': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Respondida</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs flex items-center gap-1"><XCircle className="h-3 w-3"/> Cerrada</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6 text-slate-600" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Mis Consultas</h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : 'Nueva Consulta'}
          </button>
        </div>

        {/* Formulario Nueva Consulta */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-semibold mb-4">Escribir Consulta</h2>
            <form onSubmit={handleEnviarConsulta} className="space-y-4">
              <input 
                type="text" 
                placeholder="Asunto" 
                className="w-full p-3 border rounded-lg"
                value={nuevoAsunto}
                onChange={e => setNuevoAsunto(e.target.value)}
                required
              />
              <textarea 
                placeholder="Escribe tu mensaje aquí..." 
                className="w-full p-3 border rounded-lg h-32"
                value={nuevoMensaje}
                onChange={e => setNuevoMensaje(e.target.value)}
                required
              />
              <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                Enviar
              </button>
            </form>
          </div>
        )}

        {/* Lista de Consultas */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-slate-500">Cargando...</p>
          ) : consultas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No tienes consultas ni solicitudes pendientes.</p>
            </div>
          ) : (
            consultas.map((consulta) => (
              <div key={consulta.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{consulta.asunto}</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(consulta.fecha_consulta).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(consulta.estado)}
                    
                    {consulta.estado === 'pendiente' && (
                      <>
                        {/* Botón EDITAR (Aparece si el asunto tiene un ID de reserva) */}
                        {consulta.asunto.toLowerCase().includes('reserva #') && (
                          <button 
                            onClick={() => handleEditarClick(consulta)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Modificar solicitud"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                         )}
                        
                        {/* Botón ELIMINAR */}
                        <button 
                          onClick={() => handleEliminar(consulta.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Cancelar solicitud"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{consulta.mensaje}</p>
                </div>

                {consulta.respuesta && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
                      <MessageSquare className="h-4 w-4" />
                      Respuesta del Hotel:
                    </div>
                    <p className="text-blue-900 whitespace-pre-wrap">{consulta.respuesta}</p>
                    <p className="text-xs text-blue-400 mt-2 text-right">
                      {consulta.fecha_respuesta && new Date(consulta.fecha_respuesta).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {showModal && consultaAEditar && reservaRelacionada && (
        <ModalEditarSolicitud 
          consulta={consultaAEditar}
          reserva={reservaRelacionada}
          habitaciones={habitaciones}
          onClose={() => setShowModal(false)}
          onSave={onEdicionGuardada}
        />
      )}
    </div>
  )
}

// --- COMPONENTE MODAL DE EDICIÓN DE SOLICITUD ---
// Es una adaptación del Modal de UsuarioDashboard, pero actualiza la consulta
const ModalEditarSolicitud = ({
  consulta,
  reserva,
  habitaciones,
  onClose,
  onSave,
}: {
  consulta: Consulta
  reserva: Reserva
  habitaciones: Habitacion[]
  onClose: () => void
  onSave: () => void
}) => {
  const [formData, setFormData] = useState({
    habitacion_id: reserva.habitacion_id,
    fecha_entrada: reserva.fecha_entrada,
    fecha_salida: reserva.fecha_salida,
  });
  
  const habActual = habitaciones.find(h => h.id === reserva.habitacion_id);
  const [selectedTipo, setSelectedTipo] = useState(habActual?.tipo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nuevoTotal, setNuevoTotal] = useState(reserva.total);
  const [diferencia, setDiferencia] = useState(0);

  const tiposDisponibles = [...new Set(habitaciones.map(h => h.tipo))];
  const habitacionesFiltradas = habitaciones.filter(h => h.tipo === selectedTipo);

  useEffect(() => {
    try {
      const { fecha_entrada, fecha_salida, habitacion_id } = formData;
      const habInfo = habitaciones.find(h => h.id === habitacion_id);
      
      if (fecha_entrada && fecha_salida && habInfo) {
        const entrada = new Date(fecha_entrada + 'T00:00:00');
        const salida = new Date(fecha_salida + 'T00:00:00');
        const noches = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
        
        if (noches > 0) {
          const totalCalc = noches * habInfo.precio_noche;
          setNuevoTotal(totalCalc);
          setDiferencia(totalCalc - reserva.total);
        }
      }
    } catch (e) { console.error(e); }
  }, [formData, habitaciones, reserva.total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTipo = e.target.value;
    setSelectedTipo(nuevoTipo);
    const primeraHabDelTipo = habitaciones.find(h => h.tipo === nuevoTipo);
    if (primeraHabDelTipo) {
      setFormData(prev => ({ ...prev, habitacion_id: primeraHabDelTipo.id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const entrada = new Date(formData.fecha_entrada);
      const salida = new Date(formData.fecha_salida);
      if (salida <= entrada) throw new Error("La salida debe ser posterior a la entrada");

      // Validar Disponibilidad
      const { data, error: funcError } = await supabase.functions.invoke('check-room-availability', {
        body: {
          habitacion_id: formData.habitacion_id,
          fecha_entrada: formData.fecha_entrada,
          fecha_salida: formData.fecha_salida,
          reserva_id_excluir: reserva.id
        }
      });

      if (funcError) throw new Error("Error al verificar disponibilidad");
      const responseData = data?.data || data;
      if (!responseData?.available) {
        throw new Error(`Lo sentimos, no hay disponibilidad para ${selectedTipo} en esas fechas.`);
      }

      // Generar el NUEVO mensaje actualizado
      const habOriginal = habitaciones.find(h => h.id === reserva.habitacion_id);
      const habNueva = habitaciones.find(h => h.id === formData.habitacion_id);
      
      const mensaje = `
SOLICITUD DE MODIFICACIÓN DE RESERVA (ACTUALIZADA)
-----------------------------------
Reserva Original: #${reserva.id.slice(0,8)}
Habitación: ${habOriginal?.numero} (${habOriginal?.tipo})
Fechas: ${new Date(reserva.fecha_entrada).toLocaleDateString()} - ${new Date(reserva.fecha_salida).toLocaleDateString()}
Total Actual: $${reserva.total}

NUEVA SOLICITUD:
Tipo Solicitado: ${selectedTipo} (Asignada temp: ${habNueva?.numero})
Fechas: ${new Date(formData.fecha_entrada).toLocaleDateString()} - ${new Date(formData.fecha_salida).toLocaleDateString()}
Nuevo Total: $${nuevoTotal}
Diferencia a pagar: $${diferencia}

Por favor, confirmen si puedo proceder con el cambio.
      `.trim();

      // ACTUALIZAR la consulta existente
      await supabase.from('consultas').update({
        mensaje: mensaje,
        // Opcional: Podríamos actualizar la fecha de consulta para que suba arriba
        fecha_consulta: new Date().toISOString()
      }).eq('id', consulta.id);

      onSave();

    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-xl w-full">
        <h2 className="text-xl font-bold mb-6">Modificar Solicitud</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Entrada</label>
              <input type="date" name="fecha_entrada" value={new Date(formData.fecha_entrada).toISOString().split('T')[0]} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Salida</label>
              <input type="date" name="fecha_salida" value={new Date(formData.fecha_salida).toISOString().split('T')[0]} onChange={handleChange} min={formData.fecha_entrada} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Habitación</label>
            <select value={selectedTipo} onChange={handleTipoChange} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium">
              {habitaciones.map(h => h.tipo).filter((v, i, a) => a.indexOf(v) === i).map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200">
            <div className="flex justify-between text-sm">
              <span>Nuevo Total Estimado:</span>
              <span className="font-bold">${nuevoTotal.toLocaleString('es-ES')}</span>
            </div>
            <div className={`flex justify-between font-bold ${diferencia > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <span>{diferencia > 0 ? 'Diferencia a Pagar:' : 'A favor:'}</span>
              <span>${Math.abs(diferencia).toLocaleString('es-ES')}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"/> : <Send className="h-4 w-4" />}
              Actualizar Solicitud
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}