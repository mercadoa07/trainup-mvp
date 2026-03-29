import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Join from './pages/Join'

import TrainerDashboard from './pages/trainer/Dashboard'
import Students from './pages/trainer/Students'
import StudentDetail from './pages/trainer/StudentDetail'
import CreateWorkout from './pages/trainer/CreateWorkout'
import Workouts from './pages/trainer/Workouts'
import WorkoutDetail from './pages/trainer/WorkoutDetail'
import EditWorkout from './pages/trainer/EditWorkout'

import StudentDashboard from './pages/student/Dashboard'
import WorkoutLog from './pages/student/WorkoutLog'
import History from './pages/student/History'
import Progress from './pages/student/Progress'

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

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
