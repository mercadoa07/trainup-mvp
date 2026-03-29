import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui'
import { Zap, CheckCircle2, Clock, BarChart2, ChevronRight, Play, Calendar } from 'lucide-react'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [todayLog, setTodayLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) loadTodayWorkout()
  }, [profile])

  async function loadTodayWorkout() {
    const today = new Date().toISOString().split('T')[0]

    // Get active assignment with workout details
    const { data: assignment } = await supabase
      .from('assignments')
      .select(`
        *,
        workouts(
          id, name, description, days_per_week,
          workout_days(id, day_number, name, focus, exercises(id, name, sets, reps, rest_seconds, weight_prescribed, notes, order_index))
        )
      `)
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!assignment) {
      setLoading(false)
      return
    }

    // Check if already trained today
    const { data: existingLog } = await supabase
      .from('workout_logs')
      .select('*, workout_days(name, day_number), exercise_logs(*, exercises(name))')
      .eq('assignment_id', assignment.id)
      .eq('logged_date', today)
      .maybeSingle()

    // Get today's day
    const days = assignment.workouts?.workout_days || []
    const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)

    const hasScheduledDates = sortedDays.some(d => d.scheduled_date)

    let todayDay = null
    let upcomingScheduled = []

    if (hasScheduledDates) {
      // Date-based mode
      todayDay = sortedDays.find(d => d.scheduled_date === today) || null
      upcomingScheduled = sortedDays
        .filter(d => d.scheduled_date && d.scheduled_date > today)
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
        .slice(0, 3)
    } else {
      // Cyclic mode
      const totalDays = sortedDays.length
      const currentDayNumber = ((assignment.current_day - 1) % totalDays) + 1
      todayDay = sortedDays.find(d => d.day_number === currentDayNumber) || sortedDays[0]
    }

    if (todayDay) {
      todayDay.exercises = (todayDay.exercises || []).sort((a, b) => a.order_index - b.order_index)
    }

    setData({ assignment, todayDay, workout: assignment.workouts, hasScheduledDates, upcomingScheduled })
    setTodayLog(existingLog || null)
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  // No assignment
  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Tu entrenamiento de hoy</p>
        </div>
        <EmptyState
          icon={Zap}
          title="Sin plan asignado"
          description="Tu entrenador todavia no te asigno un plan. Contactalo para que lo configure."
        />
      </div>
    )
  }

  const { assignment, todayDay, workout, hasScheduledDates, upcomingScheduled } = data

  // Already trained today
  if (todayLog?.completed) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Tu entrenamiento de hoy</p>
        </div>

        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Entrenamiento completado!</h2>
          <p className="text-sm text-gray-500 mb-1">{todayDay?.name}</p>
          {todayLog.duration_minutes && (
            <p className="text-sm text-green-600 font-medium">{todayLog.duration_minutes} minutos</p>
          )}
        </Card>

        {todayLog.exercise_logs?.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Lo que hiciste hoy</h3>
            <div className="flex flex-col gap-2">
              {todayLog.exercise_logs.map(el => (
                <Card key={el.id} className="p-3">
                  <p className="text-sm font-medium text-gray-900">{el.exercises?.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{el.sets_completed} series</span>
                    {el.reps_completed && <span>Reps: {el.reps_completed.join(', ')}</span>}
                    {el.weight_used && <span>Peso: {el.weight_used.join(', ')} kg</span>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Button variant="secondary" onClick={() => navigate('/student/history')} className="w-full">
          Ver historial completo <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    )
  }

  // Upcoming days — cyclic mode (not date-based)
  const allDays = [...(data?.workout?.workout_days || [])].sort((a, b) => a.day_number - b.day_number)
  const totalDays = allDays.length
  const upcomingDays = !hasScheduledDates && totalDays > 1
    ? Array.from({ length: Math.min(3, totalDays - 1) }, (_, i) => {
        const nextNum = ((data.assignment.current_day + i) % totalDays) + 1
        return allDays.find(d => d.day_number === nextNum)
      }).filter(Boolean)
    : []

  // Date-based mode: no workout today
  if (hasScheduledDates && !todayDay) {
    const nextSession = upcomingScheduled?.[0] || null
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Tu entrenamiento de hoy</p>
        </div>

        <Card className="p-6 text-center bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">No tenés entrenamiento hoy</h2>
          <p className="text-sm text-gray-500">Descansá y recuperate para la proxima sesion.</p>
        </Card>

        {nextSession && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Proxima sesion</h3>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{nextSession.name}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    {new Date(nextSession.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  {nextSession.focus && <p className="text-xs text-gray-400 truncate">{nextSession.focus}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {nextSession.exercises?.length || 0} ejercicios
                </span>
              </div>
            </Card>
          </div>
        )}

        {upcomingScheduled.length > 1 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Sesiones programadas</h3>
            <div className="flex flex-col gap-2">
              {upcomingScheduled.slice(1).map((d) => (
                <Card key={d.id} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-blue-500">
                      {new Date(d.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {d.exercises?.length || 0} ejercicios
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show today's workout
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Tu entrenamiento de hoy</p>
      </div>

      {/* Today's workout card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-5 text-white">
          <Badge className="bg-white/20 text-white border-0 mb-2">{workout.name}</Badge>
          <h2 className="text-xl font-bold mb-0.5">{todayDay?.name}</h2>
          {todayDay?.focus && <p className="text-blue-100 text-sm">{todayDay.focus}</p>}
          <div className="flex gap-3 mt-3 text-sm text-blue-100">
            <span className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4" /> {todayDay?.exercises?.length} ejercicios
            </span>
            {hasScheduledDates && todayDay?.scheduled_date ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(todayDay.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> Dia {assignment.current_day} del ciclo
              </span>
            )}
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-2 mb-5">
            {todayDay?.exercises?.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-400">{ex.sets} series x {ex.reps} reps{ex.weight_prescribed ? ' - ' + ex.weight_prescribed : ''}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate('/student/workout', { state: { assignment, todayDay } })}
          >
            <Play className="w-5 h-5 mr-2" /> Comenzar entrenamiento
          </Button>
        </div>
      </Card>

      {/* Upcoming sessions — date mode */}
      {hasScheduledDates && upcomingScheduled.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Proximas sesiones</h3>
          <div className="flex flex-col gap-2">
            {upcomingScheduled.map((d) => (
              <Card key={d.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-blue-500">
                    {new Date(d.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  {d.focus && <p className="text-xs text-gray-400 truncate">{d.focus}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {d.exercises?.length || 0} ejercicios
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions — cyclic mode */}
      {!hasScheduledDates && upcomingDays.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Proximas sesiones</h3>
          <div className="flex flex-col gap-2">
            {upcomingDays.map((d, i) => (
              <Card key={d.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">{i + 2}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  {d.focus && <p className="text-xs text-gray-400 truncate">{d.focus}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {d.exercises?.length || 0} ejercicios
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
