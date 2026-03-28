import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, LoadingSpinner, EmptyState } from '../../components/ui'
import { Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp, Star } from 'lucide-react'

export default function History() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (profile?.id) loadHistory()
  }, [profile])

  async function loadHistory() {
    const { data, error } = await supabase
      .from('workout_logs')
      .select(`
        *,
        workout_days(name, day_number),
        assignments(workouts(name)),
        exercise_logs(*, exercises(name))
      `)
      .eq('student_id', profile.id)
      .eq('completed', true)
      .order('logged_date', { ascending: false })

    if (!error) setLogs(data || [])
    setLoading(false)
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi historial</h1>
        <p className="text-sm text-gray-500">{logs.length} entrenamiento{logs.length !== 1 ? 's' : ''} completado{logs.length !== 1 ? 's' : ''}</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin entrenamientos aun"
          description="Completa tu primer entrenamiento y aparecera aca"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map(log => (
            <Card key={log.id} className="overflow-hidden">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{log.workout_days?.name || 'Entrenamiento'}</p>
                  <p className="text-xs text-gray-500 capitalize">{formatDate(log.logged_date)}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {log.assignments?.workouts?.name && (
                      <span className="text-xs text-blue-600">{log.assignments.workouts.name}</span>
                    )}
                    {log.duration_minutes && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {log.duration_minutes} min
                      </span>
                    )}
                    {log.rating && (
                      <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-500" /> {log.rating}/5
                      </span>
                    )}
                  </div>
                </div>
                {expanded === log.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </div>

              {expanded === log.id && log.exercise_logs?.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="mt-3 flex flex-col gap-2">
                    {log.exercise_logs.map(el => (
                      <div key={el.id} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-semibold text-gray-900">{el.exercises?.name}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>{el.sets_completed} series</span>
                          {el.reps_completed && <span>Reps: {el.reps_completed.join(', ')}</span>}
                          {el.weight_used?.some(w => w > 0) && (
                            <span>Peso: {el.weight_used.join(', ')} kg</span>
                          )}
                        </div>
                        {el.notes && <p className="text-xs text-gray-400 mt-1 italic">{el.notes}</p>}
                      </div>
                    ))}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-gray-500 mt-3 p-3 bg-blue-50 rounded-lg italic">{log.notes}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
