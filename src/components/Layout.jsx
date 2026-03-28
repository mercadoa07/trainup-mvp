import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Dumbbell, LogOut, ChevronRight,
  History, TrendingUp, Zap
} from 'lucide-react'

function TrainerNav() {
  const nav = [
    { to: '/trainer', label: 'Inicio', icon: LayoutDashboard, end: true },
    { to: '/trainer/students', label: 'Alumnos', icon: Users },
    { to: '/trainer/workouts', label: 'Planes', icon: Dumbbell },
  ]
  return nav
}

function StudentNav() {
  const nav = [
    { to: '/student', label: 'Hoy', icon: Zap, end: true },
    { to: '/student/history', label: 'Historial', icon: History },
    { to: '/student/progress', label: 'Progreso', icon: TrendingUp },
  ]
  return nav
}

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isTrainer = profile?.role === 'trainer'
  const navItems = isTrainer ? TrainerNav() : StudentNav()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TrainUp</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{profile?.full_name}</span>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 shadow-t">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
