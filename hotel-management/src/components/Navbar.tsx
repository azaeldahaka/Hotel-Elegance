import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Hotel, LogOut, User } from 'lucide-react'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardRoute = () => {
    if (!user) return '/'
    
    switch (user.rol) {
      case 'administrador':
        return '/admin/dashboard'
      case 'operador':
        return '/operador/dashboard'
      case 'usuario':
        return '/usuario/dashboard'
      default:
        return '/'
    }
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <Hotel className="h-10 w-10 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <div>
                <span className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Hotel Elegance
                </span>
                <p className="text-xs text-slate-400">Lujo y Confort</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.nombre}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2 hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg transition-all font-medium shadow-lg"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
