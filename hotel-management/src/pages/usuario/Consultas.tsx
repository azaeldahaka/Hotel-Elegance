import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Consulta } from '@/types'
import { Mail, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export const Consultas = () => {
  const { user } = useAuth()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    asunto: '',
    mensaje: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarConsultas()
  }, [])

  const cargarConsultas = async () => {
    try {
      const { data } = await supabase
        .from('consultas')
        .select('*')
        .eq('usuario_id', user?.id)
        .order('fecha_consulta', { ascending: false })
      
      setConsultas(data || [])
    } catch (error) {
      console.error('Error cargando consultas:', error)
    }
  }

  const enviarConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!formData.asunto || !formData.mensaje) {
        throw new Error('Por favor completa todos los campos')
      }

      const { error: insertError } = await supabase
        .from('consultas')
        .insert([{
          usuario_id: user?.id,
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          estado: 'pendiente'
        }])

      if (insertError) throw insertError

      setSuccess('Consulta enviada exitosamente. Te responderemos pronto.')
      setFormData({ asunto: '', mensaje: '' })
      setShowForm(false)
      cargarConsultas()
    } catch (err: any) {
      setError(err.message || 'Error al enviar la consulta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
            Mis Consultas
          </h1>
          <p className="text-slate-600">Envía tus preguntas y comentarios</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botón Nueva Consulta */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-lg transition-all"
          >
            <Send className="h-5 w-5" />
            Nueva Consulta
          </button>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-6">Nueva Consulta</h2>
            
            <form onSubmit={enviarConsulta} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Ej: Consulta sobre servicios del hotel"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  rows={5}
                  placeholder="Escribe tu consulta aquí..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ asunto: '', mensaje: '' })
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  {loading ? 'Enviando...' : 'Enviar Consulta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Consultas */}
        <div className="space-y-4">
          {consultas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No tienes consultas registradas</p>
            </div>
          ) : (
            consultas.map((consulta) => (
              <div key={consulta.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{consulta.asunto}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        consulta.estado === 'pendiente' 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {consulta.estado === 'pendiente' ? (
                          <><Clock className="h-3 w-3" /> Pendiente</>
                        ) : (
                          <><CheckCircle className="h-3 w-3" /> Respondida</>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{consulta.mensaje}</p>
                    <p className="text-xs text-slate-400">
                      Enviado: {new Date(consulta.fecha_consulta || '').toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                
                {consulta.respuesta && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Respuesta del Hotel:
                    </p>
                    <p className="text-sm text-blue-800">{consulta.respuesta}</p>
                    {consulta.fecha_respuesta && (
                      <p className="text-xs text-blue-600 mt-2">
                        Respondido: {new Date(consulta.fecha_respuesta).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
