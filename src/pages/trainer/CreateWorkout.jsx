import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Button, Input, Select, Textarea } from '../../components/ui'
import { ArrowLeft, Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react'

const STEP_LABELS = ['Informacion', 'Dias', 'Ejercicios']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
            ${i < current ? 'bg-green-500 text-white' : i === current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
          {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-0.5 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function CreateWorkout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [info, setInfo] = useState({
    name: '',
    description: '',
    goal: '',
    duration_weeks: 4,
    days_per_week: 3,
    difficulty: 'intermediate'
  })

  // Step 2: days
  const [days, setDays] = useState([{ name: '', focus: '', notes: '', scheduled_date: '' }])

  // Step 3: exercises per day
  const [exercises, setExercises] = useState([[
    { name: '', sets: 3, reps: '10', rest_seconds: 60, weight_prescribed: '', notes: '' }
  ]])

  function addDay() {
    setDays(d => [...d, { name: '', focus: '', notes: '', scheduled_date: '' }])
    setExercises(e => [...e, [{ name: '', sets: 3, reps: '10', rest_seconds: 60, weight_prescribed: '', notes: '' }]])
  }

  function removeDay(idx) {
    setDays(d => d.filter((_, i) => i !== idx))
    setExercises(e => e.filter((_, i) => i !== idx))
  }

  function addExercise(dayIdx) {
    setExercises(e => {
      const copy = e.map(day => [...day])
      copy[dayIdx] = [...copy[dayIdx], { name: '', sets: 3, reps: '10', rest_seconds: 60, weight_prescribed: '', notes: '' }]
      return copy
    })
  }

  function removeExercise(dayIdx, exIdx) {
    setExercises(e => {
      const copy = e.map(day => [...day])
      copy[dayIdx] = copy[dayIdx].filter((_, i) => i !== exIdx)
      return copy
    })
  }

  function updateExercise(dayIdx, exIdx, field, value) {
    setExercises(e => {
      const copy = e.map(day => [...day])
      copy[dayIdx] = copy[dayIdx].map((ex, i) => i === exIdx ? { ...ex, [field]: value } : ex)
      return copy
    })
  }

  function validateStep() {
    if (step === 0) {
      if (!info.name.trim()) { setError('El nombre del plan es requerido'); return false }
    }
    if (step === 1) {
      if (days.some(d => !d.name.trim())) { setError('Todos los dias necesitan un nombre'); return false }
    }
    if (step === 2) {
      const allHaveExercises = exercises.every(dayExs => dayExs.length > 0 && dayExs.every(ex => ex.name.trim()))
      if (!allHaveExercises) { setError('Todos los ejercicios necesitan un nombre'); return false }
    }
    setError('')
    return true
  }

  function nextStep() {
    if (validateStep()) setStep(s => s + 1)
  }

  async function handleSave() {
    if (!validateStep()) return
    setSaving(true)
    setError('')

    try {
      // Insert workout
      const { data: workout, error: wErr } = await supabase
        .from('workouts')
        .insert({ ...info, trainer_id: profile.id })
        .select()
        .single()

      if (wErr) throw wErr

      // Insert days
      const dayInserts = days.map((d, i) => ({
        workout_id: workout.id,
        day_number: i + 1,
        name: d.name || `Dia ${i + 1}`,
        focus: d.focus || null,
        notes: d.notes || null,
        scheduled_date: d.scheduled_date || null
      }))

      const { data: insertedDays, error: dErr } = await supabase
        .from('workout_days')
        .insert(dayInserts)
        .select()

      if (dErr) throw dErr

      // Insert exercises
      const exInserts = []
      insertedDays.forEach((day, dayIdx) => {
        exercises[dayIdx].forEach((ex, exIdx) => {
          exInserts.push({
            workout_day_id: day.id,
            order_index: exIdx + 1,
            name: ex.name,
            sets: Number(ex.sets),
            reps: ex.reps,
            rest_seconds: Number(ex.rest_seconds),
            weight_prescribed: ex.weight_prescribed || null,
            notes: ex.notes || null
          })
        })
      })

      const { error: eErr } = await supabase.from('exercises').insert(exInserts)
      if (eErr) throw eErr

      navigate('/trainer/workouts')
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'intenta de nuevo'))
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Crear plan</h1>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Step 0: Info */}
      {step === 0 && (
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Informacion del plan</h2>
          <div className="flex flex-col gap-4">
            <Input label="Nombre del plan *" placeholder="Ej: Hipertrofia Principiante" value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
            <Textarea label="Descripcion" placeholder="Descripcion opcional del plan..." value={info.description} onChange={e => setInfo(i => ({ ...i, description: e.target.value }))} />
            <Input label="Objetivo" placeholder="Ej: Ganar masa muscular" value={info.goal} onChange={e => setInfo(i => ({ ...i, goal: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Duracion (semanas)</label>
                <input type="number" min={1} max={52} value={info.duration_weeks}
                  onChange={e => setInfo(i => ({ ...i, duration_weeks: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Dias por semana</label>
                <input type="number" min={1} max={7} value={info.days_per_week}
                  onChange={e => setInfo(i => ({ ...i, days_per_week: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
              </div>
            </div>
            <Select label="Nivel de dificultad" value={info.difficulty} onChange={e => setInfo(i => ({ ...i, difficulty: e.target.value }))}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </Select>
          </div>
        </Card>
      )}

      {/* Step 1: Days */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">Asigna la fecha y nombre a cada sesion de entrenamiento.</p>
          {days.map((day, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">{idx + 1}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">Sesion {idx + 1}</span>
                {days.length > 1 && (
                  <button onClick={() => removeDay(idx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Fecha del entrenamiento</label>
                  <input
                    type="date"
                    value={day.scheduled_date}
                    onChange={e => setDays(d => d.map((dd, i) => i === idx ? { ...dd, scheduled_date: e.target.value } : dd))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <Input
                  label="Nombre de la sesion"
                  placeholder="Ej: Pierna, Push, Pull, Full Body..."
                  value={day.name}
                  onChange={e => setDays(d => d.map((dd, i) => i === idx ? { ...dd, name: e.target.value } : dd))}
                />
                <Input
                  label="Focus (opcional)"
                  placeholder="Ej: Fuerza, Volumen, Resistencia..."
                  value={day.focus}
                  onChange={e => setDays(d => d.map((dd, i) => i === idx ? { ...dd, focus: e.target.value } : dd))}
                />
              </div>
            </Card>
          ))}
          <Button variant="secondary" onClick={addDay} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Agregar sesion
          </Button>
        </div>
      )}

      {/* Step 2: Exercises */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {days.map((day, dayIdx) => (
            <div key={dayIdx}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">{dayIdx + 1}</span>
                </div>
                <h3 className="font-bold text-gray-900">{day.name}</h3>
              </div>

              <div className="flex flex-col gap-2">
                {exercises[dayIdx]?.map((ex, exIdx) => (
                  <Card key={exIdx} className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs text-gray-400 font-medium mt-3 w-5 flex-shrink-0">{exIdx + 1}.</span>
                      <Input
                        placeholder="Nombre del ejercicio *"
                        value={ex.name}
                        onChange={e => updateExercise(dayIdx, exIdx, 'name', e.target.value)}
                        className="flex-1"
                      />
                      {exercises[dayIdx].length > 1 && (
                        <button onClick={() => removeExercise(dayIdx, exIdx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Series</label>
                        <input type="number" min={1} max={20} value={ex.sets}
                          onChange={e => updateExercise(dayIdx, exIdx, 'sets', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Reps</label>
                        <input type="text" placeholder="10 o 8-12" value={ex.reps}
                          onChange={e => updateExercise(dayIdx, exIdx, 'reps', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Descanso (seg)</label>
                        <input type="number" min={0} max={600} value={ex.rest_seconds}
                          onChange={e => updateExercise(dayIdx, exIdx, 'rest_seconds', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Peso sugerido</label>
                        <input type="text" placeholder="Ej: 50kg, RPE 7" value={ex.weight_prescribed}
                          onChange={e => updateExercise(dayIdx, exIdx, 'weight_prescribed', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <input type="text" placeholder="Notas para el alumno (opcional)"
                        value={ex.notes}
                        onChange={e => updateExercise(dayIdx, exIdx, 'notes', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-400" />
                    </div>
                  </Card>
                ))}
                <Button variant="secondary" size="sm" onClick={() => addExercise(dayIdx)} className="w-full">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar ejercicio
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pb-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={nextStep} className="flex-1">
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : 'Guardar plan'}
          </Button>
        )}
      </div>
    </div>
  )
}
