import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button, Input, Select } from '../components/ui'
import { Dumbbell, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

const GOALS = [
  'Ganar masa muscular',
  'Perder peso',
  'Mejorar resistencia',
  'Aumentar fuerza',
  'Mejorar flexibilidad',
  'Salud general',
  'Rendimiento deportivo',
]

const EQUIPMENT = [
  { value: 'full_gym', label: 'Gimnasio completo' },
  { value: 'basic_gym', label: 'Gimnasio básico' },
  { value: 'home', label: 'En casa (con elementos)' },
  { value: 'bodyweight', label: 'Sin equipamiento' },
]

export default function SignUp() {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('invite')
  const refCode = searchParams.get('ref')
  const joinCode = searchParams.get('joinCode')

  const isStudent = !!inviteCode
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: isStudent ? 'student' : 'trainer'
  })

  const [physical, setPhysical] = useState({
    weight_kg: '',
    height_cm: '',
    fitness_level: 'beginner',
    goal: GOALS[0],
    injuries: '',
    equipment_access: 'full_gym'
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referrer, setReferrer] = useState(null)

  useEffect(() => {
    if (refCode) {
      supabase.rpc('get_referrer_info', { ref_code: refCode }).then(({ data }) => {
        if (data) setReferrer(data)
      })
    }
  }, [refCode])

  function validateStep1() {
    if (!form.fullName.trim()) { setError('El nombre es requerido'); return false }
    if (!form.email.trim()) { setError('El email es requerido'); return false }
    if (!form.phone.trim()) { setError('El WhatsApp es requerido'); return false }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return false }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return false }
    setError('')
    return true
  }

  function nextStep() {
    if (!validateStep1()) return
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Trainers submit from step 1, students from step 2
    if (form.role === 'student' && step === 1) {
      nextStep()
      return
    }
    if (form.role !== 'student' && !validateStep1()) return

    setLoading(true)

    const { error: signUpError } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
      role: form.role,
      inviteCode: inviteCode || null,
      refCode: refCode || null
    })

    if (signUpError) {
      setLoading(false)
      if (signUpError.message.includes('already registered')) setError('Este email ya está registrado')
      else setError(signUpError.message || 'Error al registrarse')
      return
    }

    // For students: auto sign-in and save physical data
    if (form.role === 'student') {
      const { data: signInData, error: signInError } = await signIn({ email: form.email, password: form.password })
      if (!signInError && signInData?.user) {
        await supabase.from('student_profiles').update({
          weight_kg: physical.weight_kg ? Number(physical.weight_kg) : null,
          height_cm: physical.height_cm ? Number(physical.height_cm) : null,
          fitness_level: physical.fitness_level,
          goals: [physical.goal],
          injuries: physical.injuries || null,
          equipment_access: physical.equipment_access
        }).eq('id', signInData.user.id)

        setLoading(false)
        navigate(joinCode ? `/join?code=${joinCode}` : '/student', { replace: true })
        return
      }
    }

    setLoading(false)
    setSuccess(true)
    setTimeout(() => navigate(joinCode ? `/login?joinCode=${joinCode}` : '/login'), 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-600 text-sm">Revisá tu email para confirmar tu cuenta. Te redirigimos al login...</p>
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
          {inviteCode
            ? <p className="text-sm text-blue-600 font-medium mt-1">Tu entrenador te invitó a unirte</p>
            : <p className="text-gray-500 text-sm mt-1">Creá tu cuenta gratis</p>}
        </div>

        {/* Step indicator for students */}
        {form.role === 'student' && (
          <div className="flex items-center gap-2 mb-4">
            {['Datos de acceso', 'Datos físicos'].map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
                {i < 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            {step === 1 ? 'Crear cuenta' : 'Tus datos físicos'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* STEP 1: Basic info */}
            {step === 1 && (
              <>
                <Input label="Nombre completo" type="text" placeholder="Juan Pérez"
                  value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
                <Input label="Email" type="email" placeholder="tu@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
                <Input label="WhatsApp" type="tel" placeholder="+54 9 11 1234-5678"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required autoComplete="tel" />
                <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="new-password" />
                <Input label="Confirmar contraseña" type="password" placeholder="Repetí tu contraseña"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required autoComplete="new-password" />

                {!inviteCode && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Soy</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['trainer', 'student'].map(r => (
                        <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                            form.role === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {r === 'trainer' ? 'Entrenador' : 'Alumno'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {inviteCode && (
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-600">
                    {joinCode
                      ? 'Te registras como alumno, quedás vinculado a tu entrenador e inscripto en el plan automáticamente.'
                      : 'Te registras como alumno y quedás vinculado a tu entrenador automáticamente.'}
                  </div>
                )}

                {refCode && !inviteCode && (
                  <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-600">
                    {referrer
                      ? <>Fuiste invitado por <strong>{referrer.full_name}</strong> ({referrer.role === 'trainer' ? 'Entrenador' : 'Alumno'}) a unirte a TrainUp.</>
                      : 'Fuiste invitado por alguien de la comunidad TrainUp.'}
                  </div>
                )}

                <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
                  {form.role === 'student'
                    ? <><span>Siguiente</span> <ChevronRight className="w-4 h-4 ml-1" /></>
                    : loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </>
            )}

            {/* STEP 2: Physical data (students only) */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
                    <input type="number" min="30" max="300" step="0.1" placeholder="70"
                      value={physical.weight_kg}
                      onChange={e => setPhysical(p => ({ ...p, weight_kg: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Estatura (cm)</label>
                    <input type="number" min="100" max="250" placeholder="170"
                      value={physical.height_cm}
                      onChange={e => setPhysical(p => ({ ...p, height_cm: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
                  </div>
                </div>

                <Select label="Nivel de condición física"
                  value={physical.fitness_level}
                  onChange={e => setPhysical(p => ({ ...p, fitness_level: e.target.value }))}>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </Select>

                <Select label="Objetivo principal"
                  value={physical.goal}
                  onChange={e => setPhysical(p => ({ ...p, goal: e.target.value }))}>
                  {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </Select>

                <Select label="Acceso a equipamiento"
                  value={physical.equipment_access}
                  onChange={e => setPhysical(p => ({ ...p, equipment_access: e.target.value }))}>
                  {EQUIPMENT.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
                </Select>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Lesiones o limitaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    placeholder="Ej: dolor de rodilla, hernia lumbar..."
                    value={physical.injuries}
                    onChange={e => setPhysical(p => ({ ...p, injuries: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none text-sm placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="secondary" onClick={() => { setStep(1); setError('') }} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creando...' : 'Crear cuenta'}
                  </Button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">Iniciar sesión</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
