import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, LoadingSpinner, EmptyState } from '../../components/ui'
import { Users, CheckCircle2, Clock, TrendingUp, ChevronRight, Plus } from 'lucide-react'

export default function TrainerDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) loadStudents()
  }, [profile])

  async function loadStudents() {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const { data: studentProfiles, error } = await supabase
      .from('student_profiles')
      .select(`
        id,
        subscription_status,
        profiles!student_profiles_id_fkey(id, full_name, email)
      `)
      .eq('trainer_id', profile.id)

    if (error || !studentProfiles) { setLoading(false); return }

    const enriched = await Promise.all(
      studentProfiles.map(async (sp) => {
        const studentId = sp.id

        // Get active assignment
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, workout_id, workouts(name)')
          .eq('student_id', studentId)
          .eq('trainer_id', profile.id)
          .eq('status', 'active')
          .limit(1)

        const assignment = assignments?.[0]

        // Get logs this week
        const { data: weekLogs } = await supabase
          .from('workout_logs')
          .select('logged_date, completed')
          .eq('student_id', studentId)
          .gte('logged_date', weekAgo)
          .lte('logged_date', today)
          .order('logged_date', { ascending: false })

        const completedThisWeek = weekLogs?.filter(l => l.completed).length || 0
        const trainedToday = weekLogs?.some(l => l.logged_date === today && l.completed) || false
        const lastSession = weekLogs?.find(l => l.completed)?.logged_date

        return {
          id: studentId,
          name: sp.profiles.full_name,
          email: sp.profiles.email,
          status: sp.subscription_status,
          plan: assignment?.workouts?.name || null,
          completedThisWeek,
          trainedToday,
          lastSession
        }
      })
    )

    setStudents(enriched)
    setLoading(false)
  }

  const trainedToday = students.filter(s => s.trainedToday).length
  const withPlan = students.filter(s => s.plan).length

  function formatLastSession(date) {
    if (!date) return 'Nunca'
    const d = new Date(date + 'T12:00:00')
    const today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Ayer'
    return `Hace ${diff} días`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de hoy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Alumnos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{trainedToday}</p>
          <p className="text-xs text-gray-500 mt-0.5">Entrenaron hoy</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{withPlan}</p>
          <p className="text-xs text-gray-500 mt-0.5">Con plan</p>
        </Card>
      </div>

      {/* Students list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Mis alumnos</h2>
          <button
            onClick={() => navigate('/trainer/students')}
            className="text-sm text-blue-600 hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin alumnos aún"
            description="Invitá a tus alumnos para empezar a trackear su progreso"
            action={
              <button
                onClick={() => navigate('/trainer/students')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Invitar alumno
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {students.map(student => (
              <Card
                key={student.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-99"
                onClick={() => navigate(`/trainer/students/${student.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                      {student.trainedToday && (
                        <Badge variant="success">Entrenó hoy</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {student.plan ? `Plan: ${student.plan}` : 'Sin plan asignado'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastSession(student.lastSession)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {student.completedThisWeek} esta semana
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
