import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva } from '@/types'
// --- CAMBIO: Añadimos XCircle para el nuevo botón ---
import { Home, Users, BarChart3, Plus, Edit, Trash2, X, Save, TrendingUp, DollarSign, Calendar, Filter, AlertCircle, RefreshCw, XCircle } from 'lucide-react'
// Importamos los gráficos
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'habitaciones' | 'operadores' | 'estadisticas' | 'reservas'>('habitaciones')
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [operadores, setOperadores] = useState<Usuario[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  // Función de carga con Promise.all (Arregla la Race Condition)
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const habPromise = supabase.from('habitaciones').select('*').order('numero')
      const opPromise = supabase.from('usuarios').select('*').eq('rol', 'operador').order('nombre')
      const cliPromise = supabase.from('usuarios').select('*').eq('rol', 'usuario').order('nombre')
      const resPromise = supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false }) 

      const [habResult, opResult, resResult, cliResult] = await Promise.all([
        habPromise,
        opPromise,
        resPromise,
        cliPromise
      ]);
      
      setHabitaciones(habResult.data || [])
      setOperadores(opResult.data || [])
      setReservas(resResult.data || [])
      setClientes(cliResult.data || [])

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
            Panel de Administrador
          </h1>
          <p className="text-slate-600">Gestión completa del hotel</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('habitaciones')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'habitaciones'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="h-5 w-5" />
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
            onClick={() => setActiveTab('operadores')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'operadores'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-5 w-5" />
            Operadores ({operadores.length})
          </button>
          <button
            onClick={() => setActiveTab('estadisticas')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'estadisticas'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Estadísticas
          </button>
        </div>

        {/* Contenido */}
        {activeTab === 'habitaciones' && (
          <GestionHabitaciones habitaciones={habitaciones} onRecargar={cargarDatos} />
        )}
        {activeTab === 'reservas' && (
          <GestionReservas 
            reservas={reservas} 
            habitaciones={habitaciones}
            clientes={clientes} 
            onRecargar={cargarDatos}
          />
        )}
        {activeTab === 'operadores' && (
          <GestionOperadores operadores={operadores} onRecargar={cargarDatos} />
        )}
        {activeTab === 'estadisticas' && (
          <Estadisticas habitaciones={habitaciones} reservas={reservas} />
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------
// GESTIÓN DE RESERVAS (CON BOTÓN DE EDITAR Y CANCELAR)
// -----------------------------------------------------------
const GestionReservas = ({ 
  reservas, 
  habitaciones,
  clientes,
  onRecargar
}: { 
  reservas: any[], 
  habitaciones: Habitacion[],
  clientes: Usuario[],
  onRecargar: () => void
}) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [reservasFiltradas, setReservasFiltradas] = useState(reservas);

  const [showModal, setShowModal] = useState(false);
  const [reservaAEditar, setReservaAEditar] = useState<any | null>(null);

  const tiposDeHabitacion = [...new Set(habitaciones.map(h => h.tipo))];

  useEffect(() => {
    // Re-filtra la lista cada vez que cambien los datos o los filtros
    let tsInicio = 0;
    if (fechaInicio) {
      const [y, m, d] = fechaInicio.split('-').map(Number);
      tsInicio = new Date(y, m - 1, d, 0, 0, 0).getTime();
    }
    let tsFin = Infinity;
    if (fechaFin) {
      const [y, m, d] = fechaFin.split('-').map(Number);
      tsFin = new Date(y, m - 1, d, 23, 59, 59).getTime();
    }

    const filtradas = reservas.filter(reserva => {
      const tsReserva = new Date(reserva.fecha_reserva).getTime();
      if (tsReserva < tsInicio || tsReserva > tsFin) return false;
      
      if (filtroNombre) {
        const cliente = clientes.find(c => c.id === reserva.usuario_id);
        if (!cliente || !cliente.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      }
      
      if (filtroTipo) {
        const habitacion = habitaciones.find(h => h.id === reserva.habitacion_id);
        if (!habitacion || habitacion.tipo !== filtroTipo) return false;
      }
      
      return true;
    });

    setReservasFiltradas(filtradas);
  }, [reservas, fechaInicio, fechaFin, filtroNombre, filtroTipo, clientes, habitaciones]);

  const handleLimpiar = () => {
    setFechaInicio('');
    setFechaFin('');
    setFiltroNombre('');
    setFiltroTipo('');
  };

  const handleAbrirModal = (reserva: any) => {
    setReservaAEditar(reserva);
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setReservaAEditar(null);
  };
  
  const handleGuardarEdicion = () => {
    onRecargar();
    handleCerrarModal();
  };

  // --- ¡NUEVA FUNCIÓN PARA CANCELAR! ---
  const handleCancelar = async (reservaId: string) => {
    if (!confirm('¿Estás seguro de que querés CANCELAR esta reserva? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await supabase
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('id', reservaId);
        
      onRecargar(); // Refresca la lista
    } catch (err: any) {
      console.error("Error al cancelar reserva:", err);
      alert("Error al cancelar la reserva: " + err.message);
    }
  };

  return (
    <div>
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Desde (Fecha Reserva)
          </label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Hasta (Fecha Reserva)
          </label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre Huésped
          </label>
          <input type="text" placeholder="Buscar por nombre..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipo Habitación
          </label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
            <option value="">Todos</option>
            {tiposDeHabitacion.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex gap-4">
          <button onClick={handleLimpiar} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Reservas Filtradas */}
      <div className="grid md:grid-cols-2 gap-6">
        {reservasFiltradas.length === 0 && (
          <p className="text-slate-500 col-span-2">
            No se encontraron reservas con esos filtros.
          </p>
        )}
        {reservasFiltradas.map((reserva) => {
          const habInfo = habitaciones.find(h => h.id === reserva.habitacion_id);
          const clienteInfo = clientes.find(c => c.id === reserva.usuario_id);

          return (
            <div key={reserva.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">
                      {clienteInfo ? clienteInfo.nombre : `ID Usuario: ${reserva.usuario_id.slice(0,8)}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {clienteInfo ? clienteInfo.email : 'Email no encontrado'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reserva.estado === 'activa' ? 'bg-green-100 text-green-700' :
                    reserva.estado === 'completada' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {reserva.estado}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2 font-semibold">
                  {habInfo ? `Habitación ${habInfo.numero} (${habInfo.tipo})` : `ID Habitación: ${reserva.habitacion_id.slice(0, 8)}...`}
                </p>
                <div className="text-sm space-y-1 text-slate-700">
                  <p><strong>Check-in:</strong> {new Date(reserva.fecha_entrada + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                  <p><strong>Check-out:</strong> {new Date(reserva.fecha_salida + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                  <p><strong>Huéspedes:</strong> {reserva.num_huespedes}</p>
                  <p className="font-bold text-lg text-amber-600 mt-2">Total: ${reserva.total.toLocaleString('es-ES')}</p>
                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
                    Reservado el: {new Date(reserva.fecha_reserva).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {/* --- ¡NUEVO LAYOUT DE BOTONES! --- */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAbrirModal(reserva)}
                  // Solo se puede editar si está 'activa'
                  disabled={reserva.estado !== 'activa'}
                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleCancelar(reserva.id)}
                  // Solo se puede cancelar si está 'activa'
                  disabled={reserva.estado !== 'activa'}
                  className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              </div>

            </div>
          )
        })}
      </div>

      {showModal && (
        <ModalEditarReserva 
          reserva={reservaAEditar}
          habitaciones={habitaciones}
          clientes={clientes} 
          onClose={handleCerrarModal}
          onSave={handleGuardarEdicion}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------
// GESTIÓN DE HABITACIONES
// -----------------------------------------------------------
const GestionHabitaciones = ({ 
  habitaciones, 
  onRecargar 
}: { 
  habitaciones: Habitacion[]
  onRecargar: () => void 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Habitacion | null>(null)
  const [formData, setFormData] = useState({
    numero: '',
    tipo: '',
    precio_noche: '',
    capacidad: '',
    amenidades: '',
    descripcion: '',
    estado: 'disponible'
  })

  const resetForm = () => {
    setFormData({
      numero: '',
      tipo: '',
      precio_noche: '',
      capacidad: '',
      amenidades: '',
      descripcion: '',
      estado: 'disponible'
    })
    setEditando(null)
    setShowModal(false)
  }

  const handleEdit = (hab: Habitacion) => {
    setEditando(hab)
    setFormData({
      numero: hab.numero,
      tipo: hab.tipo,
      precio_noche: hab.precio_noche?.toString() || '',
      capacidad: hab.capacidad?.toString() || '',
      amenidades: hab.amenidades?.join(', ') || '',
      descripcion: hab.descripcion || '',
      estado: hab.estado
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSave = {
      numero: formData.numero,
      tipo: formData.tipo,
      precio_noche: parseFloat(formData.precio_noche),
      capacidad: parseInt(formData.capacidad),
      amenidades: formData.amenidades.split(',').map(a => a.trim()),
      descripcion: formData.descripcion,
      estado: formData.estado
    }

    try {
      if (editando) {
        await supabase
          .from('habitaciones')
          .update(dataToSave)
          .eq('id', editando.id)
      } else {
        await supabase
          .from('habitaciones')
          .insert([dataToSave])
      }
      
      resetForm()
      onRecargar()
    } catch (error) {
      console.error('Error guardando habitación:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta habitación?')) return
    
    try {
      await supabase
        .from('habitaciones')
        .delete()
        .eq('id', id)
      
      onRecargar()
    } catch (error) {
      console.error('Error eliminando habitación:', error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Nueva Habitación
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitaciones.map((hab) => (
          <div key={hab.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Habitación {hab.numero}</h3>
                <p className="text-sm text-slate-600">{hab.tipo}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                hab.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                hab.estado === 'ocupada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {hab.estado}
              </span>
            </div>
            <div className="mb-4 space-y-1 text-sm text-slate-600">
              <p>Capacidad: {hab.capacidad} personas</p>
              <p className="font-semibold text-amber-600">
                ${hab.precio_noche?.toLocaleString('es-ES')} / noche
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(hab)}
                className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(hab.id)}
                className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editando ? 'Editar Habitación' : 'Nueva Habitación'}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número</label>
                  <input type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                  <input type="text" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Precio por Noche</label>
                  <input type="number" value={formData.precio_noche} onChange={(e) => setFormData({ ...formData, precio_noche: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Capacidad</label>
                  <input type="number" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                    <option value="disponible">Disponible</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amenidades (separadas por coma)</label>
                <input type="text" value={formData.amenidades} onChange={(e) => setFormData({ ...formData, amenidades: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="WiFi, TV, Aire acondicionado" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                  <Save className="h-5 w-5" />
                  Guardar
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------
// ESTADÍSTICAS (CON GRÁFICOS)
// -----------------------------------------------------------
const Estadisticas = ({ 
  habitaciones, 
  reservas 
}: { 
  habitaciones: Habitacion[]
  reservas: any[] 
}) => {

  const ingresosCompletadas = reservas
    .filter(r => r.estado === 'completada')
    .reduce((sum, r) => sum + r.total, 0)

  const reservasActivas = reservas.filter(r => r.estado === 'activa').length
  const totalHabitaciones = habitaciones.length
  const habitacionesDisponibles = habitaciones.filter(h => h.estado === 'disponible').length

  const getIngresosPorMes = () => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const ingresos = reservas
      .filter(r => r.estado === 'completada')
      .reduce((acc, r) => {
        const mes = new Date(r.fecha_reserva).getMonth();
        const nombreMes = meses[mes];
        acc[nombreMes] = (acc[nombreMes] || 0) + r.total;
        return acc;
      }, {} as Record<string, number>);

    return meses.map(mes => ({
      name: mes,
      Ingresos: ingresos[mes] || 0,
    }));
  };
  const dataIngresos = getIngresosPorMes();

  const getReservasPorTipo = () => {
    const tipos = reservas.reduce((acc, r) => {
      const habitacion = habitaciones.find(h => h.id === r.habitacion_id);
      if (habitacion) {
        const tipo = habitacion.tipo;
        acc[tipo] = (acc[tipo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tipos).map(([name, value]) => ({ name, value }));
  };
  const dataTipos = getReservasPorTipo();
  const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F'];

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Total Habitaciones</p>
            <Home className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalHabitaciones}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Disponibles</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{habitacionesDisponibles}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-amber-700">Reservas Activas</p>
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900">{reservasActivas}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700">Ingresos (Completados)</p>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${ingresosCompletadas.toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ingresos por Mes (Completados)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dataIngresos} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-ES')}`} />
                <Legend />
                <Line type="monotone" dataKey="Ingresos" stroke="#FF8042" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Popularidad de Habitaciones</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dataTipos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataTipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} reservas`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------
// ¡NUEVO COMPONENTE! MODAL PARA EDITAR RESERVAS
// -----------------------------------------------------------
const ModalEditarReserva = ({
  reserva,
  habitaciones,
  clientes,
  onClose,
  onSave
}: {
  reserva: any
  habitaciones: Habitacion[]
  clientes: Usuario[]
  onClose: () => void
  onSave: () => void
}) => {
  const [formData, setFormData] = useState({
    habitacion_id: reserva.habitacion_id,
    fecha_entrada: reserva.fecha_entrada,
    fecha_salida: reserva.fecha_salida,
    num_huespedes: reserva.num_huespedes
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nuevoTotal, setNuevoTotal] = useState(reserva.total);
  const [diferencia, setDiferencia] = useState(0);

  // ¡NUEVO! Buscar el cliente para el título
  const clienteInfo = clientes.find(c => c.id === reserva.usuario_id);
  const tituloModal = clienteInfo 
    ? `Editar Reserva de ${clienteInfo.nombre}` 
    : `Editar Reserva #${reserva.id.slice(0, 8)}`;


  // Recalcular el total cada vez que cambien los datos del formulario
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
        } else {
          setNuevoTotal(0);
          setDiferencia(0 - reserva.total);
        }
      }
    } catch (e) {
      console.error("Error calculando total", e);
      setNuevoTotal(0);
    }
  }, [formData, habitaciones, reserva.total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Validar Datos
      const habInfo = habitaciones.find(h => h.id === formData.habitacion_id);
      if (!habInfo) throw new Error("Habitación no encontrada");

      if (formData.num_huespedes > habInfo.capacidad) {
        throw new Error(`La capacidad máxima de esta habitación es ${habInfo.capacidad}`);
      }
      
      const entrada = new Date(formData.fecha_entrada);
      const salida = new Date(formData.fecha_salida);
      if (salida <= entrada) {
        throw new Error("La fecha de salida debe ser posterior a la de entrada");
      }

      // 2. Validar Disponibilidad (¡IMPORTANTE!)
      const fechasCambiaron = formData.fecha_entrada !== reserva.fecha_entrada || formData.fecha_salida !== reserva.fecha_salida;
      const habitacionCambio = formData.habitacion_id !== reserva.habitacion_id;

      if (fechasCambiaron || habitacionCambio) {
        const { data, error: funcError } = await supabase.functions.invoke('check-room-availability', {
          body: {
            habitacion_id: formData.habitacion_id,
            fecha_entrada: formData.fecha_entrada,
            fecha_salida: formData.fecha_salida,
            reserva_id_excluir: reserva.id 
          }
        });
        
        if (funcError) {
          const errorData = await funcError.context.json();
          throw new Error(errorData.error.message || "Error al verificar disponibilidad");
        }
        
        const responseData = data?.data || data;
        if (!responseData?.available) {
          throw new Error('La habitación no está disponible para las nuevas fechas seleccionadas');
        }
      }

      // 3. Guardar en BDD
      await supabase
        .from('reservas')
        .update({
          ...formData,
          total: nuevoTotal,
          num_huespedes: Number(formData.num_huespedes)
        })
        .eq('id', reserva.id);

      onSave(); // Llama a onRecargar y cierra el modal
      
    } catch (err: any) {
      setError(err.message || "Error al actualizar la reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {tituloModal}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Habitación y Huéspedes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Habitación
              </label>
              <select
                name="habitacion_id"
                value={formData.habitacion_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {habitaciones.map(h => (
                  <option key={h.id} value={h.id}>
                    N° {h.numero} - {h.tipo} (${h.precio_noche}/noche)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                N° Huéspedes
              </label>
              <input
                type="number"
                name="num_huespedes"
                value={formData.num_huespedes}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
          </div>
          
          {/* Fila 2: Fechas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Entrada
              </label>
              <input
                type="date"
                name="fecha_entrada"
                value={new Date(formData.fecha_entrada).toISOString().split('T')[0]}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Salida
              </label>
              <input
                type="date"
                name="fecha_salida"
                value={new Date(formData.fecha_salida).toISOString().split('T')[0]}
                onChange={handleChange}
                min={new Date(formData.fecha_entrada).toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Fila 3: Cálculo de Precios */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Original:</span>
              <span className="font-medium text-slate-700">${reserva.total.toLocaleString('es-ES')}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-slate-700">Nuevo Total:</span>
              <span className="font-bold text-amber-600">${nuevoTotal.toLocaleString('es-ES')}</span>
            </div>
            <div className={`flex justify-between text-lg font-bold p-2 rounded-lg ${
              diferencia > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              <span>
                {diferencia > 0 ? 'Diferencia a Pagar:' : 'Diferencia a Favor:'}
              </span>
              <span>
                ${Math.abs(diferencia).toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {/* Fila 4: Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- Reemplaza el componente 'GestionOperadores' existente por este ---

const GestionOperadores = ({ 
  operadores, 
  onRecargar 
}: { 
  operadores: Usuario[]
  onRecargar: () => void 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  // --- NUEVO: Estado para el modal de EDICIÓN ---
  const [showEditModal, setShowEditModal] = useState(false)
  const [operadorAEditar, setOperadorAEditar] = useState<Usuario | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: ''
  })
  const [errores, setErrores] = useState<{ nombre?: string, general?: string }>({});

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (soloLetras.test(valor)) {
      setFormData({ ...formData, nombre: valor });
      setErrores({ ...errores, nombre: "" });
    } else {
      setErrores({ ...errores, nombre: "Solo se permiten letras y espacios." });
    }
  };

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({}); 

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          rol: 'operador'
        },
      });
      
      if (error) {
        const errorData = await error.context.json();
        throw new Error(errorData.error.message);
      }
      
      setFormData({ email: '', nombre: '', password: '' })
      setShowCreateModal(false)
      onRecargar()
      
    } catch (err: any) {
      console.error('Error creando operador:', err)
      setErrores({ ...errores, general: err.message || "Error desconocido" });
    }
  }
  
  // --- NUEVO: Manejador para abrir el modal de edición ---
  const handleEditarClick = (operador: Usuario) => {
    setOperadorAEditar(operador);
    setShowEditModal(true);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este operador?')) return
    try {
      await supabase.from('usuarios').delete().eq('id', id)
      onRecargar()
    } catch (error) {
      console.error('Error eliminando operador:', error)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => {
            setErrores({}); 
            setShowCreateModal(true);
          }}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Nuevo Operador
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operadores.map((op) => (
          <div key={op.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="mb-4">
              <h3 className="font-bold text-lg">{op.nombre}</h3>
              <p className="text-sm text-slate-600">{op.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Creado: {new Date(op.fecha_creacion || '').toLocaleDateString('es-ES')}
              </p>
            </div>
            {/* --- CAMBIO: Dos botones (Editar y Eliminar) --- */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditarClick(op)}
                className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(op.id)}
                className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para CREAR Operador */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Nuevo Operador</h2>
            <form onSubmit={handleCrearSubmit} className="space-y-4">
              {errores.general && (
                <p className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{errores.general}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                <input type="text" value={formData.nombre} onChange={handleNombreChange} className={`w-full px-4 py-2 border ${errores.nombre ? "border-red-400" : "border-slate-300"} rounded-lg focus:ring-2 focus:ring-amber-500 outline-none`} placeholder="Ingrese nombre" required />
                {errores.nombre && (<p className="text-red-600 text-sm mt-1">{errores.nombre}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required minLength={6} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">
                  Crear
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- ¡NUEVO MODAL PARA EDITAR OPERADOR! --- */}
      {showEditModal && operadorAEditar && (
        <ModalEditarOperador 
          operador={operadorAEditar}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            onRecargar();
          }}
        />
      )}
    </div>
  )
}

// -----------------------------------------------------------
// ¡NUEVO COMPONENTE! MODAL PARA EDITAR OPERADOR
// -----------------------------------------------------------
const ModalEditarOperador = ({
  operador,
  onClose,
  onSave
}: {
  operador: Usuario
  onClose: () => void
  onSave: () => void
}) => {
  const { user: adminUser } = useAuth(); // ¡El admin que está logueado!
  
  const [formData, setFormData] = useState({
    nombre: operador.nombre,
    email: operador.email,
    rol: operador.rol
  });
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState(''); // La contraseña del admin para confirmar
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!adminPassword) {
      setError('Debes ingresar tu contraseña de administrador para confirmar los cambios.');
      setLoading(false);
      return;
    }

    try {
      // 1. Llamamos a la nueva Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('admin-update-user', {
        body: { 
          admin_id: adminUser?.id,
          admin_password: adminPassword,
          target_user_id: operador.id,
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          nueva_password: nuevaPassword || undefined // Solo la envía si no está vacía
        },
      });

      if (funcError) {
        const errorData = await funcError.context.json();
        throw new Error(errorData.error.message);
      }
      
      onSave(); // Cierra el modal y recarga

    } catch (err: any) {
      setError(err.message || 'Error desconocido al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Editar Operador</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos del Operador */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              required 
            />
          </div>
          
          {/* Sección de Cambio de Rol */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-800 mb-2">Cambiar Rol</h3>
            <select 
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="operador">Operador</option>
              <option value="administrador">Administrador</option>
            </select>
            {formData.rol === 'administrador' && (
              <p className="text-xs text-red-600 mt-2">
                ¡Atención! Estás a punto de ascender este usuario a Administrador.
              </p>
            )}
          </div>

          {/* Sección de Cambio de Contraseña */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-800 mb-2">Cambiar Contraseña (Opcional)</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="Dejar en blanco para no cambiar"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              minLength={6}
            />
          </div>
          
          {/* Sección de Confirmación de Admin */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
            <h3 className="font-bold text-amber-800 mb-2">Confirmar Cambios</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ingresá TU contraseña de Admin
            </label>
            <input 
              type="password" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}