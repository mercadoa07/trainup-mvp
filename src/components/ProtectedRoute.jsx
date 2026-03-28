import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './ui'

export function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Profile still loading or not created yet
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando perfil...</p>
          <p className="text-xs text-gray-400 mt-2">Si esto tarda mucho, intenta cerrar sesion y volver a entrar.</p>
        </div>
      </div>
    )
  }

  if (requiredRole && profile.role !== requiredRole) {
    const redirect = profile.role === 'trainer' ? '/trainer' : '/student'
    return <Navigate to={redirect} replace />
  }

  return children
}
