import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva } from '@/types'
import { Calendar, Users, CheckCircle, XCircle, Clock, MessageSquare, Send, X, Mail, User as UserIcon, Bed } from 'lucide-react'

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
      // 1. Cargar Reservas
      const resPromise = supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false })
      // 2. Cargar Habitaciones (para saber nombres y tipos)
      const habPromise = supabase.from('habitaciones').select('*')
      // 3. Cargar Clientes (para saber nombres de huéspedes)
      const cliPromise = supabase.from('usuarios').select('*').eq('rol', 'usuario')
      // 4. Cargar Consultas
      const consPromise = supabase.from('consultas').select('*').order('fecha_consulta', { ascending: false })

      const [resData, habData, cliData, consData] = await Promise.all([
        resPromise, habPromise, cliPromise, consPromise
      ])

      setReservas(resData.data || [])
      setHabitaciones(habData.data || [])
      setClientes(cliData.data || [])
      setConsultas(consData.data || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
            Panel de Operador
          </h1>
          <p className="text-slate-600">Gestión operativa diaria</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'reservas'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Gestión de Reservas
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full ml-2">
              {reservas.filter(r => r.estado === 'activa').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('consultas')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'consultas'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            Bandeja de Consultas
            {consultas.filter(c => c.estado === 'pendiente').length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full ml-2 animate-pulse">
                {consultas.filter(c => c.estado === 'pendiente').length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido */}
        {activeTab === 'reservas' && (
          <ListaReservas 
            reservas={reservas} 
            habitaciones={habitaciones} 
            clientes={clientes}
            onRecargar={cargarDatos} 
          />
        )}
        
        {activeTab === 'consultas' && (
          <ListaConsultas 
            consultas={consultas} 
            clientes={clientes}
            onRecargar={cargarDatos} 
          />
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// COMPONENTE: LISTA DE RESERVAS (MEJORADO)
// ------------------------------------------------------------------
const ListaReservas = ({ 
  reservas, 
  habitaciones, 
  clientes, 
  onRecargar 
}: { 
  reservas: Reserva[], 
  habitaciones: Habitacion[], 
  clientes: Usuario[], 
  onRecargar: () => void 
}) => {
  
  const handleEstado = async (id: string, nuevoEstado: string) => {
    const accion = nuevoEstado === 'completada' ? 'finalizar (check-out)' : 'cancelar';
    if (!confirm(`¿Estás seguro de que deseas ${accion} esta reserva?`)) return

    try {
      await supabase
        .from('reservas')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      
      // Si se cancela o completa, liberamos la habitación (opcional, depende de tu lógica de fechas)
      // En este modelo simple, cambiamos el estado de la reserva y listo.
      
      onRecargar()
    } catch (error) {
      console.error('Error actualizando reserva:', error)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {reservas.map((reserva) => {
        // Buscamos los datos reales relacionando los IDs
        const cliente = clientes.find(c => c.id === reserva.usuario_id)
        const habitacion = habitaciones.find(h => h.id === reserva.habitacion_id)

        return (
          <div key={reserva.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full">
                  <UserIcon className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {cliente ? cliente.nombre : 'Cliente Desconocido'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {cliente ? cliente.email : 'Email no disponible'}
                  </p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                reserva.estado === 'activa' ? 'bg-green-100 text-green-700' :
                reserva.estado === 'completada' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {reserva.estado}
              </span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Bed className="h-4 w-4 text-amber-600" />
                <span className="font-medium">
                  {habitacion ? `Habitación ${habitacion.numero} - ${habitacion.tipo}` : 'Habitación no encontrada'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(reserva.fecha_entrada).toLocaleDateString('es-ES')} 
                  {' ➔ '} 
                  {new Date(reserva.fecha_salida).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Users className="h-4 w-4" />
                <span>{reserva.num_huespedes} huéspedes</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm text-slate-500">Total a pagar:</span>
                <span className="text-lg font-bold text-amber-600">${reserva.total.toLocaleString('es-ES')}</span>
              </div>
            </div>

            {/* Botones de Acción */}
            {reserva.estado === 'activa' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleEstado(reserva.id, 'completada')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Check-out
                </button>
                <button
                  onClick={() => handleEstado(reserva.id, 'cancelada')}
                  className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------
// COMPONENTE: LISTA DE CONSULTAS (CON MODAL DE RESPUESTA)
// ------------------------------------------------------------------
const ListaConsultas = ({ 
  consultas, 
  clientes, 
  onRecargar 
}: { 
  consultas: any[], 
  clientes: Usuario[], 
  onRecargar: () => void 
}) => {
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any | null>(null)

  return (
    <>
      <div className="space-y-4">
        {consultas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay consultas pendientes.</p>
          </div>
        )}
        
        {consultas.map((consulta) => {
          const cliente = clientes.find(c => c.id === consulta.usuario_id)
          const esSolicitudCambio = consulta.asunto.toLowerCase().includes('solicitud') || consulta.asunto.toLowerCase().includes('cambio');

          return (
            <div 
              key={consulta.id} 
              // Hacemos que toda la tarjeta sea clickeable para abrir el modal
              onClick={() => setConsultaSeleccionada(consulta)}
              className={`bg-white p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md group ${
                consulta.estado === 'pendiente' 
                  ? 'border-l-4 border-l-amber-500 border-y-slate-200 border-r-slate-200' 
                  : 'border-slate-200 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                      {consulta.asunto}
                    </h3>
                    {esSolicitudCambio && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                        Solicitud
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    De: {cliente ? cliente.nombre : 'Usuario'} • {new Date(consulta.fecha_consulta).toLocaleString('es-ES')}
                  </p>
                </div>
                
                {consulta.estado === 'pendiente' ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Respondida
                  </span>
                )}
              </div>

              <p className="text-slate-700 line-clamp-2 mb-2">
                {consulta.mensaje}
              </p>

              <div className="text-sm text-blue-600 font-medium flex items-center gap-1 group-hover:underline">
                <MessageSquare className="h-4 w-4" />
                {consulta.estado === 'pendiente' ? 'Clic para responder' : 'Ver detalles'}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL PARA RESPONDER */}
      {consultaSeleccionada && (
        <ModalResponderConsulta 
          consulta={consultaSeleccionada}
          cliente={clientes.find(c => c.id === consultaSeleccionada.usuario_id)}
          onClose={() => setConsultaSeleccionada(null)}
          onSuccess={() => {
            setConsultaSeleccionada(null)
            onRecargar()
          }}
        />
      )}
    </>
  )
}

// --- MODAL DE RESPUESTA ---
const ModalResponderConsulta = ({ 
  consulta, 
  cliente, 
  onClose, 
  onSuccess 
}: { 
  consulta: any, 
  cliente: Usuario | undefined, 
  onClose: () => void, 
  onSuccess: () => void 
}) => {
  const [respuesta, setRespuesta] = useState(consulta.respuesta || '')
  const [loading, setLoading] = useState(false)

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase
        .from('consultas')
        .update({
          respuesta: respuesta,
          estado: 'respondida',
          fecha_respuesta: new Date().toISOString()
        })
        .eq('id', consulta.id)
      
      onSuccess()
    } catch (error) {
      console.error(error)
      alert('Error al enviar respuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header del Modal */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Responder Consulta</h2>
            <p className="text-sm text-slate-500">Cliente: {cliente?.nombre || 'Desconocido'} ({cliente?.email})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Mensaje Original */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Mensaje del Cliente</h3>
            <p className="text-slate-800 whitespace-pre-wrap">{consulta.mensaje}</p>
            <p className="text-xs text-slate-400 mt-2 text-right">
              Enviado el: {new Date(consulta.fecha_consulta).toLocaleString()}
            </p>
          </div>

          {/* Formulario de Respuesta */}
          <form onSubmit={handleResponder}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tu Respuesta
              </label>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[150px]"
                placeholder="Escribe tu respuesta aquí..."
                readOnly={consulta.estado === 'respondida'} // Si ya está respondida, solo lectura
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
              
              {consulta.estado !== 'respondida' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Enviando...' : (
                    <>
                      <Send className="h-4 w-4" /> Enviar Respuesta
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}