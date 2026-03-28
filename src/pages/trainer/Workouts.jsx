import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '../../components/ui'
import { Dumbbell, Plus, ChevronRight, Users, Calendar } from 'lucide-react'

export default function Workouts() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) loadWorkouts()
  }, [profile])

  async function loadWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select('*, workout_days(count), assignments(count)')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setWorkouts(data || [])
    setLoading(false)
  }

  function difficultyLabel(d) {
    const map = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
    return map[d] || d
  }
  function difficultyVariant(d) {
    const map = { beginner: 'success', intermediate: 'info', advanced: 'danger' }
    return map[d] || 'default'
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis planes</h1>
          <p className="text-sm text-gray-500">{workouts.length} plan{workouts.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => navigate('/trainer/workouts/new')} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Crear plan
        </Button>
      </div>

      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Sin planes aun"
          description="Crea tu primer plan de entrenamiento y asignalo a tus alumnos"
          action={
            <Button onClick={() => navigate('/trainer/workouts/new')}>
              <Plus className="w-4 h-4 mr-2" /> Crear primer plan
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map(workout => (
            <Card
              key={workout.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/trainer/workouts/${workout.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{workout.name}</p>
                    {workout.difficulty && (
                      <Badge variant={difficultyVariant(workout.difficulty)}>
                        {difficultyLabel(workout.difficulty)}
                      </Badge>
                    )}
                  </div>
                  {workout.goal && <p className="text-xs text-gray-500 mb-2 truncate">{workout.goal}</p>}
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {workout.days_per_week} dias/sem
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {workout.assignments?.[0]?.count || 0} alumnos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
