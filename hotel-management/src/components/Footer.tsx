import { Link } from 'react-router-dom'
import { Hotel, Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Columna 1: Marca */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="h-8 w-8 text-teal-400" />
              <span className="text-xl font-serif font-bold text-white tracking-wide">
                HORIZONTE
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mb-6">
              Tu refugio de tranquilidad en el corazón de Salta. Lujo, naturaleza y confort en un solo lugar.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-teal-400 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-teal-400 transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-teal-400 transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Explorar</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Inicio</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Reservar</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Mi Cuenta</Link></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Servicios</a></li>
            </ul>
          </div>

          {/* Columna 3: Legales */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Cookies</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-500 shrink-0" />
                <span>Av. San Martín 1234,<br/>Salta, Argentina</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-teal-500 shrink-0" />
                <span>+54 387 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-teal-500 shrink-0" />
                <span>reservas@horizontesuites.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
          <p>© 2025 Horizonte Suites. Todos los derechos reservados.</p>
          <p className="mt-2">Desarrollado por Facundo Flores</p>
        </div>
      </div>
    </footer>
  )
}