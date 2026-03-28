import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, Modal, LoadingSpinner, EmptyState, Select } from '../../components/ui'
import { ArrowLeft, Dumbbell, Calendar, CheckCircle2, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react'

export default function StudentDetail() {
  const { studentId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [logs, setLogs] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [assigning, setAssigning] = useState(false)
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    if (profile?.id && studentId) loadAll()
  }, [profile, studentId])

  async function loadAll() {
    const [studentRes, assignRes, logRes, workoutRes] = await Promise.all([
      supabase.from('student_profiles').select('*, profiles!inner(full_name, email)').eq('id', studentId).eq('trainer_id', profile.id).single(),
      supabase.from('assignments').select('*, workouts(name, days_per_week, duration_weeks)').eq('student_id', studentId).eq('trainer_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('workout_logs').select('*, workout_days(name, day_number), exercise_logs(*, exercises(name))').eq('student_id', studentId).order('logged_date', { ascending: false }).limit(20),
      supabase.from('workouts').select('id, name').eq('trainer_id', profile.id).order('created_at', { ascending: false })
    ])
    if (studentRes.data) setStudent(studentRes.data)
    if (assignRes.data) setAssignments(assignRes.data)
    if (logRes.data) setLogs(logRes.data)
    if (workoutRes.data) setWorkouts(workoutRes.data)
    setLoading(false)
  }

  async function assignWorkout() {
    if (!selectedWorkout) return
    setAssigning(true)
    const { error } = await supabase.from('assignments').insert({
      workout_id: selectedWorkout,
      student_id: studentId,
      trainer_id: profile.id,
      start_date: startDate,
      status: 'active',
      current_day: 1
    })
    setAssigning(false)
    if (!error) { setShowAssign(false); setSelectedWorkout(''); loadAll() }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!student) return <div className="text-center py-20 text-gray-500">Alumno no encontrado</div>

  const completedLogs = logs.filter(l => l.completed)
  const activeAssignment = assignments.find(a => a.status === 'active')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{student.profiles.full_name}</h1>
          <p className="text-sm text-gray-500">{student.profiles.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{completedLogs.length}</p>
          <p className="text-xs text-gray-500">Sesiones</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-blue-600">
            {completedLogs.filter(l => (new Date() - new Date(l.logged_date + 'T12:00:00')) < 7 * 86400000).length}
          </p>
          <p className="text-xs text-gray-500">Esta semana</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-purple-600">{assignments.length}</p>
          <p className="text-xs text-gray-500">Planes</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Plan asignado</h2>
          <Button size="sm" onClick={() => setShowAssign(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Asignar
          </Button>
        </div>
        {activeAssignment ? (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeAssignment.workouts.name}</p>
                <p className="text-xs text-gray-500">Dia {activeAssignment.current_day} - {activeAssignment.workouts.days_per_week} dias/semana</p>
              </div>
              <Badge variant="success" className="ml-auto">Activo</Badge>
            </div>
          </Card>
        ) : (
          <Card className="p-4"><p className="text-sm text-gray-500 text-center py-2">Sin plan activo</p></Card>
        )}
      </div>

      <div>
        <h2 className="font-bold text-gray-900 mb-3">Historial de entrenamientos</h2>
        {logs.length === 0 ? (
          <EmptyState icon={Calendar} title="Sin entrenamientos aun" description="Cuando el alumno entrene, aparecera aca" />
        ) : (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 10).map(log => (
              <Card key={log.id} className="overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {log.completed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.workout_days?.name || 'Dia ' + log.workout_days?.day_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(log.logged_date)}</p>
                  </div>
                  {log.duration_minutes && <span className="text-xs text-gray-400">{log.duration_minutes} min</span>}
                  {expandedLog === log.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
                {expandedLog === log.id && log.exercise_logs?.length > 0 && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="mt-3 flex flex-col gap-2">
                      {log.exercise_logs.map(el => (
                        <div key={el.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-800">{el.exercises?.name}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>{el.sets_completed} series</span>
                            {el.reps_completed && <span>Reps: {el.reps_completed.join(', ')}</span>}
                            {el.weight_used && <span>Peso: {el.weight_used.join(', ')} kg</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {log.notes && <p className="text-xs text-gray-500 mt-3 italic">Nota: {log.notes}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Asignar plan"
        footer={<Button className="w-full" onClick={assignWorkout} disabled={!selectedWorkout || assigning}>{assigning ? 'Asignando...' : 'Asignar plan'}</Button>}
      >
        <div className="flex flex-col gap-4">
          {workouts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tenes planes creados. Crea uno primero.</p>
          ) : (
            <>
              <Select label="Plan" value={selectedWorkout} onChange={e => setSelectedWorkout(e.target.value)}>
                <option value="">Seleccionar plan...</option>
                {workouts.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
