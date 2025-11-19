import { motion } from 'framer-motion'
import { Users, Heart, Globe } from 'lucide-react'

export const Nosotros = () => {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-6">Nuestra Historia</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Fundado en 2025, Horizonte Suites nació con una misión simple: redefinir la hospitalidad en el norte argentino, fusionando la calidez de nuestra cultura con el lujo contemporáneo.
          </p>
        </motion.div>

        {/* Valores */}
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          <ValueCard 
            icon={<Users className="h-10 w-10" />} 
            title="Pasión por el Servicio" 
            desc="Nuestro equipo no solo trabaja aquí, vive la hospitalidad. Cada sonrisa es genuina." 
          />
          <ValueCard 
            icon={<Heart className="h-10 w-10" />} 
            title="Compromiso Local" 
            desc="Trabajamos con productores locales para llevar lo mejor de Salta a tu mesa." 
          />
          <ValueCard 
            icon={<Globe className="h-10 w-10" />} 
            title="Sustentabilidad" 
            desc="Cuidamos nuestro entorno. Prácticas eco-friendly en cada aspecto de nuestra operación." 
          />
        </div>

        {/* Equipo (Placeholder) */}
        <div className="bg-slate-50 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Conoce al equipo</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Fotos simuladas */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group">
                <div className="aspect-square rounded-2xl bg-slate-200 mb-4 overflow-hidden">
                  <img src={`https://source.unsplash.com/random/400x400?person&sig=${i}`} alt="Team" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                </div>
                <h3 className="font-bold text-lg">Miembro del Equipo</h3>
                <p className="text-teal-600 text-sm">Especialista</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const ValueCard = ({ icon, title, desc }: any) => (
  <div className="text-center">
    <div className="w-20 h-20 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600">{desc}</p>
  </div>
)