import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, LoadingSpinner } from '../components/ui'
import { Dumbbell, CheckCircle2, AlertCircle, UserPlus, LogIn } from 'lucide-react'

const difficultyLabel = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }

export default function Join() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    if (!code) { setLoadingPlan(false); setPlanError(true); return }
    supabase.rpc('get_plan_by_join_code', { code }).then(({ data }) => {
      if (data) setPlan(data)
      else setPlanError(true)
      setLoadingPlan(false)
    })
  }, [code])

  useEffect(() => {
    if (!profile || !plan || profile.role !== 'student') return
    supabase.from('assignments')
      .select('id')
      .eq('student_id', profile.id)
      .eq('workout_id', plan.workout_id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => { if (data) setAlreadyJoined(true) })
  }, [profile, plan])

  async function handleJoin() {
    if (!profile || !plan) return
    setJoining(true)
    setJoinError('')
    try {
      // Link to trainer if not already linked
      const { data: sp } = await supabase.from('student_profiles').select('trainer_id').eq('id', profile.id).single()
      if (!sp?.trainer_id) {
        await supabase.from('student_profiles').update({ trainer_id: plan.trainer_id }).eq('id', profile.id)
      }
      // Create assignment
      const { error } = await supabase.from('assignments').insert({
        workout_id: plan.workout_id,
        student_id: profile.id,
        trainer_id: plan.trainer_id,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        current_day: 1
      })
      if (error) throw error
      setJoined(true)
    } catch (err) {
      setJoinError('Error al inscribirse. Intenta de nuevo.')
    }
    setJoining(false)
  }

  if (loadingPlan || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (planError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link inválido</h2>
          <p className="text-sm text-gray-500">Este link no existe o ya no está disponible.</p>
        </div>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Inscripto!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Ya formas parte del plan <strong>{plan.name}</strong> con {plan.trainer_name}.
          </p>
          <Button onClick={() => navigate('/student')} className="w-full">Ir a mi entrenamiento</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TrainUp</h1>
          <p className="text-sm text-gray-500 mt-1">Tu entrenador te invita a su plan</p>
        </div>

        <Card className="overflow-hidden mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-5 text-white">
            <p className="text-blue-100 text-xs mb-1">Plan de entrenamiento</p>
            <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
            <p className="text-blue-100 text-sm">por {plan.trainer_name}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {plan.difficulty && <Badge className="bg-white/20 text-white border-0 text-xs">{difficultyLabel[plan.difficulty] || plan.difficulty}</Badge>}
              <Badge className="bg-white/20 text-white border-0 text-xs">{plan.days_per_week} días/sem</Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">{plan.duration_weeks} semanas</Badge>
            </div>
          </div>
          {(plan.description || plan.goal) && (
            <div className="p-4">
              {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
              {plan.goal && !plan.description && <p className="text-sm text-gray-500">Objetivo: {plan.goal}</p>}
            </div>
          )}
        </Card>

        {joinError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{joinError}
          </div>
        )}

        {/* Logged in as student */}
        {profile?.role === 'student' && (
          <div className="flex flex-col gap-3">
            {alreadyJoined ? (
              <>
                <div className="p-3 bg-green-50 rounded-xl text-sm text-green-700 text-center font-medium">
                  Ya estás inscripto en este plan
                </div>
                <Button onClick={() => navigate('/student')} className="w-full">Ir a mi entrenamiento</Button>
              </>
            ) : (
              <Button onClick={handleJoin} disabled={joining} size="lg" className="w-full">
                {joining ? 'Inscribiendo...' : 'Inscribirme en este plan'}
              </Button>
            )}
          </div>
        )}

        {/* Logged in as trainer */}
        {profile?.role === 'trainer' && (
          <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700 text-center">
            Este link es para que tus alumnos se inscriban.
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(`/signup?invite=${plan.invite_code}&joinCode=${code}`)}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Registrarme e inscribirme
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login', { state: { from: { pathname: '/join', search: `?code=${code}` } } })}
            >
              <LogIn className="w-4 h-4 mr-2" /> Ya tengo cuenta
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
