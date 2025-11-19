import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Hotel, LogOut, User, Settings, Menu, X, Users } from 'lucide-react'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-800 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-teal-50 p-2 rounded-xl group-hover:bg-teal-100 transition-colors">
                <Hotel className="h-8 w-8 text-teal-600" />
              </div>
              <div className="hidden min-[350px]:block">
                <span className="text-xl md:text-2xl font-serif font-bold text-slate-800 tracking-tight group-hover:text-teal-700 transition-colors">
                  HORIZONTE SUITES
                </span>
              </div>
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* --- NUEVO LINK: NOSOTROS (Visible para todos) --- */}
            <Link to="/nosotros" className="text-slate-600 hover:text-teal-600 font-medium px-4 py-2 transition-colors flex items-center gap-2">
              <Users className="h-4 w-4" /> Nosotros
            </Link>

            {user ? (
              <>
                <Link to={getDashboardRoute()} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 text-sm font-medium transition-all border border-transparent hover:border-slate-200">
                  <User className="h-4 w-4 text-teal-600" />
                  <span>{user.nombre.split(' ')[0]}</span>
                </Link>
                
                <Link to="/mi-perfil" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-teal-600 transition-colors" title="Mi Perfil">
                  <Settings className="h-5 w-5" />
                </Link>

                <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors text-sm font-semibold">
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-teal-600 font-medium px-4 py-2 transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all transform hover:-translate-y-0.5">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón Hamburguesa Móvil */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-4 pb-6 space-y-2">
            
            {/* --- NUEVO LINK: NOSOTROS (Móvil) --- */}
            <Link 
              to="/nosotros" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
            >
              <Users className="h-5 w-5 text-teal-500" /> Nosotros
            </Link>

            {user ? (
              <>
                <div className="px-4 py-3 bg-teal-50 rounded-xl mb-4">
                  <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Bienvenido</p>
                  <p className="font-bold text-slate-800">{user.nombre}</p>
                </div>
                <Link to={getDashboardRoute()} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium">
                  <User className="h-5 w-5 text-teal-500" /> Ir al Dashboard
                </Link>
                <Link to="/mi-perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium">
                  <Settings className="h-5 w-5 text-teal-500" /> Mi Perfil
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium text-left mt-2">
                  <LogOut className="h-5 w-5" /> Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-4 border-t border-slate-100 pt-4">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 rounded-xl border border-slate-200 font-bold text-slate-700">Iniciar Sesión</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 rounded-xl bg-teal-600 text-white font-bold shadow-md">Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}