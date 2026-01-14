-- TRAINUP MVP - Database Schema
-- Ejecuta esto en tu proyecto Supabase (SQL Editor)

-- =====================================================
-- 1. PROFILES (extiende auth.users de Supabase)
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('trainer', 'student')) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para crear profile automáticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. TRAINER_PROFILES (info adicional de entrenadores)
-- =====================================================
CREATE TABLE trainer_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialty TEXT, -- "CrossFit", "Funcional", "Bodybuilding", etc
  bio TEXT,
  instagram TEXT,
  phone TEXT,
  pricing_monthly DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. STUDENT_PROFILES (info adicional de alumnos)
-- =====================================================
CREATE TABLE student_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  trainer_id UUID REFERENCES profiles(id),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  goals TEXT[], -- ["Ganar músculo", "Perder grasa", etc]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. WORKOUTS (planes de entrenamiento)
-- =====================================================
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  is_template BOOLEAN DEFAULT false, -- Para planes reutilizables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. WORKOUT_DAYS (días dentro del plan)
-- =====================================================
CREATE TABLE workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- 1, 2, 3... (no necesariamente lunes/martes)
  name TEXT NOT NULL, -- "Día 1: Pierna", "Día 2: Push", etc
  notes TEXT, -- Notas generales del día
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, day_number)
);

-- =====================================================
-- 6. EXERCISES (ejercicios dentro de cada día)
-- =====================================================
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL, -- Orden en el que aparecen
  name TEXT NOT NULL, -- "Sentadilla", "Press Banca", etc
  sets INTEGER,
  reps TEXT, -- "8-10" o "12" o "AMRAP"
  weight_prescribed TEXT, -- "60kg" o "RPE 8" o "60% 1RM"
  rest_seconds INTEGER,
  notes TEXT, -- "Tempo 3-0-1-0", "Si duele, para"
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ASSIGNMENTS (plan asignado a alumno)
-- =====================================================
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  trainer_id UUID REFERENCES profiles(id) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, workout_id, start_date) -- Un alumno no puede tener el mismo plan 2 veces el mismo día
);

-- =====================================================
-- 8. WORKOUT_LOGS (registro de entrenamientos)
-- =====================================================
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  workout_day_id UUID REFERENCES workout_days(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT true,
  duration_minutes INTEGER,
  notes TEXT, -- Notas generales del entrenamiento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, workout_day_id, logged_date) -- No puedes loggear el mismo día 2 veces
);

-- =====================================================
-- 9. EXERCISE_LOGS (registro por ejercicio)
-- =====================================================
CREATE TABLE exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER[], -- [12, 10, 8, 8] - array para cada serie
  weight_used DECIMAL[], -- [60.0, 60.0, 65.0, 65.0]
  completed BOOLEAN DEFAULT true,
  notes TEXT, -- "Sentí dolor en rodilla serie 3"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES: cada quien ve solo su perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- WORKOUTS: entrenadores ven sus propios planes
CREATE POLICY "Trainers can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can create workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = trainer_id);

-- WORKOUT_DAYS: heredan permisos del workout
CREATE POLICY "Users can view workout days" ON workout_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w WHERE w.id = workout_days.workout_id AND w.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can manage workout days" ON workout_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts w WHERE w.id = workout_days.workout_id AND w.trainer_id = auth.uid()
    )
  );

-- EXERCISES: heredan permisos del workout_day
CREATE POLICY "Users can view exercises" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workouts w ON w.id = wd.workout_id
      WHERE wd.id = exercises.workout_day_id AND w.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_days wd
      JOIN workouts w ON w.id = wd.workout_id
      WHERE wd.id = exercises.workout_day_id AND w.trainer_id = auth.uid()
    )
  );

-- ASSIGNMENTS: entrenador y alumno pueden ver
CREATE POLICY "Trainers can view their assignments" ON assignments
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Students can view their assignments" ON assignments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Trainers can create assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

-- STUDENT_PROFILES: entrenador puede ver a sus alumnos
CREATE POLICY "Trainers can view their students" ON student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp WHERE sp.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = id);

-- WORKOUT_LOGS: alumno y entrenador pueden ver
CREATE POLICY "Students can manage own logs" ON workout_logs
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Trainers can view student logs" ON workout_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.trainer_id = auth.uid()
    )
  );

-- EXERCISE_LOGS: similar a workout_logs
CREATE POLICY "Students can manage own exercise logs" ON exercise_logs
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Trainers can view student exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN assignments a ON a.id = wl.assignment_id
      WHERE wl.id = workout_log_id AND a.trainer_id = auth.uid()
    )
  );

-- =====================================================
-- 11. ÍNDICES para performance
-- =====================================================
CREATE INDEX idx_workouts_trainer ON workouts(trainer_id);
CREATE INDEX idx_workout_days_workout ON workout_days(workout_id);
CREATE INDEX idx_exercises_day ON exercises(workout_day_id);
CREATE INDEX idx_assignments_student ON assignments(student_id);
CREATE INDEX idx_assignments_trainer ON assignments(trainer_id);
CREATE INDEX idx_workout_logs_assignment ON workout_logs(assignment_id);
CREATE INDEX idx_exercise_logs_workout_log ON exercise_logs(workout_log_id);
CREATE INDEX idx_student_profiles_trainer ON student_profiles(trainer_id);

-- =====================================================
-- 12. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener el "día actual" de un alumno
CREATE OR REPLACE FUNCTION get_current_workout_day(p_student_id UUID)
RETURNS TABLE (
  assignment_id UUID,
  workout_day_id UUID,
  day_number INTEGER,
  day_name TEXT,
  workout_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as assignment_id,
    wd.id as workout_day_id,
    wd.day_number,
    wd.name as day_name,
    w.name as workout_name
  FROM assignments a
  JOIN workouts w ON w.id = a.workout_id
  JOIN workout_days wd ON wd.workout_id = w.id
  WHERE a.student_id = p_student_id
    AND a.status = 'active'
  ORDER BY a.start_date DESC, wd.day_number ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. DATOS DE PRUEBA (opcional para testing)
-- =====================================================

-- Estos datos se crearán via la app, pero si quieres testing rápido:
-- INSERT INTO profiles (id, email, full_name, role) VALUES ...
-- (Mejor hacerlo via signup en la app)
