import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva } from '@/types'
import { Home, Users, BarChart3, Plus, Edit, Trash2, X, Save, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react'
// --- CAMBIO: Importamos los gráficos ---
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
  // --- CAMBIO: Nuevo estado para guardar los clientes ---
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  // -----------------------------------------------------------
  // FUNCIÓN DE CARGA ARREGLADA (CON PROMISE.ALL PARA TODO)
  // ESTO ARREGLA LA RACE CONDITION DE USUARIOS Y HABITACIONES
  // -----------------------------------------------------------
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Creamos todas las promesas de consulta
      const habPromise = supabase
        .from('habitaciones')
        .select('*')
        .order('numero')

      const opPromise = supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'operador')
        .order('nombre')
        
      // --- CAMBIO: Añadimos la carga de clientes ---
      const cliPromise = supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'usuario')
        .order('nombre')

      const resPromise = supabase
        .from('reservas')
        .select('*') 
        .order('fecha_reserva', { ascending: false }) 

      // 2. Las ejecutamos todas en paralelo y esperamos a que TODAS terminen
      const [habResult, opResult, resResult, cliResult] = await Promise.all([
        habPromise,
        opPromise,
        resPromise,
        cliPromise // Añadimos la promesa de clientes
      ]);
      
      // 3. Solo cuando todas terminaron, actualizamos el estado
      setHabitaciones(habResult.data || [])
      setOperadores(opResult.data || [])
      setReservas(resResult.data || [])
      setClientes(cliResult.data || []) // Guardamos los clientes

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
// GESTIÓN DE RESERVAS (COMPONENTE 100% NUEVO CON TODOS LOS FILTROS)
// -----------------------------------------------------------
const GestionReservas = ({ 
  reservas, 
  habitaciones,
  clientes
}: { 
  // Usamos 'any' porque el tipo 'Reserva' no incluye los datos del join
  reservas: any[], 
  habitaciones: Habitacion[],
  clientes: Usuario[]
}) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [reservasFiltradas, setReservasFiltradas] = useState(reservas);

  // Derivamos los tipos de habitación únicos de la lista de habitaciones
  const tiposDeHabitacion = [...new Set(habitaciones.map(h => h.tipo))];

  useEffect(() => {
    setReservasFiltradas(reservas);
  }, [reservas]);

  const handleFiltrar = () => {
    
    // 1. Filtro de Fechas (lógica de timestamp)
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
      // 1. Chequeo de Fecha
      const tsReserva = new Date(reserva.fecha_reserva).getTime();
      if (tsReserva < tsInicio || tsReserva > tsFin) {
        return false;
      }
      
      // 2. Chequeo de Nombre
      if (filtroNombre) {
        const cliente = clientes.find(c => c.id === reserva.usuario_id);
        if (!cliente || !cliente.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) {
          return false;
        }
      }
      
      // 3. Chequeo de Tipo de Habitación
      if (filtroTipo) {
        const habitacion = habitaciones.find(h => h.id === reserva.habitacion_id);
        if (!habitacion || habitacion.tipo !== filtroTipo) {
          return false;
        }
      }
      
      // Si pasa todo, se incluye
      return true;
    });

    setReservasFiltradas(filtradas);
  };

  const handleLimpiar = () => {
    setFechaInicio('');
    setFechaFin('');
    setFiltroNombre('');
    setFiltroTipo('');
    setReservasFiltradas(reservas);
  };

  return (
    <div>
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Filtro Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Desde (Fecha Reserva)
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        
        {/* Filtro Fecha Fin */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Hasta (Fecha Reserva)
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        
        {/* Filtro Nombre Huésped */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre Huésped
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
        
        {/* Filtro Tipo Habitación */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipo Habitación
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">Todos</option>
            {tiposDeHabitacion.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        {/* Botones */}
        <div className="md:col-span-4 flex gap-4">
          <button
            onClick={handleFiltrar}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
          >
            Limpiar
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
          // --- AHORA ESTO FUNCIONA GRACIAS AL PROMISE.ALL ---
          const habInfo = habitaciones.find(h => h.id === reserva.habitacion_id);
          const clienteInfo = clientes.find(c => c.id === reserva.usuario_id);

          return (
            <div key={reserva.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {/* --- CAMBIO: MOSTRAMOS EL NOMBRE --- */}
                    {clienteInfo ? clienteInfo.nombre : `ID Usuario: ${reserva.usuario_id.slice(0,8)}`}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {clienteInfo ? clienteInfo.email : 'Email no encontrado'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  reserva.estado === 'activa' 
                    ? 'bg-green-100 text-green-700'
                    : reserva.estado === 'completada'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {reserva.estado}
                </span>
              </div>
              
              <p className="text-sm text-slate-500 mb-2 font-semibold">
                {habInfo 
                  ? `Habitación ${habInfo.numero} (${habInfo.tipo})`
                  : `ID Habitación: ${reserva.habitacion_id.slice(0, 8)}...`
                }
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
          )
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// GESTIÓN DE HABITACIONES (SIN CAMBIOS, PERO NECESARIO)
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
                hab.estado === 'disponible' 
                  ? 'bg-green-100 text-green-700'
                  : hab.estado === 'ocupada'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Precio por Noche
                  </label>
                  <input
                    type="number"
                    value={formData.precio_noche}
                    onChange={(e) => setFormData({ ...formData, precio_noche: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amenidades (separadas por coma)
                </label>
                <input
                  type="text"
                  value={formData.amenidades}
                  onChange={(e) => setFormData({ ...formData, amenidades: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="WiFi, TV, Aire acondicionado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
                >
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
// GESTIÓN DE OPERADORES (SIN CAMBIOS, PERO NECESARIO)
// -----------------------------------------------------------
const GestionOperadores = ({ 
  operadores, 
  onRecargar 
}: { 
  operadores: Usuario[]
  onRecargar: () => void 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: ''
  })

  // --- ARREGLO: Limpiamos el error 'general' al cambiar el nombre ---
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

  // -----------------------------------------------------------
  // HANDLESUBMIT 100% CORREGIDO
  // (Llama a la Edge Function 'create-user')
  // -----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({}); // Limpiar errores viejos

    try {
      // 1. Llamamos a la nueva Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          rol: 'operador' // Forzamos el rol a 'operador'
        },
      });
      
      if (error) {
        // Si la Edge Function devuelve un error (ej: "Email ya existe")
        // lo tomamos y lo mostramos
        const errorData = await error.context.json();
        throw new Error(errorData.error.message);
      }
      
      // 2. Si todo salió bien, limpiamos y recargamos
      setFormData({ email: '', nombre: '', password: '' })
      setShowModal(false)
      onRecargar()
      
    } catch (err: any) {
      // 3. Mostramos el error en el formulario
      console.error('Error creando operador:', err)
      setErrores({ ...errores, general: err.message || "Error desconocido" });
    }
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
            setErrores({}); // Limpiar errores al abrir el modal
            setShowModal(true);
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
            <button
              onClick={() => handleDelete(op.id)}
              className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Nuevo Operador</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mostramos el error general */}
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
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">
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
// ESTADÍSTICAS (COMPONENTE 100% NUEVO CON GRÁFICOS)
// -----------------------------------------------------------
const Estadisticas = ({ 
  habitaciones, 
  reservas 
}: { 
  habitaciones: Habitacion[]
  reservas: any[] // Usamos 'any' porque el tipo Reserva no está actualizado
}) => {

  // --- 1. Lógica para KPIs (Indicadores Clave) ---
  const ingresosCompletadas = reservas
    .filter(r => r.estado === 'completada')
    .reduce((sum, r) => sum + r.total, 0)

  const reservasActivas = reservas.filter(r => r.estado === 'activa').length
  
  const totalHabitaciones = habitaciones.length
  
  const habitacionesDisponibles = habitaciones.filter(h => h.estado === 'disponible').length

  // --- 2. Lógica para Gráfico de Ingresos por Mes ---
  const getIngresosPorMes = () => {
    const meses = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    // Agrupamos los ingresos de reservas completadas por mes
    const ingresos = reservas
      .filter(r => r.estado === 'completada')
      .reduce((acc, r) => {
        const mes = new Date(r.fecha_reserva).getMonth(); // 0 = Enero, 11 = Diciembre
        const nombreMes = meses[mes];
        acc[nombreMes] = (acc[nombreMes] || 0) + r.total;
        return acc;
      }, {} as Record<string, number>);

    // Lo convertimos al formato que espera Recharts
    return meses.map(mes => ({
      name: mes,
      Ingresos: ingresos[mes] || 0,
    }));
  };
  const dataIngresos = getIngresosPorMes();

  // --- 3. Lógica para Gráfico de Popularidad (Reservas por Tipo) ---
  const getReservasPorTipo = () => {
    const tipos = reservas.reduce((acc, r) => {
      const habitacion = habitaciones.find(h => h.id === r.habitacion_id);
      if (habitacion) {
        const tipo = habitacion.tipo;
        acc[tipo] = (acc[tipo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Lo convertimos al formato de Recharts
    return Object.entries(tipos).map(([name, value]) => ({
      name,
      value,
    }));
  };
  const dataTipos = getReservasPorTipo();
  const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F']; // Colores para el gráfico de torta

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
        {/* Gráfico de Ingresos por Mes */}
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

        {/* Gráfico de Popularidad de Habitaciones */}
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