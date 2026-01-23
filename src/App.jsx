import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dumbbell, Users, Calendar, CheckCircle, Plus, X, LogOut, User, TrendingUp, Clock, Target, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================
// SUPABASE CONFIG
// ============================================
const supabaseUrl = 'https://zfezauhgjkgnytkqmxux.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZXphdWhnamtnbnl0a3FteHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTE4MjUsImV4cCI6MjA4MzkyNzgyNX0.ZbDAwS15Fuw22-pj5fo7yAi0OkaueJ76-LcvbvFq0mU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// UTILIDADES
// ============================================
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getDayOfWeek = (date) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date(date).getDay()];
};

// ============================================
// MAIN APP
// ============================================
const TrainUpApp = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await loadProfile(session.user.id);
    }
    setLoading(false);
  };

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setView(data.role === 'trainer' ? 'trainer-dashboard' : 'student-dashboard');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return view === 'signup' 
      ? <SignUpPage setView={setView} /> 
      : <LoginPage setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TrainUp
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {profile?.role === 'trainer' ? (
        <TrainerDashboard userId={user.id} profile={profile} />
      ) : (
        <StudentDashboard userId={user.id} profile={profile} />
      )}
    </div>
  );
};

// ============================================
// LOGIN PAGE
// ============================================
const LoginPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl mb-4">
            <Dumbbell className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TrainUp</h1>
          <p className="text-gray-600">Conecta entrenadores con alumnos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setView('signup')}
            className="text-blue-600 hover:underline font-medium"
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SIGNUP PAGE
// ============================================
const SignUpPage = ({ setView }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert('Cuenta creada! Revisa tu email para confirmar.');
      setView('login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h2>
          <p className="text-gray-600">Únete a TrainUp</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Soy...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'trainer'})}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.role === 'trainer' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-900">Entrenador</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'student'})}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.role === 'student' 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold text-gray-900">Alumno</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setView('login')}
            className="text-blue-600 hover:underline font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TRAINER DASHBOARD
// ============================================
const TrainerDashboard = ({ userId }) => {
  const [view, setView] = useState('students');
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load students
    const { data: studentsData } = await supabase
      .from('student_profiles')
      .select('*, profiles(*)')
      .eq('trainer_id', userId);
    
    setStudents(studentsData || []);

    // Load workouts
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('*, profiles!workouts_student_id_fkey(full_name)')
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false });
    
    setWorkouts(workoutsData || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-xl shadow">
        <button
          onClick={() => { setView('students'); setSelectedStudent(null); }}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            view === 'students' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Mis Alumnos ({students.length})
        </button>
        <button
          onClick={() => setView('all-plans')}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            view === 'all-plans' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Todos los Planes
        </button>
      </div>

      {view === 'students' && !selectedStudent && (
        <StudentsListView 
          students={students} 
          onSelectStudent={setSelectedStudent}
          onReload={loadData}
        />
      )}

      {view === 'students' && selectedStudent && (
        <CreateWorkoutForStudent
          trainerId={userId}
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
          onSuccess={() => {
            setSelectedStudent(null);
            loadData();
          }}
        />
      )}

      {view === 'all-plans' && (
        <AllPlansView workouts={workouts} onReload={loadData} />
      )}
    </div>
  );
};

