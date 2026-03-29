import { useNavigate } from 'react-router-dom'
import { Dumbbell, Users, ClipboardList, TrendingUp, ChevronRight, MessageCircle, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Planes personalizados',
    desc: 'Creá planes de entrenamiento con sesiones, ejercicios y fechas. Tus alumnos los ven en su celular.',
  },
  {
    icon: Users,
    title: 'Gestión de alumnos',
    desc: 'Invitá a tus alumnos con un link. Seguí su adherencia y progreso desde un solo lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Progreso en tiempo real',
    desc: 'Los alumnos registran cada serie y peso. Vos ves las gráficas de evolución.',
  },
  {
    icon: MessageCircle,
    title: 'Integración con WhatsApp',
    desc: 'Enviá el plan completo o una sesión por WhatsApp con un solo tap.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TrainUp</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Dumbbell className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 max-w-lg leading-tight">
          La app para entrenadores que quieren crecer
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-md">
          Creá planes, gestioná alumnos y seguí su progreso. Todo desde el celular, sin complicaciones.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Zap className="w-5 h-5" /> Empezar gratis
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl text-base font-medium hover:border-gray-300 transition-all"
          >
            Ya tengo cuenta <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Gratis para siempre en el plan básico. Sin tarjeta de crédito.</p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Todo lo que necesitás como entrenador</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">¿Listo para empezar?</h2>
        <p className="text-blue-100 mb-8 text-sm">Registrate en menos de 2 minutos y creá tu primer plan hoy.</p>
        <button
          onClick={() => navigate('/signup')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-2xl text-base font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Zap className="w-5 h-5" /> Crear mi cuenta gratis
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} TrainUp · Hecho para entrenadores latinoamericanos 🇦🇷
      </footer>
    </div>
  )
}
