import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Save, Lock, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

export const MiPerfil = () => {
  const { user } = useAuth()
  
  // Si 'user' es null (pasa brevemente al cargar), no renderiza nada
  if (!user) {
    return null
  }

  const [nombre, setNombre] = useState(user.nombre)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. Actualizamos la base de datos
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nombre: nombre })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      // 2. Actualizamos el localStorage para que el nombre persista
      localStorage.setItem('hotel_user', JSON.stringify(data))
      
      setSuccess('¡Nombre actualizado con éxito! La página se recargará.')

      // 3. Recargamos la página para que AuthContext y Navbar vean el nuevo nombre
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Error al actualizar el nombre.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">
          Mi Perfil
        </h1>

        {/* Mensajes de feedback */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Formulario de Datos Personales */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Datos Personales</h2>
          <form onSubmit={handleGuardarNombre} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">El correo electrónico no se puede modificar.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rol
              </label>
              <input
                type="text"
                value={user.rol}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || nombre === user.nombre}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {loading ? 'Guardando...' : 'Guardar Nombre'}
              </button>
            </div>
          </form>
        </div>
        
        {/* 2. Sección de Seguridad (Funciones deshabilitadas) */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Seguridad</h2>
          <div className="space-y-4">
            {/* Cambiar Contraseña */}
            <div>
              <button 
                disabled 
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </button>
              <p className="text-xs text-slate-500 mt-1">
                (Esta función requiere una Edge Function `update-password` que no está implementada.)
              </p>
            </div>

            {/* Borrar Cuenta */}
            <div>
              <button 
                disabled 
                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-5 w-5" />
                Borrar mi Cuenta
              </button>
              <p className="text-xs text-slate-500 mt-1">
                (Esta función es peligrosa y requiere una Edge Function `delete-user`.)
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}