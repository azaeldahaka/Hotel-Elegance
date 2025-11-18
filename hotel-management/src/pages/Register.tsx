import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Hotel, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'

export const Register = () => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return }
    try { await register(email, password, nombre); navigate('/usuario/dashboard'); } catch (err: any) { setError(err.message || 'Error al registrarse'); } finally { setLoading(false); }
  }

  const handleGoogleLogin = async () => {
    try { setLoading(true); await loginWithGoogle(); } catch (err: any) { setError('Error al conectar con Google'); setLoading(false); }
  }
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) navigate('/');
  }

  return (
    <div 
      // --- CAMBIO AQUÍ TAMBIÉN ---
      className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center bg-cover bg-center px-4 py-6" 
      style={{ backgroundImage: 'url(/images/lobby/hero.jpg)' }}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none" />
      
      <div 
        className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 z-10 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => navigate('/')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-3">
            <Hotel className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Crear Cuenta</h2>
          <p className="text-slate-600 mt-2 text-sm">Únete a Hotel Elegance</p>
        </div>

        {error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm"><AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span></div>)}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div><input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Juan Pérez" required /></div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="tu@email.com" required /></div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Mínimo 6 caracteres" minLength={6} required /></div></div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none font-semibold transition-all disabled:opacity-50">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear Cuenta'}</button>
        </form>

        <div className="mt-6">
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">O registrarse con</span></div></div>
          <button type="button" onClick={handleGoogleLogin} className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50 font-medium transition-all">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Google
          </button>
        </div>

        <div className="mt-6 text-center"><p className="text-slate-600 text-sm">¿Ya tienes cuenta? <Link to="/login" className="font-medium text-amber-600 hover:text-amber-500">Inicia sesión</Link></p></div>
      </div>
    </div>
  )
}