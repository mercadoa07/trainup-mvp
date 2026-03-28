import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Card, Badge, Button, Modal, LoadingSpinner, EmptyState } from '../../components/ui'
import { Users, Copy, Check, ChevronRight, Link as LinkIcon, UserPlus } from 'lucide-react'

export default function Students() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      loadStudents()
      loadInviteCode()
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
      .select(`
        id,
        subscription_status,
        created_at,
        profiles!inner(full_name, email)
      `)
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setStudents(data || [])
    setLoading(false)
  }

  const inviteLink = inviteCode
    ? `${window.location.origin}/signup?invite=${inviteCode}`
    : ''

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function statusLabel(status) {
    const map = { active: 'Activo', paused: 'Pausado', cancelled: 'Cancelado' }
    return map[status] || status
  }
  function statusVariant(status) {
    const map = { active: 'success', paused: 'warning', cancelled: 'danger' }
    return map[status] || 'default'
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

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

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin alumnos aún"
          description="Compartí tu link de invitación para que tus alumnos se registren"
          action={
            <Button onClick={() => setShowInviteModal(true)}>
              <LinkIcon className="w-4 h-4 mr-2" /> Ver link de invitación
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

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invitar alumno"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Compartí este link con tus alumnos. Al registrarse quedarán vinculados a tu cuenta automáticamente.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium">Tu link de invitación</p>
            <p className="text-xs text-gray-700 break-all font-mono">{inviteLink || 'Cargando...'}</p>
          </div>
          <Button onClick={copyLink} className="w-full" variant={copied ? 'secondary' : 'primary'}>
            {copied ? (
              <><Check className="w-4 h-4 mr-2 text-green-600" /> ¡Copiado!</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" /> Copiar link</>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
