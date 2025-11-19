// src/pages/MiPerfil.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Save, Lock, Trash2, AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react'

// --- ¡NUEVO COMPONENTE! MODAL PARA CAMBIAR CONTRASEÑA ---
const ModalCambiarPassword = ({ user_id, onClose, onSuccess }: { user_id: string, onClose: () => void, onSuccess: () => void }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('update-password', {
        body: {
          user_id: user_id,
          old_password: oldPassword,
          new_password: newPassword
        }
      });
      
      if (funcError) {
        const errorData = await funcError.context.json();
        throw new Error(errorData.error.message);
      }
      
      // ¡Éxito!
      onSuccess();

    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña Anterior</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin h-5 w-5 mx-auto" /> : 'Guardar Contraseña'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ¡NUEVO COMPONENTE! MODAL PARA BORRAR CUENTA ---
const ModalBorrarCuenta = ({ user_id, onClose, onSuccess }: { user_id: string, onClose: () => void, onSuccess: () => void }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción es irreversible y borrará tu cuenta.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('delete-account', {
        body: {
          user_id: user_id,
          password: password,
        }
      });
      
      if (funcError) {
        const errorData = await funcError.context.json();
        throw new Error(errorData.error.message);
      }
      
      onSuccess();

    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-600">Borrar Cuenta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-slate-700">
            Esta acción es irreversible. Para confirmar, por favor ingresá tu contraseña.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tu Contraseña</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin h-5 w-5 mx-auto" /> : 'Borrar mi cuenta para siempre'}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL 'MiPerfil' (ACTUALIZADO) ---
export const MiPerfil = () => {
  const { user, logout } = useAuth() // Añadimos 'logout'
  const navigate = useNavigate() // Añadimos 'navigate'
  
  // Si 'user' es null (pasa brevemente al cargar), no renderiza nada
  if (!user) {
    return null
  }

  const [nombre, setNombre] = useState(user.nombre)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- NUEVO: Estados para los modales ---
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nombre: nombre })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      localStorage.setItem('hotel_user', JSON.stringify(data))
      setSuccess('¡Nombre actualizado con éxito! La página se recargará.')

      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Error al actualizar el nombre.')
    } finally {
      setLoading(false)
    }
  }

  // --- NUEVO: Handler para cuando se cambia la pass ---
  const onPasswordSuccess = () => {
    setShowPasswordModal(false);
    setSuccess('¡Contraseña cambiada! Serás redirigido al login.');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 3000);
  }

  // --- NUEVO: Handler para cuando se borra la cuenta ---
  const onDeleteSuccess = () => {
    setShowDeleteModal(false);
    setSuccess('Tu cuenta ha sido borrada. Qué lástima verte ir.');
    setTimeout(() => {
      logout();
      navigate('/');
    }, 3000);
  }

  return (
    <>
      {/* --- NUEVO: Renderizado de Modales --- */}
      {showPasswordModal && (
        <ModalCambiarPassword 
          user_id={user.id}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={onPasswordSuccess}
        />
      )}
      {showDeleteModal && (
        <ModalBorrarCuenta 
          user_id={user.id}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={onDeleteSuccess}
        />
      )}

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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
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
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {loading ? 'Guardando...' : 'Guardar Nombre'}
                </button>
              </div>
            </form>
          </div>
          
          {/* 2. Sección de Seguridad (Botones activados) */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-6">Seguridad</h2>
            <div className="space-y-4">
              {/* Cambiar Contraseña */}
              <div>
                <button 
                  onClick={() => setShowPasswordModal(true)} // --- CAMBIO: Activado ---
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Lock className="h-5 w-5" />
                  Cambiar Contraseña
                </button>
              </div>

              {/* Borrar Cuenta */}
              <div>
                <button 
                  onClick={() => setShowDeleteModal(true)} // --- CAMBIO: Activado ---
                  className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Borrar mi Cuenta
                </button>
                <p className="text-xs text-slate-500 mt-1">
                  (¡Cuidado! Esta acción no se puede deshacer.)
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}