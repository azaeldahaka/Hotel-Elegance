import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Hotel, LogOut, User, Settings, Menu, X } from 'lucide-react'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false) // Estado para el menú móvil

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const getDashboardRoute = () => {
    if (!user) return '/'
    switch (user.rol) {
      case 'administrador': return '/admin/dashboard'
      case 'operador': return '/operador/dashboard'
      case 'usuario': return '/usuario/dashboard'
      default: return '/'
    }
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <Hotel className="h-8 w-8 md:h-10 md:w-10 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <div>
                <span className="text-xl md:text-2xl font-serif font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Hotel Elegance
                </span>
                <p className="text-[10px] md:text-xs text-slate-400 hidden sm:block">Lujo y Confort</p>
              </div>
            </Link>
          </div>

          {/* --- MENÚ DE ESCRITORIO (Oculto en celular) --- */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={getDashboardRoute()} className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-slate-700 transition-colors" title="Dashboard">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.nombre.split(' ')[0]}</span>
                </Link>
                <Link to="/mi-perfil" className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-700 transition-colors" title="Mi Perfil">
                  <Settings className="h-5 w-5" />
                </Link>
                <button onClick={handleLogout} className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium">
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-6 py-2 hover:bg-slate-700 rounded-lg transition-colors font-medium">Ingresar</Link>
                <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg transition-all font-medium shadow-lg">Registrarse</Link>
              </>
            )}
          </div>

          {/* --- BOTÓN HAMBURGUESA (Solo visible en celular) --- */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 animate-in slide-in-from-top-5 duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="px-3 py-2 text-amber-400 font-bold border-b border-slate-700 mb-2">
                  Hola, {user.nombre}
                </div>
                <Link 
                  to={getDashboardRoute()} 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white"
                >
                  <User className="h-5 w-5" /> <span>Ir al Dashboard</span>
                </Link>
                <Link 
                  to="/mi-perfil" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white"
                >
                  <Settings className="h-5 w-5" /> <span>Mi Perfil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-slate-700 hover:text-red-300"
                >
                  <LogOut className="h-5 w-5" /> <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium hover:bg-slate-700 hover:text-white">Iniciar Sesión</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium bg-amber-600 text-white hover:bg-amber-700 mt-2">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}