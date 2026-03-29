import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, LoadingSpinner, Modal, Select } from '../../components/ui'
import { ArrowLeft, Dumbbell, ChevronDown, ChevronUp, Clock, BarChart2, Pencil, Share2, Check, MessageCircle } from 'lucide-react'

function formatWaPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('54')) return digits
  if (digits.startsWith('0')) return '54' + digits.slice(1)
  if (digits.length <= 10) return '54' + digits
  return digits
}

function buildPlanMessage(workout, days, studentName) {
  const lines = [
    `Hola ${studentName}! 💪`,
    '',
    `Te comparto tu plan de entrenamiento:`,
    '',
    `📋 *${workout.name}*`,
    workout.goal ? `🎯 ${workout.goal}` : null,
    `📅 ${workout.duration_weeks} semanas · ${workout.days_per_week} días por semana`,
    '',
  ].filter(l => l !== null)

  days.forEach((day, i) => {
    lines.push(`*Sesión ${i + 1}: ${day.name}*${day.focus ? ` — ${day.focus}` : ''}${day.scheduled_date ? `\n📆 ${new Date(day.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}`)
    day.exercises?.forEach((ex, j) => {
      lines.push(`  ${j + 1}. ${ex.name} — ${ex.sets}x${ex.reps}${ex.weight_prescribed ? ` · ${ex.weight_prescribed}` : ''}`)
    })
    lines.push('')
  })

  lines.push('¡A entrenar! 🏋️ _TrainUp_')
  return lines.join('\n')
}

function buildSessionMessage(day, studentName) {
  const lines = [
    `Hola ${studentName}! 💪`,
    '',
    `Tu próxima sesión:`,
    '',
    `💪 *${day.name}*${day.focus ? ` — ${day.focus}` : ''}`,
    day.scheduled_date ? `📅 ${new Date(day.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : null,
    '',
    'Ejercicios:',
  ].filter(l => l !== null)

  day.exercises?.forEach((ex, i) => {
    lines.push(`${i + 1}. *${ex.name}* — ${ex.sets} series x ${ex.reps} reps${ex.weight_prescribed ? ` · ${ex.weight_prescribed}` : ''}${ex.rest_seconds ? ` · ${ex.rest_seconds}s descanso` : ''}`)
    if (ex.notes) lines.push(`   _${ex.notes}_`)
  })

  lines.push('')
  lines.push('¡Mucho ánimo! 🏋️ _TrainUp_')
  return lines.join('\n')
}

export default function WorkoutDetail() {
  const { workoutId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(0)
  const [copied, setCopied] = useState(false)

  // WhatsApp modal state
  const [showWa, setShowWa] = useState(false)
  const [students, setStudents] = useState([])
  const [waStudentId, setWaStudentId] = useState('')
  const [waType, setWaType] = useState('plan') // 'plan' or day id

  function copyJoinLink() {
    if (!workout?.join_code) return
    navigator.clipboard.writeText(`${window.location.origin}/join?code=${workout.join_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (workoutId) loadWorkout()
  }, [workoutId])

  useEffect(() => {
    if (!showWa || !profile?.id) return
    supabase
      .from('student_profiles')
      .select('id, profiles!student_profiles_id_fkey(full_name, phone)')
      .eq('trainer_id', profile.id)
      .then(({ data }) => {
        if (data) setStudents(data)
        if (data?.length) setWaStudentId(data[0].id)
      })
  }, [showWa, profile?.id])

  async function loadWorkout() {
    const { data: w } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('trainer_id', profile.id)
      .single()

    const { data: d } = await supabase
      .from('workout_days')
      .select('*, exercises(*)')
      .eq('workout_id', workoutId)
      .order('day_number')

    if (w) setWorkout(w)
    if (d) setDays(d.map(day => ({ ...day, exercises: (day.exercises || []).sort((a, b) => a.order_index - b.order_index) })))
    setLoading(false)
  }

  function sendWhatsApp() {
    const student = students.find(s => s.id === waStudentId)
    if (!student) return
    const phone = formatWaPhone(student.profiles?.phone)
    const name = student.profiles?.full_name || 'alumno'

    let message
    if (waType === 'plan') {
      message = buildPlanMessage(workout, days, name)
    } else {
      const day = days.find(d => d.id === waType)
      if (!day) return
      message = buildSessionMessage(day, name)
    }

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    setShowWa(false)
  }

  function difficultyLabel(d) {
    const map = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
    return map[d] || d
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!workout) return <div className="text-center py-20 text-gray-500">Plan no encontrado</div>

  const selectedStudent = students.find(s => s.id === waStudentId)
  const hasPhone = !!selectedStudent?.profiles?.phone

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
        <button onClick={() => setShowWa(true)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 flex-shrink-0" title="Enviar por WhatsApp">
          <MessageCircle className="w-4 h-4 text-green-600" />
        </button>
        <button onClick={copyJoinLink} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 flex-shrink-0" title="Copiar link de inscripción">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-gray-600" />}
        </button>
        <button onClick={() => navigate(`/trainer/workouts/${workoutId}/edit`)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 flex-shrink-0" title="Editar plan">
          <Pencil className="w-4 h-4 text-gray-600" />
        </button>
      </div>

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

      <div className="flex flex-col gap-2">
        {days.map((day, idx) => (
          <Card key={day.id} className="overflow-hidden">
            <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedDay(expandedDay === idx ? -1 : idx)}>
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
                            {ex.rest_seconds && <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> {ex.rest_seconds}s descanso</span>}
                            {ex.weight_prescribed && <span className="text-xs text-gray-500">Peso: {ex.weight_prescribed}</span>}
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

      {/* WhatsApp modal */}
      <Modal isOpen={showWa} onClose={() => setShowWa(false)} title="Enviar por WhatsApp"
        footer={
          <Button className="w-full" onClick={sendWhatsApp} disabled={!waStudentId}>
            <MessageCircle className="w-4 h-4 mr-2" /> Abrir WhatsApp
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {students.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tenés alumnos aún.</p>
          ) : (
            <>
              <Select label="Alumno" value={waStudentId} onChange={e => setWaStudentId(e.target.value)}>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                ))}
              </Select>

              {waStudentId && !hasPhone && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-700">
                  Este alumno no tiene número de WhatsApp guardado. Se abrirá WhatsApp sin destinatario.
                </div>
              )}

              <Select label="Qué enviar" value={waType} onChange={e => setWaType(e.target.value)}>
                <option value="plan">Plan completo ({days.length} sesiones)</option>
                {days.map(d => (
                  <option key={d.id} value={d.id}>Sesión: {d.name}{d.scheduled_date ? ` — ${new Date(d.scheduled_date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}` : ''}</option>
                ))}
              </Select>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
