import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Habitacion } from '@/types'
import { Calendar, Users, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'

export const CrearReserva = () => {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [habitacion, setHabitacion] = useState<Habitacion | null>(null)
  const [fechaEntrada, setFechaEntrada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [numHuespedes, setNumHuespedes] = useState(1)
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'efectivo' | 'transferencia'>('tarjeta')
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    titular: '',
    expiracion: '',
    cvv: ''
  })
  const [paso, setPaso] = useState<'fechas' | 'pago' | 'confirmacion'>('fechas')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // Solo carga la habitación si tenemos el ID Y la autenticación está lista
    if (id && !authLoading) { 
      cargarHabitacion()
    }
  }, [id, authLoading]) // Añade authLoading a las dependencias

  useEffect(() => {
    calcularTotal()
  }, [fechaEntrada, fechaSalida, habitacion])

  const cargarHabitacion = async () => {
    try {
      const { data } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (data) {
        setHabitacion(data)
      }
    } catch (error) {
      console.error('Error cargando habitación:', error)
    }
  }

  const calcularTotal = () => {
    if (fechaEntrada && fechaSalida && habitacion?.precio_noche) {
      const entrada = new Date(fechaEntrada)
      const salida = new Date(fechaSalida)
      const noches = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24))
      if (noches > 0) {
        setTotal(noches * habitacion.precio_noche)
      }
    }
  }

  const validarDisponibilidad = async () => {
    setError('')
    setLoading(true)

    try {
      // Validar fechas
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const entrada = new Date(fechaEntrada)
      const salida = new Date(fechaSalida)

      if (entrada < hoy) {
        throw new Error('La fecha de entrada no puede ser anterior a hoy')
      }

      if (salida <= entrada) {
        throw new Error('La fecha de salida debe ser posterior a la fecha de entrada')
      }

      if (numHuespedes < 1 || numHuespedes > (habitacion?.capacidad || 1)) {
        throw new Error(`El número de huéspedes debe estar entre 1 y ${habitacion?.capacidad}`)
      }

      // Verificar disponibilidad
      const { data } = await supabase.functions.invoke('check-room-availability', {
        body: {
          habitacion_id: id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida
        }
      })

      const responseData = data?.data || data

      if (!responseData?.available) {
        throw new Error('La habitación no está disponible para estas fechas')
      }

      setPaso('pago')
    } catch (err: any) {
      setError(err.message || 'Error al verificar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const procesarReserva = async () => {
    setError('')
    setLoading(true)

    try {
      // Validar datos de pago
      if (metodoPago === 'tarjeta') {
        if (!datosTarjeta.numero || !datosTarjeta.titular || !datosTarjeta.expiracion || !datosTarjeta.cvv) {
          throw new Error('Completa todos los datos de la tarjeta')
        }
        
        // Validar formato de tarjeta
        if (datosTarjeta.numero.replace(/\s/g, '').length !== 16) {
          throw new Error('El número de tarjeta debe tener 16 dígitos')
        }
        
        if (datosTarjeta.cvv.length !== 3) {
          throw new Error('El CVV debe tener 3 dígitos')
        }
      }

      // Crear reserva
      const { data: reservaData, error: reservaError } = await supabase
        .from('reservas')
        .insert([{
          usuario_id: user?.id,
          habitacion_id: id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida,
          num_huespedes: numHuespedes,
          estado: 'activa',
          total: total
        }])
        .select()

      if (reservaError) throw reservaError

      const reservaId = reservaData[0]?.id

      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Registrar pago
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert([{
          reserva_id: reservaId,
          monto: total,
          metodo_pago: metodoPago,
          estado: 'completado'
        }])

      if (pagoError) throw pagoError

      // Actualizar estado de habitación
      await supabase
        .from('habitaciones')
        .update({ estado: 'ocupada' })
        .eq('id', id)

      setPaso('confirmacion')
    } catch (err: any) {
      setError(err.message || 'Error al procesar la reserva')
    } finally {
      setLoading(false)
    }
  }

  // Muestra el spinner si la autenticación ESTÁ CARGANDO o si la habitación NO SE HA ENCONTRADO
  if (authLoading || !habitacion) { 
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
            Reservar Habitación {habitacion.numero}
          </h1>
          <p className="text-slate-600">{habitacion.tipo}</p>
        </div>

        {/* Pasos */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${paso === 'fechas' ? 'text-amber-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso === 'fechas' ? 'bg-amber-600' : 'bg-green-600'} text-white font-bold`}>
              1
            </div>
            <span className="ml-2 font-medium">Fechas</span>
          </div>
          <div className="w-24 h-1 bg-slate-300 mx-4"></div>
          <div className={`flex items-center ${paso === 'pago' ? 'text-amber-600' : paso === 'confirmacion' ? 'text-green-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso === 'pago' ? 'bg-amber-600' : paso === 'confirmacion' ? 'bg-green-600' : 'bg-slate-300'} text-white font-bold`}>
              2
            </div>
            <span className="ml-2 font-medium">Pago</span>
          </div>
          <div className="w-24 h-1 bg-slate-300 mx-4"></div>
          <div className={`flex items-center ${paso === 'confirmacion' ? 'text-green-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paso === 'confirmacion' ? 'bg-green-600' : 'bg-slate-300'} text-white font-bold`}>
              3
            </div>
            <span className="ml-2 font-medium">Confirmación</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Paso 1: Fechas */}
        {paso === 'fechas' && (
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Selecciona las Fechas</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Fecha de Entrada
                </label>
                <input
                  type="date"
                  value={fechaEntrada}
                  onChange={(e) => setFechaEntrada(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Fecha de Salida
                </label>
                <input
                  type="date"
                  value={fechaSalida}
                  onChange={(e) => setFechaSalida(e.target.value)}
                  min={fechaEntrada || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Número de Huéspedes
              </label>
              <input
                type="number"
                value={numHuespedes}
                onChange={(e) => setNumHuespedes(parseInt(e.target.value))}
                min="1"
                max={habitacion.capacidad}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
              <p className="text-sm text-slate-500 mt-1">
                Capacidad máxima: {habitacion.capacidad} personas
              </p>
            </div>

            {total > 0 && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    ${total.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={validarDisponibilidad}
              disabled={loading || !fechaEntrada || !fechaSalida}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Continuar al Pago'}
            </button>
          </div>
        )}

        {/* Paso 2: Pago */}
        {paso === 'pago' && (
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Información de Pago</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['tarjeta', 'efectivo', 'transferencia'] as const).map((metodo) => (
                  <button
                    key={metodo}
                    onClick={() => setMetodoPago(metodo)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      metodoPago === metodo
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium capitalize">{metodo}</p>
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === 'tarjeta' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    value={datosTarjeta.numero}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                      setDatosTarjeta({ ...datosTarjeta, numero: formatted })
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titular de la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={datosTarjeta.titular}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fecha de Expiración
                    </label>
                    <input
                      type="text"
                      value={datosTarjeta.expiracion}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4)
                        }
                        setDatosTarjeta({ ...datosTarjeta, expiracion: value })
                      }}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={datosTarjeta.cvv}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value.replace(/\D/g, '') })}
                      placeholder="123"
                      maxLength={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {metodoPago === 'efectivo' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  El pago en efectivo se realizará al momento del check-in en la recepción del hotel.
                </p>
              </div>
            )}

            {metodoPago === 'transferencia' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 mb-2">Datos para transferencia bancaria:</p>
                <p className="text-sm text-blue-700">Banco: Hotel Elegance Bank</p>
                <p className="text-sm text-blue-700">Cuenta: 1234-5678-9012</p>
                <p className="text-sm text-blue-700">Concepto: Reserva #{id?.slice(0, 8)}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-2">Resumen de Reserva</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Habitación: {habitacion.numero} - {habitacion.tipo}</p>
                <p>Entrada: {new Date(fechaEntrada).toLocaleDateString('es-ES')}</p>
                <p>Salida: {new Date(fechaSalida).toLocaleDateString('es-ES')}</p>
                <p>Huéspedes: {numHuespedes}</p>
                <p className="text-lg font-bold text-amber-600 mt-2">
                  Total: ${total.toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setPaso('fechas')}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-all"
              >
                Volver
              </button>
              <button
                onClick={procesarReserva}
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {paso === 'confirmacion' && (
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              ¡Reserva Confirmada!
            </h2>
            <p className="text-slate-600 mb-6">
              Tu reserva ha sido procesada exitosamente. Recibirás un email de confirmación.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold mb-3">Detalles de tu Reserva</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Habitación:</strong> {habitacion.numero} - {habitacion.tipo}</p>
                <p><strong>Check-in:</strong> {new Date(fechaEntrada).toLocaleDateString('es-ES')}</p>
                <p><strong>Check-out:</strong> {new Date(fechaSalida).toLocaleDateString('es-ES')}</p>
                <p><strong>Huéspedes:</strong> {numHuespedes}</p>
                <p><strong>Método de pago:</strong> {metodoPago}</p>
                <p className="text-lg font-bold text-amber-600 mt-3">
                  Total pagado: ${total.toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/usuario/dashboard')}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
            >
              Volver al Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
