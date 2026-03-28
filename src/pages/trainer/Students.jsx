import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, Modal, LoadingSpinner, EmptyState } from '../../components/ui'
import { Users, Copy, Check, ChevronRight, Link as LinkIcon, UserPlus, Share2, Gift } from 'lucide-react'

export default function Students() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRefModal, setShowRefModal] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      loadStudents()
      loadInviteCode()
      loadReferrals()
    }
  }, [profile])

  async function loadInviteCode() {
    const { data } = await supabase
      .from('trainer_profiles')
      .select('invite_code')
      .eq('id', profile.id)
      .single()
    if (data) setInviteCode(data.invite_code)
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('id, subscription_status, created_at, profiles!inner(full_name, email)')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setStudents(data || [])
    setLoading(false)
  }

  async function loadReferrals() {
    const { data } = await supabase
      .from('referrals')
      .select('id, created_at, referred_id, profiles!referrals_referred_id_fkey(full_name, email, role)')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false })

    if (data) setReferrals(data)
  }

  const studentInviteLink = inviteCode
    ? `${window.location.origin}/signup?invite=${inviteCode}&ref=${profile?.referral_code}`
    : ''

  const trainerInviteLink = profile?.referral_code
    ? `${window.location.origin}/signup?ref=${profile.referral_code}`
    : ''

  async function copyLink(link, key) {
    await navigator.clipboard.writeText(link)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function statusLabel(status) {
    const map = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }
    return map[status] || status
  }
  function statusVariant(status) {
    const map = { active: 'success', paused: 'warning', cancelled: 'danger' }
    return map[status] || 'default'
  }
  function roleLabel(role) {
    return role === 'trainer' ? 'Entrenador' : 'Alumno'
  }
  function formatDate(d) {
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-sm text-gray-500">{students.length} alumno{students.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} size="sm">
          <UserPlus className="w-4 h-4 mr-1.5" /> Invitar
        </Button>
      </div>

      {/* Referral banner */}
      <Card
        className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowRefModal(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Programa de referidos</p>
            <p className="text-xs text-gray-500">
              {referrals.length > 0
                ? `Invitaste a ${referrals.length} persona${referrals.length !== 1 ? 's' : ''} a TrainUp`
                : 'Invita a entrenadores y alumnos a TrainUp'}
            </p>
          </div>
          <Share2 className="w-4 h-4 text-purple-500" />
        </div>
      </Card>

      {/* Students list */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin alumnos aun"
          description="Comparte tu link de invitacion para que tus alumnos se registren"
          action={
            <Button onClick={() => setShowInviteModal(true)}>
              <LinkIcon className="w-4 h-4 mr-2" /> Ver link de invitacion
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map(student => (
            <Card
              key={student.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/trainer/students/${student.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">
                    {student.profiles.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{student.profiles.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{student.profiles.email}</p>
                </div>
                <Badge variant={statusVariant(student.subscription_status)}>
                  {statusLabel(student.subscription_status)}
                </Badge>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal — alumno + entrenador */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invitar personas">
        <div className="flex flex-col gap-5">
          {/* Student invite */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Invitar alumno</p>
            <p className="text-xs text-gray-500 mb-3">El alumno queda vinculado a tu cuenta al registrarse.</p>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-2">
              <p className="text-xs text-blue-700 mb-1 font-medium">Link para alumnos</p>
              <p className="text-xs text-gray-700 break-all font-mono">{studentInviteLink || 'Cargando...'}</p>
            </div>
            <Button onClick={() => copyLink(studentInviteLink, 'student')} className="w-full" variant={copied === 'student' ? 'secondary' : 'primary'}>
              {copied === 'student'
                ? <><Check className="w-4 h-4 mr-2 text-green-600" /> Copiado!</>
                : <><Copy className="w-4 h-4 mr-2" /> Copiar link de alumno</>
              }
            </Button>
          </div>

          <div className="border-t border-gray-100" />

          {/* Trainer invite */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Invitar entrenador</p>
            <p className="text-xs text-gray-500 mb-3">Invita a otros entrenadores a TrainUp. Quedara registrado como tu referido.</p>
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 mb-2">
              <p className="text-xs text-purple-700 mb-1 font-medium">Link para entrenadores</p>
              <p className="text-xs text-gray-700 break-all font-mono">{trainerInviteLink || 'Cargando...'}</p>
            </div>
            <Button onClick={() => copyLink(trainerInviteLink, 'trainer')} className="w-full" variant={copied === 'trainer' ? 'secondary' : 'outline'}>
              {copied === 'trainer'
                ? <><Check className="w-4 h-4 mr-2 text-green-600" /> Copiado!</>
                : <><Copy className="w-4 h-4 mr-2" /> Copiar link de entrenador</>
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* Referrals Modal */}
      <Modal isOpen={showRefModal} onClose={() => setShowRefModal(false)} title="Mis referidos">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{referrals.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-600">
                {referrals.filter(r => r.profiles?.role === 'trainer').length}
              </p>
              <p className="text-xs text-gray-500">Entrenadores</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">
                {referrals.filter(r => r.profiles?.role === 'student').length}
              </p>
              <p className="text-xs text-gray-500">Alumnos</p>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-6">
              <Gift className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aun no invitaste a nadie</p>
              <p className="text-xs text-gray-400 mt-1">Comparte tu link y empieza a sumar referidos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {referrals.map(ref => (
                <div key={ref.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-700">
                      {ref.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{ref.profiles?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-gray-400">{formatDate(ref.created_at)}</p>
                  </div>
                  <Badge variant={ref.profiles?.role === 'trainer' ? 'purple' : 'info'}>
                    {roleLabel(ref.profiles?.role)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">Tu link de referido</p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-2">
              <p className="text-xs text-gray-700 break-all font-mono">{trainerInviteLink}</p>
            </div>
            <Button onClick={() => copyLink(trainerInviteLink, 'ref-modal')} className="w-full" variant={copied === 'ref-modal' ? 'secondary' : 'primary'}>
              {copied === 'ref-modal'
                ? <><Check className="w-4 h-4 mr-2 text-green-600" /> Copiado!</>
                : <><Copy className="w-4 h-4 mr-2" /> Copiar mi link</>
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
