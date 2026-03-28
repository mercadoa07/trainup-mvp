import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'
import { Dumbbell, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteCode = searchParams.get('invite')
  const refCode = searchParams.get('ref')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: inviteCode ? 'student' : 'trainer'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      role: form.role,
      inviteCode: inviteCode || null,
      refCode: refCode || null
    })
    setLoading(false)

    if (error) {
      if (error.message.includes('already registered')) setError('Este email ya está registrado')
      else setError(error.message || 'Error al registrarse')
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/login'), 3000)
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TrainUp</h1>
          {inviteCode ? (
            <p className="text-sm text-blue-600 font-medium mt-1">Tu entrenador te invitó a unirte</p>
          ) : (
            <p className="text-gray-500 text-sm mt-1">Creá tu cuenta gratis</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Crear cuenta</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mb-4 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetí tu contraseña"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              autoComplete="new-password"
            />

            {!inviteCode && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Soy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: 'trainer' }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === 'trainer'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Entrenador
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: 'student' }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === 'student'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Alumno
                  </button>
                </div>
              </div>
            )}

            {inviteCode && (
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-600">
                Te registras como alumno y quedas vinculado a tu entrenador automaticamente.
              </div>
            )}

            {refCode && !inviteCode && (
              <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-600">
                Fuiste invitado por alguien de la comunidad TrainUp.
              </div>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