// ============================================
// STUDENTS LIST VIEW
// ============================================
const StudentsListView = ({ students, onSelectStudent, onReload }) => {
  const [showInvite, setShowInvite] = useState(false);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes alumnos aún</h3>
        <p className="text-gray-600 mb-6">Invita a tu primer alumno para comenzar</p>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Invitar Alumno
        </button>
        
        {showInvite && (
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-3">Link de invitación:</h4>
            <div className="bg-white px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm break-all">
              {window.location.origin}?invite=trainer
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Comparte este link para que se registren como tus alumnos
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mis Alumnos</h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Invitar Alumno
        </button>
      </div>

      {showInvite && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Link de invitación:</h3>
          <div className="bg-white px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm break-all">
            {window.location.origin}?invite=trainer
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los alumnos que se registren con este link quedarán conectados contigo automáticamente
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onCreatePlan={() => onSelectStudent(student)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// STUDENT CARD
// ============================================
const StudentCard = ({ student, onCreatePlan }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });
    
    setWorkouts(data || []);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{student.profiles?.full_name}</h3>
          <p className="text-sm text-gray-600">{student.profiles?.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          student.subscription_status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {student.subscription_status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Planes activos:</p>
        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.slice(0, 2).map(w => (
              <div key={w.id} className="bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm">{w.name}</p>
                <p className="text-xs text-blue-600">
                  {formatDate(w.start_date)} - {formatDate(w.end_date)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Sin planes asignados</p>
        )}
      </div>

      <button
        onClick={onCreatePlan}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        Crear Nuevo Plan
      </button>
    </div>
  );
};

// ============================================
// CREATE WORKOUT FOR STUDENT
// ============================================
const CreateWorkoutForStudent = ({ trainerId, student, onBack, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Info básica, 2: Calendario, 3: Ejercicios
  const [workout, setWorkout] = useState({
    name: '',
    goal: '',
    start_date: formatDateInput(new Date()),
    end_date: '',
    days_per_week: 3,
  });
  const [days, setDays] = useState([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(null);

  const handleCreateWorkout = async () => {
    if (days.length === 0) {
      alert('Debes agregar al menos un día de entrenamiento');
      return;
    }

    // Create workout
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        trainer_id: trainerId,
        student_id: student.id,
        name: workout.name,
        goal: workout.goal,
        start_date: workout.start_date,
        end_date: workout.end_date,
        days_per_week: workout.days_per_week,
        duration_weeks: Math.ceil((new Date(workout.end_date) - new Date(workout.start_date)) / (7 * 24 * 60 * 60 * 1000)),
      })
      .select()
      .single();

    if (workoutError) {
      alert('Error creando plan: ' + workoutError.message);
      return;
    }

    // Create days
    for (const day of days) {
      const { data: dayData } = await supabase
        .from('workout_days')
        .insert({
          workout_id: workoutData.id,
          scheduled_date: day.date,
          day_of_week: getDayOfWeek(day.date),
          name: day.name,
          notes: day.notes,
        })
        .select()
        .single();

      // Create exercises for this day
      if (day.exercises && day.exercises.length > 0 && dayData) {
        const exercisesData = day.exercises.map((ex, idx) => ({
          workout_day_id: dayData.id,
          order_index: idx,
          name: ex.name,
          sets: ex.sets || null,
          reps: ex.reps || null,
          rest_seconds: ex.rest_seconds || null,
          weight_suggested: ex.weight_suggested || null,
          notes: ex.notes || null,
        }));

        await supabase.from('exercises').insert(exercisesData);
      }
    }

    alert('¡Plan creado exitosamente!');
    onSuccess();
  };

  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Volver a alumnos
        </button>

        <div className="bg-white rounded-xl shadow p-8">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Nuevo Plan para {student.profiles?.full_name}
                </h2>
                <p className="text-gray-600">Paso 1: Información básica</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Plan *
              </label>
              <input
                type="text"
                value={workout.name}
                onChange={(e) => setWorkout({...workout, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ej: Hipertrofia 8 Semanas"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Objetivo del Plan
              </label>
              <input
                type="text"
                value={workout.goal}
                onChange={(e) => setWorkout({...workout, goal: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ej: Ganar masa muscular, Pérdida de grasa, Fuerza"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={workout.start_date}
                  onChange={(e) => setWorkout({...workout, start_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={workout.end_date}
                  onChange={(e) => setWorkout({...workout, end_date: e.target.value})}
                  min={workout.start_date}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Días por Semana
              </label>
              <select
                value={workout.days_per_week}
                onChange={(e) => setWorkout({...workout, days_per_week: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2}>2 días</option>
                <option value={3}>3 días</option>
                <option value={4}>4 días</option>
                <option value={5}>5 días</option>
                <option value={6}>6 días</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4 mt-8">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!workout.name || !workout.start_date || !workout.end_date}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              Siguiente: Calendario
              <ChevronRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <CalendarStep
        workout={workout}
        days={days}
        setDays={setDays}
        onBack={() => setStep(1)}
        onNext={(dayIdx) => {
          setCurrentDayIndex(dayIdx);
          setStep(3);
        }}
        onFinish={handleCreateWorkout}
      />
    );
  }

  if (step === 3) {
    return (
      <ExercisesStep
        day={days[currentDayIndex]}
        dayIndex={currentDayIndex}
        days={days}
        setDays={setDays}
        onBack={() => setStep(2)}
      />
    );
  }
};

// ============================================
// CALENDAR STEP
// ============================================
const CalendarStep = ({ workout, days, setDays, onBack, onNext, onFinish }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [dayName, setDayName] = useState('');

  const addDay = () => {
    if (!selectedDate) {
      alert('Selecciona una fecha');
      return;
    }

    const newDay = {
      date: selectedDate,
      name: dayName || getDayOfWeek(selectedDate),
      notes: '',
      exercises: [],
    };

    setDays([...days, newDay]);
    setSelectedDate('');
    setDayName('');
  };

  const removeDay = (index) => {
    setDays(days.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Volver
      </button>

      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendario de Entrenamiento</h2>
        <p className="text-gray-600 mb-6">
          Plan: {workout.name} | {formatDate(workout.start_date)} - {formatDate(workout.end_date)}
        </p>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Agregar Día de Entrenamiento</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={workout.start_date}
                max={workout.end_date}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Día (opcional)
              </label>
              <input
                type="text"
                value={dayName}
                onChange={(e) => setDayName(e.target.value)}
                placeholder={selectedDate ? getDayOfWeek(selectedDate) : "ej: Pierna"}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={addDay}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Agregar Día
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">Días Programados ({days.length})</h3>
          
          {days.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay días programados aún</p>
            </div>
          ) : (
            days.map((day, idx) => (
              <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{formatDate(day.date)}</h4>
                    <p className="text-sm text-gray-600">{day.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {day.exercises?.length || 0} ejercicios
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onNext(idx)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      {day.exercises?.length > 0 ? 'Editar' : 'Agregar'} Ejercicios
                    </button>
                    <button
                      onClick={() => removeDay(idx)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5 inline mr-2" />
            Atrás
          </button>
          <button
            onClick={onFinish}
            disabled={days.length === 0}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Crear Plan
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXERCISES STEP
// ============================================
const ExercisesStep = ({ day, dayIndex, days, setDays, onBack }) => {
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: '10',
    rest_seconds: 60,
    weight_suggested: '',
    notes: '',
  });

  const addExercise = () => {
    if (!newExercise.name) {
      alert('Ingresa el nombre del ejercicio');
      return;
    }

    const updatedDays = [...days];
    updatedDays[dayIndex].exercises = [...(updatedDays[dayIndex].exercises || []), newExercise];
    setDays(updatedDays);

    setNewExercise({
      name: '',
      sets: 3,
      reps: '10',
      rest_seconds: 60,
      weight_suggested: '',
      notes: '',
    });
  };

  const removeExercise = (exIdx) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, i) => i !== exIdx);
    setDays(updatedDays);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Volver al calendario
      </button>

      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{formatDate(day.date)}</h2>
        <p className="text-gray-600 mb-6">{day.name}</p>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Agregar Ejercicio</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Ejercicio *
              </label>
              <input
                type="text"
                value={newExercise.name}
                onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                placeholder="ej: Sentadilla, Press Banca, Peso Muerto"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Series
                </label>
                <input
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Repeticiones
                </label>
                <input
                  type="text"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                  placeholder="8-10"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descanso (seg)
                </label>
                <input
                  type="number"
                  value={newExercise.rest_seconds}
                  onChange={(e) => setNewExercise({...newExercise, rest_seconds: parseInt(e.target.value)})}
                  min="0"
                  step="15"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Peso Sugerido (opcional)
                </label>
                <input
                  type="text"
                  value={newExercise.weight_suggested}
                  onChange={(e) => setNewExercise({...newExercise, weight_suggested: e.target.value})}
                  placeholder="100kg, 60% 1RM, RPE 8"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise({...newExercise, notes: e.target.value})}
                  placeholder="Tempo 3-0-1-0, profundidad completa"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={addExercise}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Agregar Ejercicio
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">
            Ejercicios del Día ({day.exercises?.length || 0})
          </h3>
          
          {!day.exercises || day.exercises.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Dumbbell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay ejercicios agregados</p>
            </div>
          ) : (
            day.exercises.map((ex, idx) => (
              <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">
                      {idx + 1}. {ex.name}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Series:</span>
                        <span className="font-semibold text-gray-900 ml-2">{ex.sets}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reps:</span>
                        <span className="font-semibold text-gray-900 ml-2">{ex.reps}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Descanso:</span>
                        <span className="font-semibold text-gray-900 ml-2">{ex.rest_seconds}s</span>
                      </div>
                    </div>
                    {ex.weight_suggested && (
                      <p className="text-sm text-blue-600 mt-2">
                        💪 Peso sugerido: {ex.weight_suggested}
                      </p>
                    )}
                    {ex.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        📝 {ex.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeExercise(idx)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg ml-4"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Guardar y Volver al Calendario
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ALL PLANS VIEW
// ============================================
const AllPlansView = ({ workouts, onReload }) => {
  if (workouts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow">
        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay planes creados</h3>
        <p className="text-gray-600">Ve a "Mis Alumnos" para crear el primer plan</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Todos los Planes</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {workouts.map(workout => (
          <div key={workout.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{workout.name}</h3>
                <p className="text-sm text-gray-600">
                  Para: {workout.profiles?.full_name || 'Alumno'}
                </p>
                {workout.goal && (
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    🎯 {workout.goal}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Inicio:</span>
                <span className="font-semibold text-gray-900">{formatDate(workout.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fin:</span>
                <span className="font-semibold text-gray-900">{formatDate(workout.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Días/semana:</span>
                <span className="font-semibold text-gray-900">{workout.days_per_week}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// STUDENT DASHBOARD (Simplified for now)
// ============================================
const StudentDashboard = ({ userId }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_days(*, exercises(*))')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    
    setWorkouts(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (workouts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin plan asignado</h3>
          <p className="text-gray-600">Tu entrenador aún no te ha asignado un plan</p>
        </div>
      </div>
    );
  }

  const currentWorkout = workouts[0];
  const today = new Date().toISOString().split('T')[0];
  const todayWorkout = currentWorkout.workout_days?.find(d => d.scheduled_date === today);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">{currentWorkout.name}</h2>
        {currentWorkout.goal && <p className="opacity-90">🎯 {currentWorkout.goal}</p>}
        <p className="text-sm opacity-75 mt-2">
          {formatDate(currentWorkout.start_date)} - {formatDate(currentWorkout.end_date)}
        </p>
      </div>

      {todayWorkout ? (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Entrenamiento de Hoy - {todayWorkout.name}
          </h3>
          
          <div className="space-y-4">
            {todayWorkout.exercises?.map((ex, idx) => (
              <div key={ex.id} className="bg-white rounded-xl shadow p-5">
                <h4 className="font-bold text-gray-900 text-lg mb-3">
                  {idx + 1}. {ex.name}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Series:</span>
                    <span className="font-semibold text-gray-900 ml-2">{ex.sets}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reps:</span>
                    <span className="font-semibold text-gray-900 ml-2">{ex.reps}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Descanso:</span>
                    <span className="font-semibold text-gray-900 ml-2">{ex.rest_seconds}s</span>
                  </div>
                </div>
                {ex.weight_suggested && (
                  <p className="text-sm text-blue-600 mb-2">
                    💪 Peso sugerido: {ex.weight_suggested}
                  </p>
                )}
                {ex.notes && (
                  <p className="text-sm text-gray-600">
                    📝 {ex.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin entrenamiento hoy</h3>
          <p className="text-gray-600">Hoy es día de descanso</p>
        </div>
      )}
    </div>
  );
};

export default TrainUpApp;
