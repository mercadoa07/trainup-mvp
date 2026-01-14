import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Dumbbell, Users, Calendar, CheckCircle, Plus, X, LogOut, User, TrendingUp, Clock, Target } from 'lucide-react';

// ============================================
// SUPABASE CONFIG
// ============================================
// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO
const supabaseUrl = 'YOUR_SUPABASE_URL'; // ej: https://abcdefgh.supabase.co
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// MAIN APP
// ============================================
const TrainUpApp = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // 'login', 'signup', 'trainer-dashboard', 'student-dashboard'

  useEffect(() => {
    checkUser();
    
    // Listen to auth changes
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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

      {/* Main Content */}
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
    role: 'student', // 'trainer' or 'student'
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
  const [view, setView] = useState('overview'); // 'overview', 'create-workout', 'students'
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load workouts
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('*')
      .eq('trainer_id', userId)
      .order('created_at', { ascending: false });
    
    setWorkouts(workoutsData || []);

    // Load students
    const { data: studentsData } = await supabase
      .from('student_profiles')
      .select('*, profiles(*)')
      .eq('trainer_id', userId);
    
    setStudents(studentsData || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-xl shadow">
        <button
          onClick={() => setView('overview')}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            view === 'overview' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Mis Planes
        </button>
        <button
          onClick={() => setView('students')}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            view === 'students' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Alumnos ({students.length})
        </button>
      </div>

      {/* Content */}
      {view === 'overview' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis Planes de Entrenamiento</h2>
            <button
              onClick={() => setView('create-workout')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Plan
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes planes aún</h3>
              <p className="text-gray-600 mb-6">Crea tu primer plan de entrenamiento</p>
              <button
                onClick={() => setView('create-workout')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Crear Mi Primer Plan
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {workouts.map(workout => (
                <WorkoutCard key={workout.id} workout={workout} onReload={loadData} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'students' && (
        <StudentsView students={students} workouts={workouts} onReload={loadData} />
      )}

      {view === 'create-workout' && (
        <CreateWorkoutForm userId={userId} onBack={() => setView('overview')} onSuccess={() => { loadData(); setView('overview'); }} />
      )}
    </div>
  );
};

// ============================================
// WORKOUT CARD
// ============================================
const WorkoutCard = ({ workout, onReload }) => {
  const [expanded, setExpanded] = useState(false);
  const [days, setDays] = useState([]);

  useEffect(() => {
    if (expanded && days.length === 0) {
      loadDays();
    }
  }, [expanded]);

  const loadDays = async () => {
    const { data } = await supabase
      .from('workout_days')
      .select('*, exercises(*)')
      .eq('workout_id', workout.id)
      .order('day_number');
    
    setDays(data || []);
  };

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition-all">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{workout.name}</h3>
            <p className="text-gray-600 text-sm">{workout.description}</p>
          </div>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {workout.duration_weeks} semanas
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {expanded ? '▲ Ocultar días' : '▼ Ver días del plan'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-2">
            {days.map(day => (
              <div key={day.id} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Día {day.day_number}: {day.name}
                </h4>
                <div className="text-sm text-gray-600">
                  {day.exercises?.length || 0} ejercicios
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// CREATE WORKOUT FORM
// ============================================
const CreateWorkoutForm = ({ userId, onBack, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Basic info, 2: Add days
  const [workout, setWorkout] = useState({
    name: '',
    description: '',
    duration_weeks: 4,
  });
  const [days, setDays] = useState([
    { day_number: 1, name: 'Día 1', exercises: [] }
  ]);

  const handleCreateWorkout = async () => {
    // Create workout
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        trainer_id: userId,
        name: workout.name,
        description: workout.description,
        duration_weeks: workout.duration_weeks,
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
          day_number: day.day_number,
          name: day.name,
        })
        .select()
        .single();

      // Create exercises for this day
      if (day.exercises.length > 0 && dayData) {
        const exercisesData = day.exercises.map((ex, idx) => ({
          workout_day_id: dayData.id,
          order_index: idx,
          name: ex.name,
          sets: ex.sets || null,
          reps: ex.reps || null,
          rest_seconds: ex.rest_seconds || null,
        }));

        await supabase.from('exercises').insert(exercisesData);
      }
    }

    alert('Plan creado exitosamente!');
    onSuccess();
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Plan</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Plan
            </label>
            <input
              type="text"
              value={workout.name}
              onChange={(e) => setWorkout({...workout, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ej: Plan Hipertrofia 12 Semanas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={workout.description}
              onChange={(e) => setWorkout({...workout, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Descripción breve del plan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (semanas)
            </label>
            <input
              type="number"
              value={workout.duration_weeks}
              onChange={(e) => setWorkout({...workout, duration_weeks: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => setStep(2)}
            disabled={!workout.name}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Siguiente: Agregar Días
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Add days and exercises
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{workout.name}</h2>
      <p className="text-gray-600 mb-6">Agrega los días y ejercicios</p>

      <div className="space-y-6">
        {days.map((day, dayIdx) => (
          <DayForm
            key={dayIdx}
            day={day}
            dayIdx={dayIdx}
            days={days}
            setDays={setDays}
          />
        ))}
      </div>

      <button
        onClick={() => setDays([...days, { day_number: days.length + 1, name: `Día ${days.length + 1}`, exercises: [] }])}
        className="mt-6 w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 py-4 rounded-lg font-medium transition-all"
      >
        + Agregar Otro Día
      </button>

      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => setStep(1)}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
        >
          ← Atrás
        </button>
        <button
          onClick={handleCreateWorkout}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg"
        >
          Crear Plan ✓
        </button>
      </div>
    </div>
  );
};

// ============================================
// DAY FORM (for creating workout days)
// ============================================
const DayForm = ({ day, dayIdx, days, setDays }) => {
  const addExercise = () => {
    const newDays = [...days];
    newDays[dayIdx].exercises.push({
      name: '',
      sets: 3,
      reps: '10',
      rest_seconds: 60,
    });
    setDays(newDays);
  };

  const updateExercise = (exIdx, field, value) => {
    const newDays = [...days];
    newDays[dayIdx].exercises[exIdx][field] = value;
    setDays(newDays);
  };

  const removeExercise = (exIdx) => {
    const newDays = [...days];
    newDays[dayIdx].exercises.splice(exIdx, 1);
    setDays(newDays);
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={day.name}
          onChange={(e) => {
            const newDays = [...days];
            newDays[dayIdx].name = e.target.value;
            setDays(newDays);
          }}
          className="text-lg font-bold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1"
          placeholder={`Día ${day.day_number}`}
        />
        {days.length > 1 && (
          <button
            onClick={() => setDays(days.filter((_, i) => i !== dayIdx))}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {day.exercises.map((ex, exIdx) => (
          <div key={exIdx} className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-12 gap-3 items-center">
              <input
                type="text"
                value={ex.name}
                onChange={(e) => updateExercise(exIdx, 'name', e.target.value)}
                className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Nombre ejercicio"
              />
              <input
                type="number"
                value={ex.sets}
                onChange={(e) => updateExercise(exIdx, 'sets', parseInt(e.target.value))}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                placeholder="Sets"
              />
              <input
                type="text"
                value={ex.reps}
                onChange={(e) => updateExercise(exIdx, 'reps', e.target.value)}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                placeholder="Reps"
              />
              <input
                type="number"
                value={ex.rest_seconds}
                onChange={(e) => updateExercise(exIdx, 'rest_seconds', parseInt(e.target.value))}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                placeholder="Rest"
              />
              <button
                onClick={() => removeExercise(exIdx)}
                className="col-span-1 text-red-600 hover:bg-red-50 p-2 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="mt-4 w-full border border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 py-3 rounded-lg text-sm font-medium"
      >
        + Agregar Ejercicio
      </button>
    </div>
  );
};

// ============================================
// STUDENTS VIEW
// ============================================
const StudentsView = ({ students, workouts, onReload }) => {
  const [showInvite, setShowInvite] = useState(false);

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
          <h3 className="font-bold text-gray-900 mb-3">Invitar nuevo alumno</h3>
          <p className="text-sm text-gray-600 mb-4">
            Comparte este link con tu alumno para que se registre:
          </p>
          <div className="bg-white px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm">
            {window.location.origin}?trainer={userId}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Al registrarse con este link, automáticamente quedarán conectados
          </p>
        </div>
      )}

      {students.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes alumnos aún</h3>
          <p className="text-gray-600 mb-6">Invita a tu primer alumno para comenzar</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              workouts={workouts}
              onReload={onReload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// STUDENT CARD
// ============================================
const StudentCard = ({ student, workouts, onReload }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*, workouts(name)')
      .eq('student_id', student.id)
      .eq('status', 'active');
    
    setAssignments(data || []);
  };

  const handleAssign = async () => {
    if (!selectedWorkout) return;

    const { error } = await supabase
      .from('assignments')
      .insert({
        workout_id: selectedWorkout,
        student_id: student.id,
        trainer_id: student.trainer_id,
        start_date: new Date().toISOString().split('T')[0],
      });

    if (error) {
      alert('Error asignando plan: ' + error.message);
    } else {
      alert('Plan asignado exitosamente!');
      setShowAssign(false);
      setSelectedWorkout('');
      loadAssignments();
      onReload();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
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

      {assignments.length > 0 ? (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Plan actual:</p>
          {assignments.map(a => (
            <div key={a.id} className="bg-blue-50 p-3 rounded-lg">
              <p className="font-semibold text-blue-900">{a.workouts?.name}</p>
              <p className="text-xs text-blue-600">Desde {new Date(a.start_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Sin plan asignado</p>
      )}

      {showAssign ? (
        <div className="space-y-3">
          <select
            value={selectedWorkout}
            onChange={(e) => setSelectedWorkout(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Selecciona un plan...</option>
            {workouts.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <div className="flex space-x-2">
            <button
              onClick={handleAssign}
              disabled={!selectedWorkout}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              Asignar
            </button>
            <button
              onClick={() => setShowAssign(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAssign(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Asignar Plan
        </button>
      )}
    </div>
  );
};

// ============================================
// STUDENT DASHBOARD
// ============================================
const StudentDashboard = ({ userId }) => {
  const [assignments, setAssignments] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load active assignments
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select(`
        *,
        workouts(*, workout_days(*, exercises(*)))
      `)
      .eq('student_id', userId)
      .eq('status', 'active');
    
    setAssignments(assignmentsData || []);

    // For simplicity, show first day of first active assignment
    if (assignmentsData && assignmentsData.length > 0) {
      const firstWorkout = assignmentsData[0].workouts;
      if (firstWorkout.workout_days && firstWorkout.workout_days.length > 0) {
        setTodayWorkout({
          assignment: assignmentsData[0],
          day: firstWorkout.workout_days[0],
        });
      }
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (assignments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl p-12 text-center shadow">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin plan asignado</h3>
          <p className="text-gray-600">Tu entrenador aún no te ha asignado un plan de entrenamiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Entrenamiento de Hoy</h2>

      {todayWorkout ? (
        <TodayWorkoutView
          workout={todayWorkout}
          userId={userId}
          onReload={loadData}
        />
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-600">No hay entrenamiento programado para hoy</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// TODAY WORKOUT VIEW
// ============================================
const TodayWorkoutView = ({ workout, userId, onReload }) => {
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [workoutLogId, setWorkoutLogId] = useState(null);

  const { assignment, day } = workout;
  const exercises = day.exercises || [];

  const updateLog = (exerciseId, field, value) => {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      }
    }));
  };

  const handleCompleteWorkout = async () => {
    // Create workout log
    const { data: wLog, error: wError } = await supabase
      .from('workout_logs')
      .insert({
        assignment_id: assignment.id,
        workout_day_id: day.id,
        student_id: userId,
        logged_date: new Date().toISOString().split('T')[0],
        completed: true,
      })
      .select()
      .single();

    if (wError) {
      alert('Error guardando entrenamiento: ' + wError.message);
      return;
    }

    // Create exercise logs
    const exLogs = exercises.map(ex => ({
      workout_log_id: wLog.id,
      exercise_id: ex.id,
      student_id: userId,
      sets_completed: exerciseLogs[ex.id]?.sets_completed || ex.sets,
      reps_completed: exerciseLogs[ex.id]?.reps_completed ? 
        [parseInt(exerciseLogs[ex.id]?.reps_completed)] : 
        [parseInt(ex.reps)],
      weight_used: exerciseLogs[ex.id]?.weight_used ? 
        [parseFloat(exerciseLogs[ex.id]?.weight_used)] : 
        [0],
      completed: true,
    }));

    const { error: exError } = await supabase
      .from('exercise_logs')
      .insert(exLogs);

    if (exError) {
      alert('Error guardando ejercicios: ' + exError.message);
    } else {
      alert('Entrenamiento completado! 🎉');
      onReload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-2">{day.name}</h3>
        <p className="opacity-90">{assignment.workouts.name}</p>
      </div>

      <div className="space-y-3">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  {idx + 1}. {ex.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {ex.sets} series x {ex.reps} reps
                  {ex.rest_seconds && ` · ${ex.rest_seconds}s descanso`}
                </p>
                {ex.notes && (
                  <p className="text-sm text-blue-600 mt-1">💡 {ex.notes}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Series
                </label>
                <input
                  type="number"
                  defaultValue={ex.sets}
                  onChange={(e) => updateLog(ex.id, 'sets_completed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  defaultValue={ex.reps}
                  onChange={(e) => updateLog(ex.id, 'reps_completed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  onChange={(e) => updateLog(ex.id, 'weight_used', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleCompleteWorkout}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <CheckCircle className="w-6 h-6 mr-2" />
        Completar Entrenamiento
      </button>
    </div>
  );
};

export default TrainUpApp;
