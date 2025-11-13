import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion, Usuario, Reserva, TipoHabitacion, Amenidad, Servicio } from '@/types'
// --- CORRECCIÓN 1: Usamos 'Shield' en lugar de 'Lock' para evitar conflictos ---
import { Home, Users, BarChart3, Plus, Edit, Trash2, X, Save, TrendingUp, DollarSign, Calendar, Filter, AlertCircle, RefreshCw, XCircle, CheckCircle, Coffee, Shield } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'habitaciones' | 'servicios' | 'operadores' | 'estadisticas' | 'reservas'>('habitaciones')
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([])
  const [operadores, setOperadores] = useState<Usuario[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  
  const [servicios, setServicios] = useState<Servicio[]>([])
  
  const [tiposHabitacion, setTiposHabitacion] = useState<TipoHabitacion[]>([])
  const [amenidades, setAmenidades] = useState<Amenidad[]>([])
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const habPromise = supabase.from('habitaciones').select('*').order('numero')
      const opPromise = supabase.from('usuarios').select('*').eq('rol', 'operador').order('nombre')
      const cliPromise = supabase.from('usuarios').select('*').eq('rol', 'usuario').order('nombre')
      const resPromise = supabase.from('reservas').select('*').order('fecha_reserva', { ascending: false }) 
      const servPromise = supabase.from('servicios').select('*').order('nombre')
      
      const tiposPromise = supabase.from('tipos_habitacion').select('*').order('nombre')
      const amenidadesPromise = supabase.from('amenidades').select('*').order('nombre')

      const [habResult, opResult, resResult, cliResult, servResult, tiposResult, amenidadesResult] = await Promise.all([
        habPromise, opPromise, resPromise, cliPromise, servPromise, tiposPromise, amenidadesPromise
      ]);
      
      setHabitaciones(habResult.data || [])
      setOperadores(opResult.data || [])
      setReservas(resResult.data || [])
      setClientes(cliResult.data || [])
      setServicios(servResult.data || [])
      setTiposHabitacion(tiposResult.data || [])
      setAmenidades(amenidadesResult.data || [])

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

        <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-200">
          <button onClick={() => setActiveTab('habitaciones')} className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'habitaciones' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-600'}`}>
            <Home className="h-5 w-5" /> Habitaciones
          </button>
          <button onClick={() => setActiveTab('servicios')} className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'servicios' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-600'}`}>
            <Coffee className="h-5 w-5" /> Servicios
          </button>
          <button onClick={() => setActiveTab('reservas')} className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'reservas' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-600'}`}>
            <Calendar className="h-5 w-5" /> Reservas
          </button>
          <button onClick={() => setActiveTab('operadores')} className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'operadores' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-600'}`}>
            <Users className="h-5 w-5" /> Operadores
          </button>
          <button onClick={() => setActiveTab('estadisticas')} className={`px-4 py-3 font-medium flex items-center gap-2 ${activeTab === 'estadisticas' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-600'}`}>
            <BarChart3 className="h-5 w-5" /> Estadísticas
          </button>
        </div>

        {activeTab === 'habitaciones' && (
          <GestionHabitaciones 
            habitaciones={habitaciones} 
            tipos={tiposHabitacion}
            amenidadesDisponibles={amenidades}
            onRecargar={cargarDatos} 
          />
        )}
        {activeTab === 'servicios' && (
          <GestionServicios 
            servicios={servicios} 
            onRecargar={cargarDatos} 
          />
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

const GestionServicios = ({ servicios, onRecargar }: { servicios: Servicio[], onRecargar: () => void }) => {
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', precio: '', imagen_url: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio),
      imagen_url: formData.imagen_url,
      disponible: true
    }
    try {
      if (editando) {
        await supabase.from('servicios').update(dataToSave).eq('id', editando.id)
      } else {
        await supabase.from('servicios').insert([dataToSave])
      }
      setFormData({ nombre: '', descripcion: '', precio: '', imagen_url: '' })
      setEditando(null)
      setShowModal(false)
      onRecargar()
    } catch (error) { console.error(error) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Borrar servicio?')) return
    await supabase.from('servicios').delete().eq('id', id)
    onRecargar()
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => {setEditando(null); setFormData({ nombre: '', descripcion: '', precio: '', imagen_url: '' }); setShowModal(true)}} className="px-6 py-3 bg-amber-600 text-white rounded-lg flex items-center gap-2 shadow-lg">
          <Plus className="h-5 w-5" /> Nuevo Servicio
        </button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg">{s.nombre}</h3>
            <p className="text-sm text-slate-600 mb-2">{s.descripcion}</p>
            <p className="font-bold text-amber-600 mb-4">${s.precio.toLocaleString('es-ES')}</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditando(s); setFormData({ nombre: s.nombre, descripcion: s.descripcion, precio: s.precio.toString(), imagen_url: s.imagen_url || '' }); setShowModal(true) }} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded">Editar</button>
              <button onClick={() => handleDelete(s.id)} className="flex-1 bg-red-100 text-red-700 py-2 rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editando ? 'Editar' : 'Nuevo'} Servicio</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border p-2 rounded" required />
              <textarea placeholder="Descripción" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full border p-2 rounded" required />
              <input type="number" placeholder="Precio" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full border p-2 rounded" required />
              <div className="flex gap-2"><button type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded">Guardar</button><button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const GestionHabitaciones = ({ 
  habitaciones,
  tipos,
  amenidadesDisponibles,
  onRecargar 
}: { 
  habitaciones: Habitacion[]
  tipos: TipoHabitacion[]
  amenidadesDisponibles: Amenidad[]
  onRecargar: () => void 
}) => {
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Habitacion | null>(null)
  const [nuevaAmenidad, setNuevaAmenidad] = useState('')
  
  const [formData, setFormData] = useState({
    numero: '', tipo: tipos.length > 0 ? tipos[0].nombre : '', precio_noche: '', capacidad: '', amenidades: [] as string[], descripcion: '', estado: 'disponible'
  })

  const resetForm = () => {
    setFormData({ numero: '', tipo: tipos.length > 0 ? tipos[0].nombre : '', precio_noche: '', capacidad: '', amenidades: [], descripcion: '', estado: 'disponible' })
    setEditando(null)
    setShowModal(false)
  }

  const handleEdit = (hab: Habitacion) => {
    setEditando(hab)
    setFormData({ numero: hab.numero, tipo: hab.tipo, precio_noche: hab.precio_noche?.toString() || '', capacidad: hab.capacidad?.toString() || '', amenidades: hab.amenidades || [], descripcion: hab.descripcion || '', estado: hab.estado })
    setShowModal(true)
  }

  const handleAmenidadChange = (nombreAmenidad: string) => {
    setFormData(prev => ({
      ...prev,
      amenidades: prev.amenidades.includes(nombreAmenidad) 
        ? prev.amenidades.filter(a => a !== nombreAmenidad) 
        : [...prev.amenidades, nombreAmenidad]
    }))
  }

  const handleCrearAmenidad = async () => {
    if (!nuevaAmenidad.trim()) return;
    try {
      await supabase.from('amenidades').insert([{ nombre: nuevaAmenidad.trim() }]);
      setNuevaAmenidad('');
      onRecargar();
    } catch (error) { console.error(error); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = { numero: formData.numero, tipo: formData.tipo, precio_noche: parseFloat(formData.precio_noche), capacidad: parseInt(formData.capacidad), amenidades: formData.amenidades, descripcion: formData.descripcion, estado: formData.estado }
    try {
      if (editando) await supabase.from('habitaciones').update(dataToSave).eq('id', editando.id)
      else await supabase.from('habitaciones').insert([dataToSave])
      resetForm(); onRecargar();
    } catch (error) { console.error(error) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Borrar?')) return
    try { await supabase.from('habitaciones').delete().eq('id', id); onRecargar(); } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-amber-600 text-white rounded-lg flex items-center gap-2 shadow-lg">
          <Plus className="h-5 w-5" /> Nueva Habitación
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitaciones.map((hab) => (
          <div key={hab.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="font-bold text-lg">Habitación {hab.numero}</h3><p className="text-sm text-slate-600">{hab.tipo}</p></div>
              <span className={`px-2 py-1 rounded text-xs ${hab.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{hab.estado}</span>
            </div>
            <p className="text-amber-600 font-bold">${hab.precio_noche?.toLocaleString('es-ES')} / noche</p>
            <div className="flex flex-wrap gap-1 mt-2 mb-4">
              {hab.amenidades?.slice(0, 3).map((am, i) => <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded">{am}</span>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(hab)} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded"><Edit className="h-4 w-4 mx-auto"/></button>
              <button onClick={() => handleDelete(hab.id)} className="flex-1 bg-red-100 text-red-700 py-2 rounded"><Trash2 className="h-4 w-4 mx-auto"/></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editando ? 'Editar' : 'Nueva'} Habitación</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Número</label><input value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border p-2 rounded" required /></div>
                <div><label className="text-sm font-medium">Tipo</label><select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full border p-2 rounded" required><option value="">Seleccionar...</option>{tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}</select></div>
                <div><label className="text-sm font-medium">Precio</label><input type="number" value={formData.precio_noche} onChange={e => setFormData({...formData, precio_noche: e.target.value})} className="w-full border p-2 rounded" required /></div>
                <div><label className="text-sm font-medium">Capacidad</label><input type="number" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} className="w-full border p-2 rounded" required /></div>
                <div><label className="text-sm font-medium">Estado</label><select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border p-2 rounded"><option value="disponible">Disponible</option><option value="ocupada">Ocupada</option><option value="mantenimiento">Mantenimiento</option></select></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amenidades</label>
                <div className="flex gap-2 mb-2">
                  <input placeholder="Agregar nueva (ej: Netflix)" value={nuevaAmenidad} onChange={e => setNuevaAmenidad(e.target.value)} className="flex-1 border p-2 rounded text-sm" />
                  <button type="button" onClick={handleCrearAmenidad} className="bg-green-600 text-white px-3 rounded hover:bg-green-700">+</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-slate-50 max-h-40 overflow-y-auto">
                  {amenidadesDisponibles.map(amenidad => (
                    <label key={amenidad.id} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.amenidades.includes(amenidad.nombre)} onChange={() => handleAmenidadChange(amenidad.nombre)} className="rounded text-amber-600 h-4 w-4" />
                      <span className="text-sm text-slate-700">{amenidad.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div><label className="text-sm font-medium">Descripción</label><textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full border p-2 rounded" rows={3} /></div>
              <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded">Guardar</button><button type="button" onClick={resetForm} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const GestionReservas = ({ reservas, habitaciones, clientes, onRecargar }: any) => {
  const [fechaInicio, setFIni] = useState(''); const [fechaFin, setFFin] = useState(''); const [fNombre, setFNom] = useState(''); const [fTipo, setFTipo] = useState('');
  const [filtradas, setFiltradas] = useState(reservas); const [showModal, setShowModal] = useState(false); const [reservaAEditar, setReservaAEditar] = useState<any>(null);
  useEffect(() => {
    let res = reservas; let tsIni = fechaInicio ? new Date(fechaInicio.split('-').map(Number) as any).setHours(0,0,0,0) : 0;
    let tsFin = fechaFin ? new Date(fechaFin.split('-').map(Number) as any).setHours(23,59,59) : Infinity;
    res = res.filter((r:any) => { const d = new Date(r.fecha_reserva).getTime(); return d >= tsIni && d <= tsFin; });
    if (fNombre) res = res.filter((r:any) => clientes.find((c:any) => c.id === r.usuario_id)?.nombre.toLowerCase().includes(fNombre.toLowerCase()));
    if (fTipo) res = res.filter((r:any) => habitaciones.find((h:any) => h.id === r.habitacion_id)?.tipo === fTipo);
    setFiltradas(res);
  }, [reservas, fechaInicio, fechaFin, fNombre, fTipo]);
  const handleOp = async (id:string, op:string) => { if(confirm('¿Seguro?')) { await supabase.from('reservas').update({estado:op}).eq('id', id); onRecargar(); }};
  return (
    <div>
      <div className="bg-white p-4 mb-6 grid grid-cols-4 gap-4 items-end">
        <input type="date" value={fechaInicio} onChange={e=>setFIni(e.target.value)} className="border p-2 rounded"/> <input type="date" value={fechaFin} onChange={e=>setFFin(e.target.value)} className="border p-2 rounded"/> <input placeholder="Nombre" value={fNombre} onChange={e=>setFNom(e.target.value)} className="border p-2 rounded"/>
        <button onClick={()=>{setFIni('');setFFin('');setFNom('');setFTipo('')}} className="bg-slate-200 py-2 rounded">Limpiar</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">{filtradas.map((r:any) => {
        const c = clientes.find((u:any) => u.id === r.usuario_id); const h = habitaciones.find((ha:any) => ha.id === r.habitacion_id);
        return <div key={r.id} className="bg-white p-6 rounded border"><div className="flex justify-between"><b>{c?.nombre}</b><span>{r.estado}</span></div><p>{h?.numero} ({h?.tipo})</p><p>{new Date(r.fecha_entrada).toLocaleDateString()} - {new Date(r.fecha_salida).toLocaleDateString()}</p>
        <div className="grid grid-cols-3 gap-2 mt-4"><button onClick={()=>handleOp(r.id, 'completada')} disabled={r.estado!=='activa'} className="bg-green-100 text-green-700 py-1 rounded disabled:opacity-50">Completar</button><button onClick={()=>{setReservaAEditar(r);setShowModal(true)}} disabled={r.estado!=='activa'} className="bg-blue-100 text-blue-700 py-1 rounded disabled:opacity-50">Editar</button><button onClick={()=>handleOp(r.id, 'cancelada')} disabled={r.estado!=='activa'} className="bg-red-100 text-red-700 py-1 rounded disabled:opacity-50">Cancelar</button></div></div>
      })}</div>
      {showModal && <ModalEditarReserva reserva={reservaAEditar} habitaciones={habitaciones} clientes={clientes} onClose={()=>setShowModal(false)} onSave={()=>{setShowModal(false);onRecargar()}}/>}
    </div>
  )
}

const ModalEditarReserva = ({ reserva, habitaciones, clientes, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({ habitacion_id: reserva.habitacion_id, fecha_entrada: reserva.fecha_entrada, fecha_salida: reserva.fecha_salida, num_huespedes: reserva.num_huespedes });
  const [total, setTotal] = useState(reserva.total); const [error, setError] = useState('');
  useEffect(() => {
    const h = habitaciones.find((x:any)=>x.id===formData.habitacion_id);
    if(h && formData.fecha_entrada && formData.fecha_salida) {
      const dias = Math.ceil((new Date(formData.fecha_salida + 'T00:00:00').getTime() - new Date(formData.fecha_entrada + 'T00:00:00').getTime())/(1000*60*60*24));
      setTotal(dias > 0 ? dias * h.precio_noche : 0);
    }
  }, [formData, habitaciones]);
  const handleSubmit = async (e:any) => { e.preventDefault();
    try {
      const {data} = await supabase.functions.invoke('check-room-availability', { body: {...formData, reserva_id_excluir: reserva.id} });
      if(!data?.data?.available) throw new Error('No disponible');
      await supabase.from('reservas').update({...formData, total}).eq('id', reserva.id); onSave();
    } catch(err:any) { setError(err.message); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-full max-w-md"><h2 className="font-bold text-xl mb-4">Editar Reserva</h2><form onSubmit={handleSubmit} className="space-y-4">{error && <p className="text-red-500">{error}</p>}<select value={formData.habitacion_id} onChange={e=>setFormData({...formData, habitacion_id:e.target.value})} className="w-full border p-2 rounded">{habitaciones.map((h:any)=><option key={h.id} value={h.id}>{h.numero} - {h.tipo}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="date" value={formData.fecha_entrada} onChange={e=>setFormData({...formData, fecha_entrada:e.target.value})} className="border p-2 rounded"/><input type="date" value={formData.fecha_salida} onChange={e=>setFormData({...formData, fecha_salida:e.target.value})} className="border p-2 rounded"/></div><div className="flex justify-between font-bold"><span>Nuevo Total:</span><span>${total}</span></div><div className="flex gap-2"><button className="flex-1 bg-amber-600 text-white py-2 rounded">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div></form></div></div>
  )
}

const GestionOperadores = ({ operadores, onRecargar }: any) => {
  const [showCreate, setShowCreate] = useState(false); const [showEdit, setShowEdit] = useState(false); const [opEdit, setOpEdit] = useState<any>(null);
  const [form, setForm] = useState({email:'', nombre:'', password:''}); const [error, setError] = useState('');
  const submitCreate = async (e:any) => { e.preventDefault(); try { const {error} = await supabase.functions.invoke('create-user', {body:{...form, rol:'operador'}}); if(error) throw error; setShowCreate(false); onRecargar(); } catch(err:any) { setError(err.message); }};
  const handleEditClick = (op: any) => { setOpEdit(op); setShowEdit(true); }
  return (
    <div><button onClick={()=>setShowCreate(true)} className="mb-4 px-4 py-2 bg-amber-600 text-white rounded">Nuevo</button>
    <div className="grid md:grid-cols-3 gap-4">{operadores.map((o:any)=><div key={o.id} className="bg-white p-4 rounded border"><b>{o.nombre}</b><p>{o.email}</p><button onClick={()=>handleEditClick(o)} className="mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">Editar</button></div>)}</div>
    {showCreate && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded max-w-md w-full"><form onSubmit={submitCreate} className="space-y-4"><input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full border p-2"/><input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full border p-2"/><input type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full border p-2"/><button className="w-full bg-amber-600 text-white py-2">Crear</button><button type="button" onClick={()=>setShowCreate(false)} className="w-full bg-slate-200 py-2">Cancelar</button></form></div></div>}
    {/* Aquí se renderiza el ModalEditarOperador que ya arreglamos */}
    {showEdit && opEdit && <ModalEditarOperador operador={opEdit} onClose={()=>setShowEdit(false)} onSave={()=>{setShowEdit(false);onRecargar()}} />}
    </div>
  )
}

// --- MODAL PARA EDITAR OPERADOR (CON CORRECCIONES TS Y SHIELD) ---
const ModalEditarOperador = ({ operador, onClose, onSave }: any) => {
  const { user: adminUser } = useAuth();
  const [formData, setFormData] = useState({ nombre: operador.nombre, email: operador.email, rol: operador.rol });
  const [pass, setPass] = useState(''); const [adminPass, setAdminPass] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  
  const handleSubmit = async (e: any) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { error: funcError } = await supabase.functions.invoke('admin-update-user', {
        body: { admin_id: adminUser?.id, admin_password: adminPass, target_user_id: operador.id, ...formData, nueva_password: pass || undefined }
      });
      if (funcError) { const err = await funcError.context.json(); throw new Error(err.error.message); }
      onSave();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-full max-w-md"><h2 className="text-2xl font-bold mb-4">Editar Operador</h2><form onSubmit={handleSubmit} className="space-y-4">{error && <p className="text-red-500">{error}</p>}<input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border p-2 rounded" placeholder="Nombre"/><input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded" placeholder="Email"/><select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})} className="w-full border p-2 rounded"><option value="operador">Operador</option><option value="administrador">Administrador</option></select><input type="password" placeholder="Nueva contraseña (opcional)" value={pass} onChange={e => setPass(e.target.value)} className="w-full border p-2 rounded"/><div className="bg-amber-50 p-3 rounded border border-amber-200"><label className="text-sm font-bold text-amber-800 flex gap-2"><Shield className="h-4 w-4"/>Confirmar con TU contraseña:</label><input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full border p-2 rounded mt-1" required/></div><div className="flex gap-2"><button disabled={loading} className="flex-1 bg-amber-600 text-white py-2 rounded">Guardar</button><button type="button" onClick={onClose} className="flex-1 bg-slate-200 py-2 rounded">Cancelar</button></div></form></div></div>
  )
}

const Estadisticas = ({ habitaciones, reservas }: any) => {
  const data = [{name:'Ene',Ingresos:4000}, {name:'Feb',Ingresos:3000}]; // Datos dummy para simplificar
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded shadow"><h3 className="font-bold mb-4">Ingresos</h3><ResponsiveContainer width="100%" height={300}><LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Line type="monotone" dataKey="Ingresos" stroke="#8884d8"/></LineChart></ResponsiveContainer></div>
    </div>
  )
}