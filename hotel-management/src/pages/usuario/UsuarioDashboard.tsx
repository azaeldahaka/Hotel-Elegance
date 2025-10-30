import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Servicio, Reserva } from '@/types'
import { Calendar, Users, Bed, Star, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const UsuarioDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Solo carga los datos SI el usuario ya está cargado
    if (user) {
      cargarDatos()
    }
  }, [user]) // <-- El array ahora "depende" del usuario

  const cargarDatos = async () => {
    try {
      // Cargar habitaciones disponibles
      const { data: habData } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('estado', 'disponible')
        .order('precio_noche')

      // Cargar servicios
      const { data: servData } = await supabase
        .from('servicios')
        .select('*')
        .eq('disponible', true)

      // Cargar reservas del usuario
      const { data: resData } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', user?.id)
        .order('fecha_reserva', { ascending: false })

      setHabitaciones(habData || [])
      setServicios(servData || [])
      setReservas(resData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
              Bienvenido, {user?.nombre}
            </h1>
            <p className="text-slate-600">Explora nuestras habitaciones y servicios</p>
          </div>
          <button
            onClick={() => navigate('/usuario/consultas')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
          >
            <Mail className="h-5 w-5" />
            Mis Consultas
          </button>
        </div>

        {/* Mis Reservas */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Mis Reservas</h2>
          {reservas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No tienes reservas activas</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reservas.map((reserva) => (
                <ReservaCard key={reserva.id} reserva={reserva} />
              ))}
            </div>
          )}
        </section>

        {/* Habitaciones Disponibles */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Habitaciones Disponibles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habitaciones.map((habitacion) => (
              <HabitacionCard key={habitacion.id} habitacion={habitacion} navigate={navigate} />
            ))}
          </div>
        </section>

        {/* Servicios */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Nuestros Servicios
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <ServicioCard key={servicio.id} servicio={servicio} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const ReservaCard = ({ reserva }: { reserva: Reserva }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-700'
      case 'completada': return 'bg-blue-100 text-blue-700'
      case 'cancelada': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <CheckCircle className="h-5 w-5" />
      case 'completada': return <Clock className="h-5 w-5" />
      case 'cancelada': return <XCircle className="h-5 w-5" />
      default: return null
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">Reserva #{reserva.id.slice(0, 8)}</h3>
          <p className="text-sm text-slate-500">
            {new Date(reserva.fecha_entrada).toLocaleDateString('es-ES')} - {new Date(reserva.fecha_salida).toLocaleDateString('es-ES')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getEstadoColor(reserva.estado)}`}>
          {getEstadoIcon(reserva.estado)}
          {reserva.estado}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-slate-600">
          <Users className="h-4 w-4" />
          {reserva.num_huespedes} huéspedes
        </p>
        <p className="text-lg font-semibold text-amber-600">
          Total: ${reserva.total.toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  )
}

const HabitacionCard = ({ habitacion, navigate }: { habitacion: Habitacion, navigate: any }) => {
  const imageMap: Record<string, string> = {
    'Simple': '/images/rooms/room-1.jpg',
    'Doble': '/images/rooms/room-2.jpg',
    'Suite': '/images/rooms/suite.jpg',
    'Suite Deluxe': '/images/rooms/suite.jpg',
    'Familiar': '/images/rooms/room-2.jpg',
    'Premium': '/images/rooms/suite.jpg',
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        <img
          src={imageMap[habitacion.tipo] || '/images/rooms/room-1.jpg'}
          alt={habitacion.tipo}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
          <span className="font-semibold text-slate-900">{habitacion.numero}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
          {habitacion.tipo}
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          {habitacion.descripcion}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">Capacidad: {habitacion.capacidad} personas</span>
        </div>
        {habitacion.amenidades && habitacion.amenidades.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {habitacion.amenidades.slice(0, 3).map((amenidad, idx) => (
                <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {amenidad}
                </span>
              ))}
              {habitacion.amenidades.length > 3 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  +{habitacion.amenidades.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-amber-600">
              ${habitacion.precio_noche?.toLocaleString('es-ES')}
            </p>
            <p className="text-xs text-slate-500">por noche</p>
          </div>
          <button 
            onClick={() => navigate(`/usuario/reservar/${habitacion.id}`)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all"
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}

const ServicioCard = ({ servicio }: { servicio: Servicio }) => {
  const imageMap: Record<string, string> = {
    'Spa & Wellness': '/images/services/spa.jpg',
    'Restaurante Gourmet': '/images/services/restaurant.jpg',
    'Gimnasio Premium': '/images/services/gym.jpg',
    'Piscina Infinita': '/images/services/pool.jpg',
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-48">
        <img
          src={imageMap[servicio.nombre] || '/images/services/spa.jpg'}
          alt={servicio.nombre}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
          {servicio.nombre}
        </h3>
        <p className="text-slate-600 text-sm mb-4">
          {servicio.descripcion}
        </p>
        <div className="flex justify-between items-center">
          {servicio.precio && servicio.precio > 0 ? (
            <p className="text-xl font-bold text-amber-600">
              ${servicio.precio.toLocaleString('es-ES')}
            </p>
          ) : (
            <p className="text-sm text-green-600 font-semibold">Incluido</p>
          )}
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
            Más Info
          </button>
        </div>
      </div>
    </div>
  )
}
