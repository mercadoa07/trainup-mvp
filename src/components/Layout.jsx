import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Users, Dumbbell, LogOut,
  History, TrendingUp, Zap, Bell, CheckCheck,
  Dumbbell as DumbbellIcon, ClipboardList, Zap as ZapIcon
} from 'lucide-react'

function TrainerNav() {
  return [
    { to: '/trainer', label: 'Inicio', icon: LayoutDashboard, end: true },
    { to: '/trainer/students', label: 'Alumnos', icon: Users },
    { to: '/trainer/workouts', label: 'Planes', icon: Dumbbell },
  ]
}

function StudentNav() {
  return [
    { to: '/student', label: 'Hoy', icon: Zap, end: true },
    { to: '/student/history', label: 'Historial', icon: History },
    { to: '/student/progress', label: 'Progreso', icon: TrendingUp },
  ]
}

function typeIcon(type) {
  if (type === 'plan_assigned') return <ClipboardList className="w-4 h-4 text-blue-500" />
  if (type === 'workout_reminder') return <ZapIcon className="w-4 h-4 text-orange-500" />
  if (type === 'student_completed') return <CheckCheck className="w-4 h-4 text-green-500" />
  return <Bell className="w-4 h-4 text-gray-400" />
}

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (diff < 1) return 'ahora'
  if (diff < 60) return `hace ${diff}m`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  return `hace ${days}d`
}

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isTrainer = profile?.role === 'trainer'
  const navItems = isTrainer ? TrainerNav() : StudentNav()

  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const now = new Date().toISOString()

  useEffect(() => {
    if (!profile?.id) return
    loadNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        const n = payload.new
        // Only show if created_at <= now (workout reminders are pre-scheduled)
        if (n.created_at <= now) {
          setNotifications(prev => [n, ...prev])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false)
      }
    }
    if (showPanel) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPanel])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .lte('created_at', now)
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setNotifications(data)
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">{profile?.full_name}</span>

            {/* Bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setShowPanel(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications panel */}
              {showPanel && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-bold text-gray-900 text-sm">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 font-medium hover:underline">
                        Marcar todo leído
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        Sin notificaciones
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`px-4 py-3 flex gap-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            {typeIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.title}
                              </p>
                              {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                            </div>
                            {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>}
                            <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
