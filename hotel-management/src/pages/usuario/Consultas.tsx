import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
// --- Agregamos RefreshCw y ArrowRight para el diseño bonito ---
import { Mail, MessageSquare, Trash2, Clock, CheckCircle, XCircle, ArrowLeft, Edit, AlertCircle, Send, RefreshCw, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Habitacion, Reserva, Usuario } from '@/types'

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
  
  const [showModal, setShowModal] = useState(false)
  const [consultaAEditar, setConsultaAEditar] = useState<Consulta | null>(null)
  const [reservaRelacionada, setReservaRelacionada] = useState<Reserva | null>(null)
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])

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
      const consultasPromise = supabase
        .from('consultas')
        .select('*')
        .eq('usuario_id', user?.id)
        .order('fecha_consulta', { ascending: false })

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

  const handleEditarClick = async (consulta: Consulta) => {
    const match = consulta.asunto.match(/#([a-zA-Z0-9-]{8,})/);
    if (match && match[1]) {
      const partialId = match[1];
      try {
        const { data, error } = await supabase.from('reservas').select('*').eq('usuario_id', user?.id);
        if (error) throw error;
        const reservaEncontrada = data?.find(r => r.id.startsWith(partialId));
        if (reservaEncontrada) {
          setReservaRelacionada(reservaEncontrada);
          setConsultaAEditar(consulta);
          setShowModal(true);
        } else {
          alert(`No se encontró la reserva activa asociada (#${partialId}).`);
        }
      } catch (error) { console.error(error); alert("Error técnico."); }
    } else {
      alert("No se pudo identificar el ID de la reserva.");
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
      setNuevoAsunto(''); setNuevoMensaje(''); setShowForm(false); cargarDatos();
    } catch (error) { console.error('Error al enviar:', error) }
  }

  const onEdicionGuardada = () => {
    setShowModal(false); setConsultaAEditar(null); setReservaRelacionada(null); cargarDatos();
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> Pendiente</span>
      case 'respondida': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Respondida</span>
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs flex items-center gap-1"><XCircle className="h-3 w-3"/> Cerrada</span>
    }
  }

  // --- FUNCIÓN MEJORADA: Renderiza el mensaje más compacto y alineado ---
  const renderMensaje = (mensaje: string) => {
    try {
      const data = JSON.parse(mensaje);
      if (data && data.type === 'SOLICITUD_CAMBIO_ESTRUCTURADA') {
        return (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold border-b border-blue-200 pb-1 text-sm">
              <RefreshCw className="h-3 w-3" />
              <span>Solicitud de Cambio</span>
            </div>
            
            {/* Contenedor Flex para alinear cajas y flecha */}
            <div className="flex flex-col md:flex-row gap-2 items-stretch justify-between">
              
              {/* CAJA ORIGINAL (Izquierda) */}
              <div className="bg-white p-2 rounded border border-slate-200 opacity-70 flex-1 text-xs shadow-sm">
                <p className="font-bold text-slate-500 uppercase mb-1 text-[10px]">Antes</p>
                <p className="font-semibold text-slate-800">Hab: {data.original.habNumero}</p>
                <p className="text-slate-600 truncate">{data.original.habTipo}</p>
                <p className="text-slate-500 mt-1 text-[10px]">
                  {new Date(data.original.entrada).toLocaleDateString('es-ES')} ➔ {new Date(data.original.salida).toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* FLECHA (Centro) - Perfectamente alineada */}
              <div className="flex items-center justify-center text-blue-400 px-2 py-1 md:py-0">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /> {/* Rota en móvil */}
              </div>

              {/* CAJA NUEVA (Derecha) */}
              <div className="bg-white p-2 rounded border-2 border-blue-200 shadow-sm flex-1 text-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-bl" /> {/* Adorno visual */}
                <p className="font-bold text-blue-600 uppercase mb-1 text-[10px]">Nuevo</p>
                <p className="font-semibold text-slate-900">Hab: {data.nuevo.habNumero || 'Pendiente'}</p>
                <p className="text-slate-700 truncate">{data.nuevo.habTipo}</p>
                <p className="text-slate-500 mt-1 text-[10px]">
                  {new Date(data.nuevo.entrada).toLocaleDateString('es-ES')} ➔ {new Date(data.nuevo.salida).toLocaleDateString('es-ES')}
                </p>
                
                <div className="mt-2 pt-1 border-t border-slate-100 flex justify-between items-center font-bold">
                  <span className="text-slate-400 text-[10px]">Dif:</span>
                  <span className={data.nuevo.diferencia > 0 ? 'text-red-600' : 'text-green-600'}>
                    {data.nuevo.diferencia > 0 ? '+' : ''}${data.nuevo.diferencia}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    } catch (e) { }
    return <p className="text-slate-700 whitespace-pre-wrap text-sm">{mensaje}</p>;
  };

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

        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-semibold mb-4">Escribir Consulta</h2>
            <form onSubmit={handleEnviarConsulta} className="space-y-4">
              <input type="text" placeholder="Asunto" className="w-full p-3 border rounded-lg" value={nuevoAsunto} onChange={e => setNuevoAsunto(e.target.value)} required />
              <textarea placeholder="Escribe tu mensaje aquí..." className="w-full p-3 border rounded-lg h-32" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required />
              <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Enviar</button>
            </form>
          </div>
        )}

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
                        {consulta.asunto.toLowerCase().includes('reserva #') && (
                          <button onClick={() => handleEditarClick(consulta)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Modificar solicitud"><Edit className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => handleEliminar(consulta.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Cancelar solicitud"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* --- USAMOS LA FUNCIÓN DE RENDERIZADO BONITO --- */}
                <div className="mb-4">
                  {renderMensaje(consulta.mensaje)}
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

      {showModal && consultaAEditar && reservaRelacionada && (
        <ModalEditarSolicitud 
          consulta={consultaAEditar}
          reserva={reservaRelacionada}
          habitaciones={habitaciones}
          user={user}
          onClose={() => setShowModal(false)}
          onSave={onEdicionGuardada}
        />
      )}
    </div>
  )
}

