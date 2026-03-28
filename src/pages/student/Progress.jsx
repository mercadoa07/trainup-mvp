import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, LoadingSpinner, EmptyState } from '../../components/ui'
import { TrendingUp, BarChart2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Progress() {
  const { profile } = useAuth()
  const [exerciseData, setExerciseData] = useState({})
  const [exercises, setExercises] = useState([])
  const [selectedEx, setSelectedEx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) loadProgress()
  }, [profile])

  async function loadProgress() {
    const { data: exLogs } = await supabase
      .from('exercise_logs')
      .select(`
        *,
        exercises(name),
        workout_logs(logged_date)
      `)
      .eq('student_id', profile.id)
      .order('created_at', { ascending: true })

    if (!exLogs || exLogs.length === 0) { setLoading(false); return }

    // Group by exercise name
    const grouped = {}
    exLogs.forEach(log => {
      const name = log.exercises?.name
      if (!name || !log.weight_used?.some(w => w > 0)) return
      if (!grouped[name]) grouped[name] = []

      const maxWeight = Math.max(...(log.weight_used || [0]))
      const date = log.workout_logs?.logged_date
      if (date && maxWeight > 0) {
        grouped[name].push({
          date,
          weight: maxWeight,
          label: new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
        })
      }
    })

    // Keep only exercises with at least 2 data points
    const validExercises = Object.keys(grouped).filter(k => grouped[k].length >= 2)
    setExerciseData(grouped)
    setExercises(validExercises)
    if (validExercises.length > 0) setSelectedEx(validExercises[0])
    setLoading(false)
  }

  const chartData = selectedEx ? exerciseData[selectedEx] || [] : []

  function maxWeight(data) {
    if (!data.length) return 0
    return Math.max(...data.map(d => d.weight))
  }
  function weightDiff(data) {
    if (data.length < 2) return 0
    return data[data.length - 1].weight - data[0].weight
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi progreso</h1>
        <p className="text-sm text-gray-500">Evolucion de peso por ejercicio</p>
      </div>

      {exercises.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin datos de progreso aun"
          description="Completa varios entrenamientos registrando el peso usado para ver tu evolucion"
        />
      ) : (
        <>
          {/* Exercise selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {exercises.map(ex => (
              <button
                key={ex}
                onClick={() => setSelectedEx(ex)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedEx === ex
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Stats */}
          {selectedEx && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{maxWeight(chartData)} kg</p>
                <p className="text-xs text-gray-500">Max registrado</p>
              </Card>
              <Card className="p-3 text-center">
                <p className={`text-lg font-bold ${weightDiff(chartData) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {weightDiff(chartData) >= 0 ? '+' : ''}{weightDiff(chartData)} kg
                </p>
                <p className="text-xs text-gray-500">Progreso total</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-lg font-bold text-purple-600">{chartData.length}</p>
                <p className="text-xs text-gray-500">Sesiones</p>
              </Card>
            </div>
          )}

          {/* Chart */}
          {selectedEx && chartData.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">{selectedEx}</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit=" kg" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value) => [value + ' kg', 'Peso']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#9333EA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
