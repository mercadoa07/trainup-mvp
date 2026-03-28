import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, LoadingSpinner } from '../../components/ui'
import { ArrowLeft, Dumbbell, ChevronDown, ChevronUp, Clock, BarChart2 } from 'lucide-react'

export default function WorkoutDetail() {
  const { workoutId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(0)

  useEffect(() => {
    if (workoutId) loadWorkout()
  }, [workoutId])

  async function loadWorkout() {
    const { data: w } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('trainer_id', profile.id)
      .single()

    const { data: d } = await supabase
      .from('workout_days')
      .select('*, exercises(* )')
      .eq('workout_id', workoutId)
      .order('day_number')

    if (w) setWorkout(w)
    if (d) {
      setDays(d.map(day => ({
        ...day,
        exercises: (day.exercises || []).sort((a, b) => a.order_index - b.order_index)
      })))
    }
    setLoading(false)
  }

  function difficultyLabel(d) {
    const map = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
    return map[d] || d
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!workout) return <div className="text-center py-20 text-gray-500">Plan no encontrado</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{workout.name}</h1>
          {workout.goal && <p className="text-sm text-gray-500 truncate">{workout.goal}</p>}
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-2 flex-wrap">
        {workout.difficulty && <Badge variant="info">{difficultyLabel(workout.difficulty)}</Badge>}
        <Badge variant="default">{workout.days_per_week} dias/semana</Badge>
        <Badge variant="default">{workout.duration_weeks} semanas</Badge>
      </div>

      {workout.description && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">{workout.description}</p>
        </Card>
      )}

      {/* Days */}
      <div className="flex flex-col gap-2">
        {days.map((day, idx) => (
          <Card key={day.id} className="overflow-hidden">
            <div
              className="p-4 flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandedDay(expandedDay === idx ? -1 : idx)}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-700">{day.day_number}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{day.name}</p>
                {day.scheduled_date && (
                  <p className="text-xs text-blue-600 font-medium">
                    {new Date(day.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {day.focus && <p className="text-xs text-gray-500">{day.focus}</p>}
              </div>
              <span className="text-xs text-gray-400 mr-2">{day.exercises?.length} ejercicios</span>
              {expandedDay === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>

            {expandedDay === idx && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3 flex flex-col gap-2">
                  {day.exercises?.map((ex, exIdx) => (
                    <div key={ex.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 font-medium mt-0.5 w-5">{exIdx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{ex.name}</p>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <BarChart2 className="w-3 h-3" /> {ex.sets} x {ex.reps}
                            </span>
                            {ex.rest_seconds && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" /> {ex.rest_seconds}s descanso
                              </span>
                            )}
                            {ex.weight_prescribed && (
                              <span className="text-xs text-gray-500">Peso: {ex.weight_prescribed}</span>
                            )}
                          </div>
                          {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
