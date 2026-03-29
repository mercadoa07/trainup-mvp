import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Button, Modal } from '../../components/ui'
import { ChevronLeft, ChevronRight, Plus, Minus, Check, CheckCircle2, X, Star, Timer } from 'lucide-react'

function RestTimer({ seconds, onDismiss }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) { onDismiss(); return }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining])

  // Vibrate at 0
  useEffect(() => {
    if (remaining === 0 && navigator.vibrate) navigator.vibrate([200, 100, 200])
  }, [remaining])

  const pct = (remaining / seconds) * 100
  const radius = 40
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={onDismiss}>
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 w-64" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Descanso</p>
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={remaining <= 5 ? '#ef4444' : '#3b82f6'}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${remaining <= 5 ? 'text-red-500' : 'text-gray-900'}`}>
              {remaining}
            </span>
          </div>
        </div>
        <button onClick={onDismiss} className="text-sm text-blue-600 font-medium hover:underline">
          Saltar descanso
        </button>
      </div>
    </div>
  )
}

// Stepper number input for gym use (big buttons)
function NumberStepper({ value, onChange, min = 0, max = 999, step = 1, label, suffix = '' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number(value) - step))}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 active:bg-gray-200 font-bold text-lg"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-16 text-center text-xl font-bold text-gray-900 bg-transparent border-0 outline-none py-1"
          inputMode="numeric"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, Number(value) + step))}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 active:bg-gray-200 font-bold text-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
    </div>
  )
}

function getSavedWorkout() {
  try { return JSON.parse(sessionStorage.getItem('activeWorkout') || 'null') } catch { return null }
}

export default function WorkoutLog() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const locationState = location.state || {}
  const savedWorkout = getSavedWorkout()
  const assignment = locationState.assignment || savedWorkout?.assignment
  const todayDay = locationState.todayDay || savedWorkout?.todayDay

  const startTimeRef = useRef(Date.now())
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [exerciseLogs, setExerciseLogs] = useState([])
  const [showFinish, setShowFinish] = useState(false)
  const [rating, setRating] = useState(0)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [restTimer, setRestTimer] = useState(null) // seconds or null

  const exercises = todayDay?.exercises || []

  useEffect(() => {
    if (!assignment || !todayDay) {
      navigate('/student', { replace: true })
      return
    }
    // Persist to sessionStorage so a reload recovers the session
    sessionStorage.setItem('activeWorkout', JSON.stringify({ assignment, todayDay }))
    // Initialize logs for each exercise
    setExerciseLogs(exercises.map(ex => ({
      exercise_id: ex.id,
      name: ex.name,
      sets_completed: ex.sets || 3,
      sets: Array.from({ length: ex.sets || 3 }, () => ({ reps: Number(ex.reps) || 10, weight: 0, done: false })),
      notes: ''
    })))
  }, [])

  if (!assignment || !todayDay) return null

  const currentEx = exercises[currentExIdx]
  const currentLog = exerciseLogs[currentExIdx]

  function updateSet(setIdx, field, value) {
    setExerciseLogs(logs => logs.map((log, i) => {
      if (i !== currentExIdx) return log
      const newSets = log.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s)
      return { ...log, sets: newSets }
    }))
  }

  function markSetDone(setIdx) {
    let wasNotDone = false
    setExerciseLogs(logs => logs.map((log, i) => {
      if (i !== currentExIdx) return log
      const newSets = log.sets.map((s, si) => {
        if (si !== setIdx) return s
        wasNotDone = !s.done
        return { ...s, done: !s.done }
      })
      return { ...log, sets: newSets }
    }))
    // Start rest timer only when marking as done (not when unmarking)
    if (wasNotDone) {
      const restSecs = currentEx?.rest_seconds
      if (restSecs && restSecs > 0) setRestTimer(restSecs)
    }
  }

  function addSet() {
    setExerciseLogs(logs => logs.map((log, i) => {
      if (i !== currentExIdx) return log
      const lastSet = log.sets[log.sets.length - 1] || { reps: 10, weight: 0, done: false }
      return { ...log, sets: [...log.sets, { reps: lastSet.reps, weight: lastSet.weight, done: false }] }
    }))
  }

  function removeSet() {
    setExerciseLogs(logs => logs.map((log, i) => {
      if (i !== currentExIdx || log.sets.length <= 1) return log
      return { ...log, sets: log.sets.slice(0, -1) }
    }))
  }

  function updateNotes(notes) {
    setExerciseLogs(logs => logs.map((log, i) => i === currentExIdx ? { ...log, notes } : log))
  }

  const allDone = exerciseLogs.length > 0 && exerciseLogs.every(log => log.sets.some(s => s.done))
  const currentProgress = currentExIdx + 1

  async function finishWorkout() {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const durationMinutes = Math.round((Date.now() - startTimeRef.current) / 60000)

    try {
      // Create workout log
      const { data: wLog, error: wErr } = await supabase
        .from('workout_logs')
        .insert({
          assignment_id: assignment.id,
          workout_day_id: todayDay.id,
          student_id: profile.id,
          logged_date: today,
          completed: true,
          duration_minutes: durationMinutes,
          rating: rating || null,
          notes: workoutNotes || null
        })
        .select()
        .single()

      if (wErr) throw wErr

      // Create exercise logs
      const exLogInserts = exerciseLogs.map(log => {
        const doneSets = log.sets.filter(s => s.done)
        const allSets = doneSets.length > 0 ? doneSets : log.sets
        return {
          workout_log_id: wLog.id,
          exercise_id: log.exercise_id,
          student_id: profile.id,
          sets_completed: allSets.length,
          reps_completed: allSets.map(s => s.reps),
          weight_used: allSets.map(s => s.weight),
          completed: doneSets.length > 0,
          notes: log.notes || null
        }
      })

      const { error: eErr } = await supabase.from('exercise_logs').insert(exLogInserts)
      if (eErr) throw eErr

      // Only advance current_day for cyclic plans (not date-based)
      if (!todayDay?.scheduled_date) {
        const { data: aData } = await supabase
          .from('assignments')
          .select('current_day, workouts(days_per_week)')
          .eq('id', assignment.id)
          .single()

        if (aData) {
          const totalDays = aData.workouts?.days_per_week || 1
          const nextDay = (aData.current_day % totalDays) + 1
          await supabase.from('assignments').update({ current_day: nextDay }).eq('id', assignment.id)
        }
      }

      sessionStorage.removeItem('activeWorkout')
      setSaved(true)
      setTimeout(() => navigate('/student', { replace: true }), 2000)
    } catch (err) {
      console.error(err)
      setSaveError('Error al guardar. Intentá de nuevo.')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Entrenamiento guardado!</h2>
          <p className="text-gray-500">Excelente trabajo. Sigue asi!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-500">{todayDay.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {exercises.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i < currentProgress ? 'bg-blue-600' : 'bg-gray-200'} ${i === currentExIdx ? 'w-6' : 'w-3'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400">{currentProgress}/{exercises.length}</span>
            </div>
          </div>
          {allDone && (
            <Button size="sm" onClick={() => setShowFinish(true)}>
              Terminar
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {currentLog && currentEx && (
          <div className="flex flex-col gap-5">
            {/* Exercise header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{currentEx.name}</h2>
              <p className="text-gray-500 text-sm mt-1">
                Objetivo: {currentEx.sets} x {currentEx.reps}
                {currentEx.weight_prescribed ? ' - ' + currentEx.weight_prescribed : ''}
              </p>
              {currentEx.notes && (
                <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">{currentEx.notes}</p>
              )}
            </div>

            {/* Sets */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-900">Series</span>
                <div className="flex gap-2">
                  <button onClick={removeSet} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={addSet} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {currentLog.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${set.done ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="text-sm font-bold text-gray-400 w-5 text-center">{setIdx + 1}</span>

                    <div className="flex-1 flex gap-4 justify-center">
                      <NumberStepper
                        label="Reps"
                        value={set.reps}
                        onChange={v => updateSet(setIdx, 'reps', v)}
                        min={0}
                        max={999}
                      />
                      <div className="w-px bg-gray-200" />
                      <NumberStepper
                        label="Peso (kg)"
                        value={set.weight}
                        onChange={v => updateSet(setIdx, 'weight', v)}
                        min={0}
                        max={999}
                        step={2.5}
                      />
                    </div>

                    <button
                      onClick={() => markSetDone(setIdx)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        set.done
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'bg-white border-2 border-gray-200 text-gray-300 hover:border-green-300'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notes */}
            <input
              type="text"
              placeholder="Notas de este ejercicio (opcional)..."
              value={currentLog.notes}
              onChange={e => updateNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-400"
            />

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentExIdx(i => Math.max(0, i - 1))}
                disabled={currentExIdx === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              {currentExIdx < exercises.length - 1 ? (
                <Button onClick={() => setCurrentExIdx(i => i + 1)} className="flex-1">
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => setShowFinish(true)} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Terminar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rest Timer */}
      {restTimer && <RestTimer seconds={restTimer} onDismiss={() => setRestTimer(null)} />}

      {/* Finish Modal */}
      <Modal
        isOpen={showFinish}
        onClose={() => setShowFinish(false)}
        title="Terminar entrenamiento"
        footer={
          <Button className="w-full" onClick={finishWorkout} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar entrenamiento'}
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <X className="w-4 h-4 flex-shrink-0" />{saveError}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Como te senti? (opcional)</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setRating(r => r === s ? 0 : s)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    s <= rating ? 'bg-yellow-100 scale-110' : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <Star className={`w-6 h-6 ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Notas del entrenamiento</p>
            <textarea
              value={workoutNotes}
              onChange={e => setWorkoutNotes(e.target.value)}
              placeholder="Como te fue? Algo para recordar..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-2">Resumen</p>
            {exerciseLogs.map(log => {
              const doneSets = log.sets.filter(s => s.done)
              return (
                <div key={log.exercise_id} className="flex items-center gap-2 py-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${doneSets.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-700">{log.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{doneSets.length} series completadas</span>
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
