import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { UsuarioDashboard } from './pages/usuario/UsuarioDashboard'
import { CrearReserva } from './pages/usuario/CrearReserva'
import { Consultas } from './pages/usuario/Consultas'
import { OperadorDashboard } from './pages/operador/OperadorDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route path="/usuario/dashboard" element={
              <ProtectedRoute roles={['usuario']}>
                <UsuarioDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/usuario/reservar/:id" element={
              <ProtectedRoute roles={['usuario']}>
                <CrearReserva />
              </ProtectedRoute>
            } />
            
            <Route path="/usuario/consultas" element={
              <ProtectedRoute roles={['usuario']}>
                <Consultas />
              </ProtectedRoute>
            } />
            
            <Route path="/operador/dashboard" element={
              <ProtectedRoute roles={['operador']}>
                <OperadorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['administrador']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

// Componente para rutas protegidas
const ProtectedRoute = ({ 
  children, 
  roles 
}: { 
  children: React.ReactNode
  roles: string[] 
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default App
