import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { LoadingSpinner } from './components/ui'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Join = lazy(() => import('./pages/Join'))

const TrainerDashboard = lazy(() => import('./pages/trainer/Dashboard'))
const Students = lazy(() => import('./pages/trainer/Students'))
const StudentDetail = lazy(() => import('./pages/trainer/StudentDetail'))
const CreateWorkout = lazy(() => import('./pages/trainer/CreateWorkout'))
const Workouts = lazy(() => import('./pages/trainer/Workouts'))
const WorkoutDetail = lazy(() => import('./pages/trainer/WorkoutDetail'))
const EditWorkout = lazy(() => import('./pages/trainer/EditWorkout'))

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const WorkoutLog = lazy(() => import('./pages/student/WorkoutLog'))
const History = lazy(() => import('./pages/student/History'))
const Progress = lazy(() => import('./pages/student/Progress'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function TrainerLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="trainer">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function StudentLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="student">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/join" element={<Join />} />

            {/* Trainer routes */}
            <Route path="/trainer" element={<TrainerLayout><TrainerDashboard /></TrainerLayout>} />
            <Route path="/trainer/students" element={<TrainerLayout><Students /></TrainerLayout>} />
            <Route path="/trainer/students/:studentId" element={<TrainerLayout><StudentDetail /></TrainerLayout>} />
            <Route path="/trainer/workouts" element={<TrainerLayout><Workouts /></TrainerLayout>} />
            <Route path="/trainer/workouts/new" element={<TrainerLayout><CreateWorkout /></TrainerLayout>} />
            <Route path="/trainer/workouts/:workoutId" element={<TrainerLayout><WorkoutDetail /></TrainerLayout>} />
            <Route path="/trainer/workouts/:workoutId/edit" element={<TrainerLayout><EditWorkout /></TrainerLayout>} />

            {/* Student routes */}
            <Route path="/student" element={<StudentLayout><StudentDashboard /></StudentLayout>} />
            <Route path="/student/workout" element={
              <ProtectedRoute requiredRole="student">
                <WorkoutLog />
              </ProtectedRoute>
            } />
            <Route path="/student/history" element={<StudentLayout><History /></StudentLayout>} />
            <Route path="/student/progress" element={<StudentLayout><Progress /></StudentLayout>} />

            {/* Default */}
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
