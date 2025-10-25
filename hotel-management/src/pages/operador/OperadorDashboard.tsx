import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Reserva, Consulta } from '@/types'
import { MapPin, Calendar, Mail, Check, X, Unlock, Lock } from 'lucide-react'

export const OperadorDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'habitaciones' | 'reservas' | 'consultas'>('habitaciones')
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: habData } = await supabase
        .from('habitaciones')
        .select('*')
        .order('numero')

      const { data: resData } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha_reserva', { ascending: false })

      const { data: conData } = await supabase
        .from('consultas')
        .select('*')
        .order('fecha_consulta', { ascending: false })

      setHabitaciones(habData || [])
      setReservas(resData || [])
      setConsultas(conData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoHabitacion = async (id: string, nuevoEstado: string) => {
    try {
      await supabase
        .from('habitaciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      
      cargarDatos()
    } catch (error) {
      console.error('Error actualizando habitación:', error)
    }
  }

  const cambiarEstadoReserva = async (id: string, nuevoEstado: string) => {
    try {
      await supabase
        .from('reservas')
        .update({ estado: nuevoEstado })
        .eq('id', id)
      
      cargarDatos()
    } catch (error) {
      console.error('Error actualizando reserva:', error)
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
          <p className="text-slate-600">Gestión de habitaciones, reservas y consultas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('habitaciones')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'habitaciones'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-5 w-5" />
            Habitaciones ({habitaciones.length})
          </button>
          <button
            onClick={() => setActiveTab('reservas')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'reservas'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-5 w-5" />
            Reservas ({reservas.length})
          </button>
          <button
            onClick={() => setActiveTab('consultas')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'consultas'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-5 w-5" />
            Consultas ({consultas.filter(c => c.estado === 'pendiente').length} pendientes)
          </button>
        </div>

        {/* Contenido */}
        {activeTab === 'habitaciones' && (
          <GestionHabitaciones habitaciones={habitaciones} onCambiarEstado={cambiarEstadoHabitacion} />
        )}
        {activeTab === 'reservas' && (
          <GestionReservas reservas={reservas} onCambiarEstado={cambiarEstadoReserva} />
        )}
        {activeTab === 'consultas' && (
          <GestionConsultas consultas={consultas} onRecargar={cargarDatos} />
        )}
      </div>
    </div>
  )
}

const GestionHabitaciones = ({ 
  habitaciones, 
  onCambiarEstado 
}: { 
  habitaciones: Habitacion[]
  onCambiarEstado: (id: string, estado: string) => void 
}) => {
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 mb-1">Disponibles</p>
          <p className="text-3xl font-bold text-green-900">
            {habitaciones.filter(h => h.estado === 'disponible').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 mb-1">Ocupadas</p>
          <p className="text-3xl font-bold text-red-900">
            {habitaciones.filter(h => h.estado === 'ocupada').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-sm text-yellow-700 mb-1">Mantenimiento</p>
          <p className="text-3xl font-bold text-yellow-900">
            {habitaciones.filter(h => h.estado === 'mantenimiento').length}
          </p>
        </div>
      </div>

      {/* Lista de Habitaciones */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habitaciones.map((habitacion) => (
          <div key={habitacion.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Habitación {habitacion.numero}</h3>
                <p className="text-sm text-slate-600">{habitacion.tipo}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                habitacion.estado === 'disponible' 
                  ? 'bg-green-100 text-green-700'
                  : habitacion.estado === 'ocupada'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {habitacion.estado}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Capacidad: {habitacion.capacidad} personas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onCambiarEstado(habitacion.id, 'disponible')}
                className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Unlock className="h-4 w-4" />
                Disponible
              </button>
              <button
                onClick={() => onCambiarEstado(habitacion.id, 'mantenimiento')}
                className="flex-1 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Lock className="h-4 w-4" />
                Cerrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const GestionReservas = ({ 
  reservas, 
  onCambiarEstado 
}: { 
  reservas: Reserva[]
  onCambiarEstado: (id: string, estado: string) => void 
}) => {
  const [filtro, setFiltro] = useState<string>('todas')

  const reservasFiltradas = filtro === 'todas' 
    ? reservas 
    : reservas.filter(r => r.estado === filtro)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        {['todas', 'activa', 'completada', 'cancelada'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === f
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        {reservasFiltradas.map((reserva) => (
          <div key={reserva.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Reserva #{reserva.id.slice(0, 8)}</h3>
                <p className="text-sm text-slate-600">
                  {new Date(reserva.fecha_entrada).toLocaleDateString('es-ES')} - {new Date(reserva.fecha_salida).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-slate-600">{reserva.num_huespedes} huéspedes</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-600">${reserva.total.toLocaleString('es-ES')}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                  reserva.estado === 'activa' 
                    ? 'bg-green-100 text-green-700'
                    : reserva.estado === 'completada'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {reserva.estado}
                </span>
              </div>
            </div>
            {reserva.estado === 'activa' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onCambiarEstado(reserva.id, 'completada')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Completar
                </button>
                <button
                  onClick={() => onCambiarEstado(reserva.id, 'cancelada')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const GestionConsultas = ({ 
  consultas, 
  onRecargar 
}: { 
  consultas: Consulta[]
  onRecargar: () => void 
}) => {
  const [respuesta, setRespuesta] = useState('')
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<string | null>(null)

  const responderConsulta = async (id: string) => {
    try {
      await supabase
        .from('consultas')
        .update({ 
          respuesta, 
          estado: 'respondida',
          fecha_respuesta: new Date().toISOString()
        })
        .eq('id', id)
      
      setRespuesta('')
      setConsultaSeleccionada(null)
      onRecargar()
    } catch (error) {
      console.error('Error respondiendo consulta:', error)
    }
  }

  return (
    <div className="space-y-4">
      {consultas.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay consultas registradas</p>
        </div>
      ) : (
        consultas.map((consulta) => (
          <div key={consulta.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{consulta.asunto}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    consulta.estado === 'pendiente' 
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {consulta.estado}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{consulta.mensaje}</p>
                <p className="text-xs text-slate-400">
                  {new Date(consulta.fecha_consulta || '').toLocaleString('es-ES')}
                </p>
              </div>
            </div>
            
            {consulta.respuesta && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Respuesta:</p>
                <p className="text-sm text-blue-800">{consulta.respuesta}</p>
              </div>
            )}
            
            {consulta.estado === 'pendiente' && (
              <div className="mt-4">
                {consultaSeleccionada === consulta.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      rows={3}
                      placeholder="Escribe tu respuesta..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => responderConsulta(consulta.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                      >
                        Enviar Respuesta
                      </button>
                      <button
                        onClick={() => {
                          setConsultaSeleccionada(null)
                          setRespuesta('')
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConsultaSeleccionada(consulta.id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                  >
                    Responder
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
