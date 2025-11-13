import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Servicio, Reserva } from '@/types'
import { Calendar, Users, Clock, CheckCircle, XCircle, Mail, Edit, AlertCircle, Send, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const UsuarioDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  // --- NUEVO: Estado para guardar consultas ---
  const [consultas, setConsultas] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)

  // Estado para el modal de solicitud
  const [showModal, setShowModal] = useState(false)
  const [reservaAEditar, setReservaAEditar] = useState<Reserva | null>(null)

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const habPromise = supabase.from('habitaciones').select('*').order('numero')
      const servPromise = supabase.from('servicios').select('*').eq('disponible', true)
      const resPromise = supabase.from('reservas').select('*').eq('usuario_id', user?.id).order('fecha_reserva', { ascending: false })
      
      // --- NUEVO: Cargamos también las consultas para verificar pendientes ---
      const consPromise = supabase.from('consultas').select('*').eq('usuario_id', user?.id).eq('estado', 'pendiente')

      const [habData, servData, resData, consData] = await Promise.all([
        habPromise,
        servPromise,
        resPromise,
        consPromise
      ])

      setHabitaciones(habData.data || [])
      setServicios(servData.data || [])
      setReservas(resData.data || [])
      setConsultas(consData.data || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirSolicitud = (reserva: Reserva) => {
    setReservaAEditar(reserva)
    setShowModal(true)
  }
  
  // Callback para recargar todo cuando se envía una solicitud
  const handleSolicitudEnviada = () => {
    setShowModal(false)
    cargarDatos() // Recarga para que aparezca el cartel de "Pendiente"
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
            {/* Badge si hay consultas pendientes */}
            {consultas.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {consultas.length}
              </span>
            )}
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
                <ReservaCard 
                  key={reserva.id} 
                  reserva={reserva} 
                  habitaciones={habitaciones}
                  consultasPendientes={consultas} // <-- Pasamos las consultas
                  onSolicitarCambio={() => handleAbrirSolicitud(reserva)}
                />
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
            {habitaciones
              .filter(h => h.estado === 'disponible')
              .map((habitacion) => (
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

      {/* Modal de Solicitud de Cambio */}
      {showModal && reservaAEditar && (
        <ModalSolicitarCambio
          reserva={reservaAEditar}
          habitaciones={habitaciones}
          onClose={() => setShowModal(false)}
          onSuccess={handleSolicitudEnviada} // <-- Nuevo callback
          user_id={user?.id}
        />
      )}
    </div>
  )
}

// --- TARJETA DE RESERVA ACTUALIZADA ---
const ReservaCard = ({ 
  reserva, 
  habitaciones,
  consultasPendientes, // <-- Recibimos las consultas
  onSolicitarCambio 
}: { 
  reserva: Reserva, 
  habitaciones: Habitacion[],
  consultasPendientes: any[],
  onSolicitarCambio: () => void
}) => {
  const habitacionInfo = habitaciones.find(h => h.id === reserva.habitacion_id);

  // --- LÓGICA CLAVE: ¿Tiene cambio pendiente? ---
  // Buscamos si hay alguna consulta pendiente cuyo mensaje contenga el ID de esta reserva
  const tieneCambioPendiente = consultasPendientes.some(c => 
    c.asunto.includes(reserva.id.slice(0,8)) || c.mensaje.includes(reserva.id)
  );

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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-slate-900 text-lg">
            {habitacionInfo 
              ? `Habitación ${habitacionInfo.numero} (${habitacionInfo.tipo})`
              : `Reserva #${reserva.id.slice(0, 8)}`
            }
          </h3>
          
          {/* Badge de estado normal */}
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getEstadoColor(reserva.estado)} md:hidden`}>
            {getEstadoIcon(reserva.estado)}
            <span className="capitalize">{reserva.estado}</span>
          </span>
        </div>
        
        <p className="text-sm text-slate-500 mb-1">
          {new Date(reserva.fecha_entrada).toLocaleDateString('es-ES')} - {new Date(reserva.fecha_salida).toLocaleDateString('es-ES')}
        </p>
        <div className="flex items-center gap-4 text-sm">
          <p className="flex items-center gap-1 text-slate-600">
            <Users className="h-4 w-4" />
            {reserva.num_huespedes} pax
          </p>
          <p className="font-semibold text-amber-600">
            Total: ${reserva.total.toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
        <span className={`hidden md:flex px-3 py-1 rounded-full text-sm font-medium items-center gap-1 ${getEstadoColor(reserva.estado)}`}>
          {getEstadoIcon(reserva.estado)}
          <span className="capitalize">{reserva.estado}</span>
        </span>
        
        {/* --- AQUÍ ESTÁ EL CAMBIO VISUAL --- */}
        {tieneCambioPendiente ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 w-full md:w-auto justify-center">
            <RefreshCw className="h-4 w-4 animate-spin-slow" />
            <span className="font-medium text-sm">Cambio Solicitado</span>
          </div>
        ) : (
          // Solo mostramos el botón si NO hay cambios pendientes Y está activa
          reserva.estado === 'activa' && (
            <button
              onClick={onSolicitarCambio}
              className="w-full md:w-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors border border-blue-200"
            >
              <Edit className="h-4 w-4" />
              Solicitar Cambio
            </button>
          )
        )}
      </div>
    </div>
  )
}

const ModalSolicitarCambio = ({
  reserva,
  habitaciones,
  onClose,
  onSuccess, // <-- Nuevo prop
  user_id
}: {
  reserva: Reserva
  habitaciones: Habitacion[]
  onClose: () => void
  onSuccess: () => void
  user_id: string | undefined
}) => {
  const [formData, setFormData] = useState({
    habitacion_id: reserva.habitacion_id,
    fecha_entrada: reserva.fecha_entrada,
    fecha_salida: reserva.fecha_salida,
  });
  
  // Estado para el filtro de tipo
  const habActual = habitaciones.find(h => h.id === reserva.habitacion_id);
  const [selectedTipo, setSelectedTipo] = useState(habActual?.tipo || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Cálculo de precios
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
    } catch (e) {
      console.error(e);
    }
  }, [formData, habitaciones, reserva.total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      const habOriginal = habitaciones.find(h => h.id === reserva.habitacion_id);
      const habNueva = habitaciones.find(h => h.id === formData.habitacion_id);
      
      const mensaje = `
SOLICITUD DE MODIFICACIÓN DE RESERVA
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

      await supabase.from('consultas').insert([{
        usuario_id: user_id,
        asunto: `Solicitud Cambio - Reserva #${reserva.id.slice(0,8)}`,
        mensaje: mensaje,
        estado: 'pendiente',
        fecha_consulta: new Date().toISOString()
      }]);

      setSuccess(true);

    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-slate-600 mb-6">
            Hemos verificado la disponibilidad y enviado tu solicitud. Podés ver el estado o cancelarla en "Mis Consultas".
          </p>
          <button onClick={onSuccess} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
            Entendido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-xl w-full">
        <h2 className="text-xl font-bold mb-6">Solicitar Cambio de Reserva</h2>
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
              <input
                type="date"
                name="fecha_entrada"
                value={new Date(formData.fecha_entrada).toISOString().split('T')[0]}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Salida</label>
              <input
                type="date"
                name="fecha_salida"
                value={new Date(formData.fecha_salida).toISOString().split('T')[0]}
                onChange={handleChange}
                min={formData.fecha_entrada}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Habitación Deseada
            </label>
            <select
              value={selectedTipo}
              onChange={handleTipoChange}
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium"
            >
              {habitaciones.map(h => h.tipo).filter((v, i, a) => a.indexOf(v) === i).map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          <div className="hidden">
             {/* Select oculto pero funcional para la logica */}
            <select name="habitacion_id" value={formData.habitacion_id} onChange={handleChange}>
              {habitacionesFiltradas.map(h => <option key={h.id} value={h.id}>{h.numero}</option>)}
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
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"/> : <Send className="h-4 w-4" />}
              Enviar Solicitud
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const HabitacionCard = ({ habitacion, navigate }: { habitacion: Habitacion, navigate: any }) => {
  // ... (Este componente queda igual que antes, solo copialo del anterior si lo necesitas, pero ya está incluido si copias todo)
  // Por brevedad, asumo que está ok, pero asegurate de que esté presente.
  // Lo incluyo completo para que sea copiar y pegar.
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