import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva } from '@/types'
import { Calendar, Users, CheckCircle, XCircle, Clock, MessageSquare, Send, X, Mail, User as UserIcon, Bed, Edit, Save, RefreshCw, AlertCircle, ArrowRight, Check } from 'lucide-react'

export const OperadorDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'reservas' | 'consultas'>('reservas')
  
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [consultas, setConsultas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [resData, habData, cliData, consData] = await Promise.all([
        supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false }),
        supabase.from('habitaciones').select('*'),
        supabase.from('usuarios').select('*').eq('rol', 'usuario'),
        supabase.from('consultas').select('*').order('fecha_consulta', { ascending: false })
      ])
      setReservas(resData.data || [])
      setHabitaciones(habData.data || [])
      setClientes(cliData.data || [])
      setConsultas(consData.data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div></div>

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Panel de Operador</h1>
          <p className="text-slate-600">Gestión operativa diaria</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-1">
          <button onClick={() => setActiveTab('reservas')} className={`px-4 py-3 font-medium flex items-center gap-2 rounded-t-lg ${activeTab === 'reservas' ? 'bg-white text-amber-600 border-b-2 border-amber-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Calendar className="h-5 w-5" /> Reservas
          </button>
          <button onClick={() => setActiveTab('consultas')} className={`px-4 py-3 font-medium flex items-center gap-2 rounded-t-lg ${activeTab === 'consultas' ? 'bg-white text-amber-600 border-b-2 border-amber-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            <MessageSquare className="h-5 w-5" /> Consultas
            {consultas.filter(c => c.estado === 'pendiente').length > 0 && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2 animate-pulse">{consultas.filter(c => c.estado === 'pendiente').length}</span>}
          </button>
        </div>

        {activeTab === 'reservas' && <ListaReservas reservas={reservas} habitaciones={habitaciones} clientes={clientes} onRecargar={cargarDatos} />}
        {activeTab === 'consultas' && <ListaConsultas consultas={consultas} clientes={clientes} onRecargar={cargarDatos} />}
      </div>
    </div>
  )
}

const ListaReservas = ({ reservas, habitaciones, clientes, onRecargar }: any) => {
  const [showModal, setShowModal] = useState(false); const [reservaAEditar, setReservaAEditar] = useState<Reserva | null>(null)
  const handleEstado = async (id: string, nE: string) => { if (!confirm(`¿Confirmar acción?`)) return; await supabase.from('reservas').update({ estado: nE }).eq('id', id); onRecargar(); }
  const handleEditar = (r: Reserva) => { setReservaAEditar(r); setShowModal(true); }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reservas.map((r: any) => {
          const c = clientes.find((u: any) => u.id === r.usuario_id); const h = habitaciones.find((ha: any) => ha.id === r.habitacion_id);
          return (
            <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-full"><UserIcon className="h-6 w-6 text-slate-500" /></div>
                  <div><h3 className="font-bold text-lg text-slate-900">{c ? c.nombre : 'Cliente Desconocido'}</h3><p className="text-sm text-slate-500">{c?.email}</p></div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${r.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{r.estado}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700"><Bed className="h-4 w-4 text-amber-600" /><span className="font-medium">{h ? `Hab. ${h.numero} - ${h.tipo}` : 'Habitación no encontrada'}</span></div>
                <div className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4" /><span>{new Date(r.fecha_entrada).toLocaleDateString()} ➔ {new Date(r.fecha_salida).toLocaleDateString()}</span></div>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between"><span className="text-slate-500">Total:</span><span className="font-bold text-amber-600">${r.total}</span></div>
              </div>
              {r.estado === 'activa' && (
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleEstado(r.id, 'completada')} className="bg-green-100 text-green-700 py-2 rounded flex justify-center items-center gap-1"><CheckCircle className="h-4 w-4" /> Out</button>
                  <button onClick={() => handleEditar(r)} className="bg-blue-100 text-blue-700 py-2 rounded flex justify-center items-center gap-1"><Edit className="h-4 w-4" /> Edit</button>
                  <button onClick={() => handleEstado(r.id, 'cancelada')} className="bg-red-100 text-red-600 py-2 rounded flex justify-center items-center gap-1"><XCircle className="h-4 w-4" /> Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showModal && reservaAEditar && <ModalEditarReserva reserva={reservaAEditar} habitaciones={habitaciones} clientes={clientes} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); onRecargar(); }} />}
    </>
  )
}

// --- GESTIÓN DE CONSULTAS INTELIGENTE (LEE JSON) ---
const ListaConsultas = ({ consultas, clientes, onRecargar }: any) => {
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any | null>(null)

  const parseMensaje = (mensaje: string) => {
    try {
      const data = JSON.parse(mensaje);
      if (data && data.type === 'SOLICITUD_CAMBIO_ESTRUCTURADA') {
        return { esEstructurado: true, data: data };
      }
    } catch (e) { /* No es JSON, es texto normal */ }
    return { esEstructurado: false, texto: mensaje };
  };

  return (
    <>
      <div className="space-y-4">
        {consultas.map((c: any) => {
          const cli = clientes.find((u: any) => u.id === c.usuario_id);
          const contenido = parseMensaje(c.mensaje);

          return (
            <div key={c.id} onClick={() => setConsultaSeleccionada(c)} className={`bg-white p-6 rounded-xl border cursor-pointer hover:shadow-md ${c.estado === 'pendiente' ? 'border-l-4 border-l-amber-500' : 'opacity-75'}`}>
              <div className="flex justify-between mb-2">
                <div><h3 className="font-bold text-slate-900">{c.asunto}</h3><p className="text-sm text-slate-500">De: {cli?.nombre}</p></div>
                {c.estado === 'pendiente' ? <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">Pendiente</span> : <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Respondida</span>}
              </div>
              
              {/* VISTA PREVIA */}
              {contenido.esEstructurado ? (
                <div className="bg-blue-50 p-3 rounded text-blue-800 text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4"/> Solicitud de Cambio: {contenido.data.original.habTipo} ➔ {contenido.data.nuevo.habTipo}
                </div>
              ) : (
                <p className="text-slate-700 line-clamp-2">{c.mensaje}</p>
              )}
            </div>
          )
        })}
      </div>
      {consultaSeleccionada && <ModalResponderConsulta consulta={consultaSeleccionada} cliente={clientes.find((c: any) => c.id === consultaSeleccionada.usuario_id)} onClose={() => setConsultaSeleccionada(null)} onSuccess={() => { setConsultaSeleccionada(null); onRecargar() }} />}
    </>
  )
}

// --- MODAL DE RESPUESTA CON APROBACIÓN AUTOMÁTICA ---
const ModalResponderConsulta = ({ consulta, cliente, onClose, onSuccess }: any) => {
  const [respuesta, setRespuesta] = useState(consulta.respuesta || '');
  const [loading, setLoading] = useState(false);

  // Intentar parsear si es una solicitud estructurada
  let solicitudData = null;
  try {
    const parsed = JSON.parse(consulta.mensaje);
    if (parsed.type === 'SOLICITUD_CAMBIO_ESTRUCTURADA') solicitudData = parsed;
  } catch (e) {}

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await supabase.from('consultas').update({ respuesta, estado: 'respondida', fecha_respuesta: new Date().toISOString() }).eq('id', consulta.id);
      onSuccess();
    } catch (error) { console.error(error); alert('Error'); } finally { setLoading(false); }
  }

  // --- FUNCIÓN PARA APROBAR CAMBIO AUTOMÁTICAMENTE ---
  const handleAprobarCambio = async () => {
    if (!confirm("¿Estás seguro de APROBAR este cambio? Se modificará la reserva automáticamente.")) return;
    setLoading(true);
    try {
      // 1. Actualizar la reserva
      const { error: updateError } = await supabase.from('reservas').update({
        habitacion_id: solicitudData.nuevo.habitacion_id,
        fecha_entrada: solicitudData.nuevo.entrada,
        fecha_salida: solicitudData.nuevo.salida,
        total: solicitudData.nuevo.total
      }).eq('id', solicitudData.reservaId);

      if (updateError) throw updateError;

      // 2. Marcar consulta como respondida automáticamente
      await supabase.from('consultas').update({
        respuesta: `[SISTEMA] Solicitud APROBADA. Se han aplicado los cambios a la reserva #${solicitudData.reservaId.slice(0,8)}.`,
        estado: 'respondida',
        fecha_respuesta: new Date().toISOString()
      }).eq('id', consulta.id);

      onSuccess();
      alert("¡Cambio aplicado exitosamente!");

    } catch (err: any) {
      alert("Error al aplicar cambios: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN PARA RECHAZAR ---
  const handleRechazarCambio = async () => {
    if (!confirm("¿Rechazar solicitud?")) return;
    setRespuesta("Lamentablemente no podemos procesar su solicitud en este momento debido a falta de disponibilidad o políticas del hotel.");
    // El usuario luego debe hacer click en "Enviar Respuesta" para confirmar el rechazo
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between mb-4 border-b pb-2">
          <h2 className="font-bold text-xl">Responder Consulta</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
          {/* SI ES UNA SOLICITUD ESTRUCTURADA, MOSTRAMOS LA COMPARACIÓN */}
          {solicitudData ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><RefreshCw className="h-4 w-4"/> Solicitud de Cambio</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="font-bold text-slate-500 mb-1">ACTUAL</p>
                  <p>Hab: {solicitudData.original.habNumero} ({solicitudData.original.habTipo})</p>
                  <p>{new Date(solicitudData.original.entrada).toLocaleDateString()} ➔ {new Date(solicitudData.original.salida).toLocaleDateString()}</p>
                  <p className="font-bold mt-1">${solicitudData.original.total}</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200 ring-2 ring-blue-100">
                  <p className="font-bold text-blue-600 mb-1">SOLICITADO</p>
                  <p>Hab: {solicitudData.nuevo.habNumero} ({solicitudData.nuevo.habTipo})</p>
                  <p>{new Date(solicitudData.nuevo.entrada).toLocaleDateString()} ➔ {new Date(solicitudData.nuevo.salida).toLocaleDateString()}</p>
                  <p className="font-bold mt-1 text-blue-700">${solicitudData.nuevo.total}</p>
                </div>
              </div>
              
              <div className="mt-3 text-center font-bold text-slate-700">
                Diferencia: <span className={solicitudData.nuevo.diferencia > 0 ? 'text-red-600' : 'text-green-600'}>${solicitudData.nuevo.diferencia}</span>
              </div>

              {/* BOTONES DE ACCIÓN RÁPIDA */}
              {consulta.estado === 'pendiente' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={handleAprobarCambio} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex justify-center items-center gap-2 shadow-sm transition-colors">
                    <Check className="h-4 w-4"/> Aprobar y Aplicar
                  </button>
                  <button onClick={handleRechazarCambio} disabled={loading} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded flex justify-center items-center gap-2 transition-colors">
                    <X className="h-4 w-4"/> Rechazar
                  </button>
                </div>
              )}
            </div>
          ) : (
            // SI ES TEXTO NORMAL
            <div className="bg-slate-50 p-4 rounded mb-4 text-slate-800 whitespace-pre-wrap">
              {consulta.mensaje}
            </div>
          )}

          <form onSubmit={handleResponder}>
            <textarea 
              className="w-full border p-3 rounded h-32 focus:ring-2 focus:ring-amber-500 outline-none" 
              placeholder="Escribe tu respuesta..." 
              value={respuesta} 
              onChange={e=>setRespuesta(e.target.value)} 
              required 
              readOnly={consulta.estado==='respondida'}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Cerrar</button>
              {consulta.estado!=='respondida' && <button disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"><Send className="h-4 w-4"/> Enviar Respuesta</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ModalEditarReserva (Se reutiliza el mismo código que te pasé antes, pegalo aquí abajo si falta)
const ModalEditarReserva = ({ reserva, habitaciones, clientes, onClose, onSave }: any) => {
    // ... (Código del ModalEditarReserva que ya tenés, igual que en Admin) ...
    // Para ahorrar espacio no lo repito, pero ASEGURATE de que esté definido en este archivo.
    // Si lo necesitas, copialo del AdminDashboard.tsx, es idéntico.
    const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida, num_huespedes: reserva.num_huespedes });
    const [total, setTotal] = useState(reserva.total); const [error, setError] = useState(''); const cliente = clientes.find((c:any) => c.id === reserva.usuario_id);
    useEffect(() => { const h = habitaciones.find((x:any)=>x.id===formData.habitacion_id); if(h && formData.fecha_entrada && formData.fecha_salida) { const dias = Math.ceil((new Date(formData.fecha_salida + 'T00:00:00').getTime() - new Date(formData.fecha_entrada + 'T00:00:00').getTime())/(1000*60*60*24)); setTotal(dias > 0 ? dias * h.precio_noche : 0); } }, [formData, habitaciones]);
    const handleSubmit = async (e:any) => { e.preventDefault(); setError(''); try { if(new Date(formData.fecha_salida) <= new Date(formData.fecha_entrada)) throw new Error("Fechas inválidas"); const {data} = await supabase.functions.invoke('check-room-availability', { body: {...formData, reserva_id_excluir: reserva.id} }); if(!data?.data?.available) throw new Error('No disponible en esas fechas'); await supabase.from('reservas').update({...formData, total}).eq('id', reserva.id); onSave(); } catch(err:any) { setError(err.message); } };
    return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="font-bold text-xl mb-4">Editar Reserva</h2><form onSubmit={handleSubmit} className="space-y-4">{error && <p className="text-red-700">{error}</p>}<select value={formData.habitacion_id} onChange={e=>setFormData({...formData, habitacion_id:e.target.value})} className="w-full border p-2 rounded">{habitaciones.map((h:any)=><option key={h.id} value={h.id}>{h.numero} - {h.tipo}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="date" value={formData.fecha_entrada} onChange={e=>setFormData({...formData, fecha_entrada:e.target.value})} className="border p-2 rounded"/><input type="date" value={formData.fecha_salida} onChange={e=>setFormData({...formData, fecha_salida:e.target.value})} className="border p-2 rounded"/></div><div className="flex justify-between font-bold"><span>Nuevo Total:</span><span>${total}</span></div><div className="flex gap-2"><button className="flex-1 bg-amber-600 text-white py-2 rounded">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div></form></div></div>
}