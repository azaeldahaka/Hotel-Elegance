import { Link } from 'react-router-dom'
import { Sparkles, Bed, Utensils, Dumbbell, Waves, Calendar, Phone } from 'lucide-react'

export const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/lobby/hero.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/70" />
        </div>
        
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
              Bienvenido a
              <span className="block bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent mt-2">
                Hotel Elegance
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 font-light">
              Donde el lujo se encuentra con la comodidad
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-2xl transition-all text-lg"
              >
                Reservar Ahora
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-lg border-2 border-white/30 transition-all text-lg"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios Destacados */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-slate-600">
              Experimenta el máximo confort y elegancia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard
              icon={<Bed className="h-8 w-8" />}
              title="Habitaciones de Lujo"
              description="Elegantes habitaciones con todas las comodidades"
            />
            <ServiceCard
              icon={<Utensils className="h-8 w-8" />}
              title="Restaurante Gourmet"
              description="Cocina internacional de primera clase"
            />
            <ServiceCard
              icon={<Waves className="h-8 w-8" />}
              title="Spa & Wellness"
              description="Relajácio y tratamientos premium"
            />
            <ServiceCard
              icon={<Dumbbell className="h-8 w-8" />}
              title="Gimnasio"
              description="Equipamiento de última generación"
            />
          </div>
        </div>
      </section>

      {/* Galería de Habitaciones */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">
              Nuestras Habitaciones
            </h2>
            <p className="text-lg text-slate-600">
              Diseñadas para su comodidad y placer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RoomCard
              image="/images/rooms/room-1.jpg"
              title="Habitación Simple"
              price="$40,000"
            />
            <RoomCard
              image="/images/rooms/room-2.jpg"
              title="Habitación Doble"
              price="$60,000"
            />
            <RoomCard
              image="/images/rooms/suite.jpg"
              title="Suite de Lujo"
              price="$120,000"
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-amber-400" />
          <h2 className="text-4xl font-serif font-bold mb-6">
            Listo para una Experiencia Inolvidable
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Crea tu cuenta y comienza a disfrutar de nuestros servicios exclusivos
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold rounded-lg shadow-2xl transition-all text-lg"
          >
            Registrarse Ahora
          </Link>
        </div>
      </section>
    </div>
  )
}

const ServiceCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center p-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
)

const RoomCard = ({ image, title, price }: { image: string; title: string; price: string }) => (
  <div className="group cursor-pointer">
    <div className="relative overflow-hidden rounded-xl shadow-lg mb-4">
      <img
        src={image}
        alt={title}
        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 text-white">
        <h3 className="text-2xl font-serif font-bold mb-1">{title}</h3>
        <p className="text-amber-400 text-xl font-semibold">{price} / noche</p>
      </div>
    </div>
  </div>
)
