import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { ArrowLeft, Plus, Trash2, ChevronRight, ChevronLeft, Check, ChevronDown, ChevronUp, Dumbbell, CalendarPlus } from 'lucide-react'

const STEP_LABELS = ['Informacion', 'Sesiones']

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

function emptyExercise() {
  return { name: '', sets: 3, reps: '10', rest_seconds: 60, weight_prescribed: '', notes: '' }
}

export default function EditWorkout() {
  const { workoutId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedDay, setExpandedDay] = useState(0)
  const [removedExerciseIds, setRemovedExerciseIds] = useState([])

  const [info, setInfo] = useState({
    name: '',
    description: '',
    goal: '',
    duration_weeks: 4,
    days_per_week: 3,
    difficulty: 'intermediate'
  })

  const [days, setDays] = useState([])

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
      .select('*, exercises(*)')
      .eq('workout_id', workoutId)
      .order('day_number')

    if (w) {
      setInfo({
        name: w.name || '',
        description: w.description || '',
        goal: w.goal || '',
        duration_weeks: w.duration_weeks || 4,
        days_per_week: w.days_per_week || 3,
        difficulty: w.difficulty || 'intermediate'
      })
    }

    if (d) {
      setDays(d.map(day => ({
        id: day.id,
        name: day.name || '',
        focus: day.focus || '',
        notes: day.notes || '',
        scheduled_date: day.scheduled_date || '',
        exercises: (day.exercises || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map(ex => ({
            id: ex.id,
            name: ex.name || '',
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            rest_seconds: ex.rest_seconds || 60,
            weight_prescribed: ex.weight_prescribed || '',
            notes: ex.notes || ''
          }))
      })))
    }

    setLoading(false)
  }

  // Derived: how many complete weeks are loaded
  const weeksLoaded = days.length > 0 ? Math.ceil(days.length / info.days_per_week) : 0
  const totalWeeks = info.duration_weeks

  function addWeek() {
    const newDays = Array.from({ length: info.days_per_week }, () => ({
      name: '', focus: '', notes: '', scheduled_date: '', exercises: [emptyExercise()]
    }))
    const firstNewIdx = days.length
    setDays(d => [...d, ...newDays])
    setExpandedDay(firstNewIdx)
  }

  function removeDay(idx) {
    setDays(d => d.filter((_, i) => i !== idx))
    setExpandedDay(prev => (prev >= idx ? Math.max(0, prev - 1) : prev))
  }

  function updateDay(idx, field, value) {
    setDays(d => d.map((dd, i) => i === idx ? { ...dd, [field]: value } : dd))
  }

  function addExercise(dayIdx) {
    setDays(d => d.map((dd, i) => i === dayIdx
      ? { ...dd, exercises: [...dd.exercises, emptyExercise()] }
      : dd
    ))
  }

  function removeExercise(dayIdx, exIdx) {
    const ex = days[dayIdx].exercises[exIdx]
    if (ex.id) {
      setRemovedExerciseIds(ids => [...ids, ex.id])
    }
    setDays(d => d.map((dd, i) => i === dayIdx
      ? { ...dd, exercises: dd.exercises.filter((_, j) => j !== exIdx) }
      : dd
    ))
  }

  function updateExercise(dayIdx, exIdx, field, value) {
    setDays(d => d.map((dd, i) => i === dayIdx
      ? { ...dd, exercises: dd.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) }
      : dd
    ))
  }

  function validateStep() {
    if (step === 0) {
      if (!info.name.trim()) { setError('El nombre del plan es requerido'); return false }
    }
    if (step === 1) {
      if (days.some(d => !d.name.trim())) { setError('Todas las sesiones necesitan un nombre'); return false }
      const allHaveExercises = days.every(d => d.exercises.length > 0 && d.exercises.every(ex => ex.name.trim()))
      if (!allHaveExercises) { setError('Todos los ejercicios necesitan un nombre'); return false }
    }
    setError('')
    return true
  }

  function nextStep() {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  async function handleSave() {
    if (!validateStep()) return
    setSaving(true)
    setError('')

    try {
      // Update workout info
      const { error: wErr } = await supabase
        .from('workouts')
        .update({
          name: info.name,
          description: info.description || null,
          goal: info.goal || null,
          duration_weeks: info.duration_weeks,
          days_per_week: info.days_per_week,
          difficulty: info.difficulty
        })
        .eq('id', workoutId)

      if (wErr) throw wErr

      // Process days
      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        let dayId = day.id

        if (dayId) {
          // Update existing day
          await supabase
            .from('workout_days')
            .update({
              name: day.name || `Sesion ${i + 1}`,
              focus: day.focus || null,
              notes: day.notes || null,
              scheduled_date: day.scheduled_date || null
            })
            .eq('id', dayId)
        } else {
          // Insert new day
          const { data: newDay, error: dErr } = await supabase
            .from('workout_days')
            .insert({
              workout_id: workoutId,
              day_number: i + 1,
              name: day.name || `Sesion ${i + 1}`,
              focus: day.focus || null,
              notes: day.notes || null,
              scheduled_date: day.scheduled_date || null
            })
            .select()
            .single()
          if (dErr) throw dErr
          dayId = newDay.id
        }

        // Process exercises for this day
        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j]
          if (ex.id) {
            // Update existing exercise
            await supabase
              .from('exercises')
              .update({
                name: ex.name,
                sets: Number(ex.sets),
                reps: ex.reps,
                rest_seconds: Number(ex.rest_seconds),
                weight_prescribed: ex.weight_prescribed || null,
                notes: ex.notes || null
              })
              .eq('id', ex.id)
          } else {
            // Insert new exercise
            await supabase
              .from('exercises')
              .insert({
                workout_day_id: dayId,
                order_index: j + 1,
                name: ex.name,
                sets: Number(ex.sets),
                reps: ex.reps,
                rest_seconds: Number(ex.rest_seconds),
                weight_prescribed: ex.weight_prescribed || null,
                notes: ex.notes || null
              })
          }
        }
      }

      // Delete removed exercises (silently)
      if (removedExerciseIds.length > 0) {
        await supabase.from('exercises').delete().in('id', removedExerciseIds)
      }

      navigate(`/trainer/workouts/${workoutId}`)
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'intenta de nuevo'))
    }
    setSaving(false)
  }

  // Group days by week for rendering
  function getWeekGroups() {
    const groups = []
    for (let w = 0; w < weeksLoaded; w++) {
      const start = w * info.days_per_week
      const end = start + info.days_per_week
      groups.push({ week: w + 1, days: days.slice(start, end).map((d, i) => ({ ...d, globalIdx: start + i })) })
    }
    return groups
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(`/trainer/workouts/${workoutId}`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Editar plan</h1>
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

      {/* Step 1: Sessions grouped by week */}
      {step === 1 && (
        <div className="flex flex-col gap-5">

          {/* Progress bar */}
          <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Semanas cargadas</span>
                <span className="font-semibold text-gray-700">{weeksLoaded} / {totalWeeks}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min((weeksLoaded / totalWeeks) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Week groups */}
          {getWeekGroups().map(({ week, days: weekDays }) => (
            <div key={week}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-bold text-gray-500 px-2">SEMANA {week}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex flex-col gap-3">
                {weekDays.map(({ globalIdx, ...day }) => (
                  <Card key={globalIdx} className="overflow-hidden">
                    {/* Day header */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{globalIdx + 1}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Sesion {globalIdx + 1}</span>
                        {/* Only allow deleting days that don't have an id (new days) */}
                        {!day.id && days.length > info.days_per_week && (
                          <button onClick={() => removeDay(globalIdx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 ml-auto">
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
                            onChange={e => updateDay(globalIdx, 'scheduled_date', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          />
                        </div>
                        <Input
                          label="Nombre de la sesion"
                          placeholder="Ej: Pierna, Push, Pull, Full Body..."
                          value={day.name}
                          onChange={e => updateDay(globalIdx, 'name', e.target.value)}
                        />
                        <Input
                          label="Focus (opcional)"
                          placeholder="Ej: Fuerza, Volumen, Resistencia..."
                          value={day.focus}
                          onChange={e => updateDay(globalIdx, 'focus', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Exercises toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedDay(expandedDay === globalIdx ? null : globalIdx)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-blue-500" />
                        {day.exercises.filter(ex => ex.name.trim()).length > 0
                          ? `${day.exercises.filter(ex => ex.name.trim()).length} ejercicio${day.exercises.filter(ex => ex.name.trim()).length !== 1 ? 's' : ''}`
                          : 'Agregar ejercicios'}
                      </span>
                      {expandedDay === globalIdx
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {/* Exercises list */}
                    {expandedDay === globalIdx && (
                      <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs text-gray-400 font-medium mt-3 w-5 flex-shrink-0">{exIdx + 1}.</span>
                              <Input
                                placeholder="Nombre del ejercicio *"
                                value={ex.name}
                                onChange={e => updateExercise(globalIdx, exIdx, 'name', e.target.value)}
                                className="flex-1"
                              />
                              {day.exercises.length > 1 && (
                                <button onClick={() => removeExercise(globalIdx, exIdx)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 mt-0.5 flex-shrink-0">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Series</label>
                                <input type="number" min={1} max={20} value={ex.sets}
                                  onChange={e => updateExercise(globalIdx, exIdx, 'sets', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Reps</label>
                                <input type="text" placeholder="10 o 8-12" value={ex.reps}
                                  onChange={e => updateExercise(globalIdx, exIdx, 'reps', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Descanso (seg)</label>
                                <input type="number" min={0} max={600} value={ex.rest_seconds}
                                  onChange={e => updateExercise(globalIdx, exIdx, 'rest_seconds', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Peso sugerido</label>
                                <input type="text" placeholder="Ej: 50kg, RPE 7" value={ex.weight_prescribed}
                                  onChange={e => updateExercise(globalIdx, exIdx, 'weight_prescribed', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white" />
                              </div>
                            </div>
                            <div className="mt-2">
                              <input type="text" placeholder="Notas para el alumno (opcional)"
                                value={ex.notes}
                                onChange={e => updateExercise(globalIdx, exIdx, 'notes', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-400" />
                            </div>
                          </div>
                        ))}
                        <Button variant="secondary" size="sm" onClick={() => addExercise(globalIdx)} className="w-full">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar ejercicio
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Add next week button */}
          {weeksLoaded < totalWeeks && (
            <button
              type="button"
              onClick={addWeek}
              className="w-full border-2 border-dashed border-blue-200 rounded-xl p-4 flex items-center justify-center gap-2 text-blue-600 font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Agregar Semana {weeksLoaded + 1} ({info.days_per_week} sesiones más)
            </button>
          )}

          {weeksLoaded >= totalWeeks && (
            <div className="text-center text-xs text-green-600 font-medium bg-green-50 rounded-xl p-3">
              Plan completo — {totalWeeks} semana{totalWeeks !== 1 ? 's' : ''} cargadas
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pb-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
        )}
        {step < 1 ? (
          <Button onClick={nextStep} className="flex-1">
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </div>
    </div>
  )
}
