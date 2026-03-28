-- =====================================================
-- TRAINUP v2 -- Schema completo
-- Ejecutar en Supabase SQL Editor de una sola vez
-- =====================================================

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('trainer', 'student')) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear profile automaticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TRAINER_PROFILES
CREATE TABLE trainer_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  specialty TEXT,
  bio TEXT,
  instagram TEXT,
  phone TEXT,
  invite_code UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear trainer_profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_trainer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'trainer' THEN
    INSERT INTO public.trainer_profiles (id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trainer_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_trainer();

-- 3. STUDENT_PROFILES
CREATE TABLE student_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  trainer_id UUID REFERENCES profiles(id),
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  goals TEXT[],
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  injuries TEXT,
  equipment_access TEXT,
  notes TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear student_profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();

-- Funcion para vincular alumno con trainer via invite_code
CREATE OR REPLACE FUNCTION public.handle_student_trainer_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'student' AND NEW.raw_user_meta_data->>'invite_code' IS NOT NULL THEN
    UPDATE public.student_profiles
    SET trainer_id = (
      SELECT tp.id FROM trainer_profiles tp
      WHERE tp.invite_code = (NEW.raw_user_meta_data->>'invite_code')::UUID
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_linked
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_student_trainer_link();

-- 4. WORKOUTS (planes de entrenamiento -- pertenecen al TRAINER)
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  duration_weeks INTEGER DEFAULT 4,
  days_per_week INTEGER DEFAULT 3,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORKOUT_DAYS
CREATE TABLE workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, day_number)
);

-- 6. EXERCISES
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10',
  rest_seconds INTEGER DEFAULT 60,
  weight_prescribed TEXT,
  notes TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ASSIGNMENTS (vincula un workout con un alumno)
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  trainer_id UUID REFERENCES profiles(id) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_day INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, workout_id, start_date)
);

-- 8. WORKOUT_LOGS (cada vez que el alumno entrena)
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  workout_day_id UUID REFERENCES workout_days(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, workout_day_id, logged_date)
);

-- 9. EXERCISE_LOGS (registro detallado por ejercicio)
CREATE TABLE exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER[],
  weight_used DECIMAL[],
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Trainers can view their students profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = profiles.id AND sp.trainer_id = auth.uid())
);

-- TRAINER_PROFILES
CREATE POLICY "Anyone can view trainer profiles" ON trainer_profiles FOR SELECT USING (true);
CREATE POLICY "Trainers can update own trainer profile" ON trainer_profiles FOR UPDATE USING (auth.uid() = id);

-- STUDENT_PROFILES
CREATE POLICY "Students can view and update own" ON student_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Trainers can view their students" ON student_profiles FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "Trainers can update their students" ON student_profiles FOR UPDATE USING (trainer_id = auth.uid());

-- WORKOUTS
CREATE POLICY "Trainers own their workouts" ON workouts FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Students can view assigned workouts" ON workouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM assignments a WHERE a.workout_id = workouts.id AND a.student_id = auth.uid())
);

-- WORKOUT_DAYS
CREATE POLICY "Trainers manage workout days" ON workout_days FOR ALL USING (
  EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_days.workout_id AND w.trainer_id = auth.uid())
);
CREATE POLICY "Students view assigned workout days" ON workout_days FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workouts w
    JOIN assignments a ON a.workout_id = w.id
    WHERE w.id = workout_days.workout_id AND a.student_id = auth.uid()
  )
);

-- EXERCISES
CREATE POLICY "Trainers manage exercises" ON exercises FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workout_days wd
    JOIN workouts w ON w.id = wd.workout_id
    WHERE wd.id = exercises.workout_day_id AND w.trainer_id = auth.uid()
  )
);
CREATE POLICY "Students view assigned exercises" ON exercises FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workout_days wd
    JOIN workouts w ON w.id = wd.workout_id
    JOIN assignments a ON a.workout_id = w.id
    WHERE wd.id = exercises.workout_day_id AND a.student_id = auth.uid()
  )
);

-- ASSIGNMENTS
CREATE POLICY "Trainers manage assignments" ON assignments FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Students view own assignments" ON assignments FOR SELECT USING (auth.uid() = student_id);

-- WORKOUT_LOGS
CREATE POLICY "Students manage own logs" ON workout_logs FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Trainers view student logs" ON workout_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_id AND a.trainer_id = auth.uid())
);

-- EXERCISE_LOGS
CREATE POLICY "Students manage own exercise logs" ON exercise_logs FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Trainers view student exercise logs" ON exercise_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workout_logs wl
    JOIN assignments a ON a.id = wl.assignment_id
    WHERE wl.id = workout_log_id AND a.trainer_id = auth.uid()
  )
);

-- =====================================================
-- INDICES
-- =====================================================
CREATE INDEX idx_student_profiles_trainer ON student_profiles(trainer_id);
CREATE INDEX idx_workouts_trainer ON workouts(trainer_id);
CREATE INDEX idx_workout_days_workout ON workout_days(workout_id);
CREATE INDEX idx_exercises_day ON exercises(workout_day_id);
CREATE INDEX idx_assignments_student ON assignments(student_id);
CREATE INDEX idx_assignments_trainer ON assignments(trainer_id);
CREATE INDEX idx_workout_logs_assignment ON workout_logs(assignment_id);
CREATE INDEX idx_workout_logs_student ON workout_logs(student_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(logged_date);
CREATE INDEX idx_exercise_logs_workout_log ON exercise_logs(workout_log_id);