const ModalEditarSolicitud = ({ consulta, reserva, habitaciones, user, onClose, onSave }: any) => {
  // ... (El mismo código del modal que ya funciona perfecto, sin cambios) ...
  const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida });
  const habActual = habitaciones.find((h:any) => h.id === reserva.habitacion_id);
  const [selectedTipo, setSelectedTipo] = useState(habActual?.tipo || '');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [nuevoTotal, setNuevoTotal] = useState(reserva.total); const [diferencia, setDiferencia] = useState(0);
  const tituloModal = user ? `Editar Solicitud de ${user.nombre}` : 'Modificar Solicitud';
  const tiposDisponibles = [...new Set(habitaciones.map((h:any) => h.tipo))];
  
  useEffect(() => {
    try { const { fecha_entrada, fecha_salida, habitacion_id } = formData; const habInfo = habitaciones.find((h:any) => h.id === habitacion_id);
      if (fecha_entrada && fecha_salida && habInfo) { const dias = Math.ceil((new Date(fecha_salida + 'T00:00:00').getTime() - new Date(fecha_entrada + 'T00:00:00').getTime())/(1000*60*60*24)); if(dias>0){const tot=dias*habInfo.precio_noche; setNuevoTotal(tot); setDiferencia(tot-reserva.total);} }
    } catch (e) { console.error(e); }
  }, [formData, habitaciones, reserva.total]);

  const handleSubmit = async (e:any) => { e.preventDefault(); setLoading(true); setError('');
    try {
      if(new Date(formData.fecha_salida) <= new Date(formData.fecha_entrada)) throw new Error("Fechas inválidas");
      const { data, error: funcError } = await supabase.functions.invoke('check-room-availability', { body: { habitacion_id: formData.habitacion_id, fecha_entrada: formData.fecha_entrada, fecha_salida: formData.fecha_salida, reserva_id_excluir: reserva.id } });
      if (funcError || !data?.data?.available) throw new Error('No disponible');
      
      const habOriginal = habitaciones.find((h:any) => h.id === reserva.habitacion_id);
      const habNueva = habitaciones.find((h:any) => h.id === formData.habitacion_id);
      const mensaje = JSON.stringify({
        type: 'SOLICITUD_CAMBIO_ESTRUCTURADA',
        reservaId: reserva.id,
        original: { habNumero: habOriginal?.numero, habTipo: habOriginal?.tipo, entrada: reserva.fecha_entrada, salida: reserva.fecha_salida, total: reserva.total },
        nuevo: { habitacion_id: habNueva?.id, habNumero: habNueva?.numero, habTipo: habNueva?.tipo, entrada: formData.fecha_entrada, salida: formData.fecha_salida, total: nuevoTotal, diferencia: diferencia }
      });

      await supabase.from('consultas').update({ mensaje: mensaje, fecha_consulta: new Date().toISOString() }).eq('id', consulta.id);
      onSave();
    } catch (err:any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-xl"><h2 className="text-xl font-bold mb-6">{tituloModal}</h2>{error && <p className="text-red-500">{error}</p>}<form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><input type="date" value={formData.fecha_entrada} onChange={e=>setFormData({...formData, fecha_entrada:e.target.value})} className="border p-2 rounded"/><input type="date" value={formData.fecha_salida} onChange={e=>setFormData({...formData, fecha_salida:e.target.value})} className="border p-2 rounded"/></div><select value={selectedTipo} onChange={e=>{setSelectedTipo(e.target.value); const h=habitaciones.find((x:any)=>x.tipo===e.target.value); if(h) setFormData({...formData, habitacion_id:h.id})}} className="w-full border p-2 rounded">{tiposDisponibles.map((t:any)=><option key={t} value={t}>{t}</option>)}</select><div className="bg-slate-50 p-4 rounded"><p>Diferencia: {diferencia}</p></div><div className="flex gap-2"><button disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded">Actualizar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div></form></div></div>
  )
}