# TrainUp v2 — MVP

Plataforma que conecta entrenadores personales con sus alumnos para gestionar planes de entrenamiento y trackear progreso en tiempo real.

---

## Setup rapido (10 minutos)

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta TODO el contenido de `supabase-schema.sql`

### 2. Obtener credenciales

En tu proyecto Supabase: **Settings** → **API**
- Copia el **Project URL**
- Copia el **anon public key**

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...tu-key
```

### 4. Instalar y correr

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`

---

## Configuracion de Supabase Auth

En tu proyecto Supabase ve a **Authentication** → **URL Configuration** y agrega:

- Site URL: `http://localhost:5173` (dev) o tu URL de produccion
- Redirect URLs: la misma URL

---

## Flujo de uso

### Entrenador:
1. Sign up con role "Entrenador"
2. Confirma email
3. Ve a "Planes" → "Crear plan" (wizard de 3 pasos)
4. Ve a "Alumnos" → "Invitar" → copia el link
5. Comparte el link por WhatsApp
6. Cuando el alumno se registra, asignale el plan desde su perfil

### Alumno:
1. Entra al link de invitacion del trainer
2. Sign up — queda vinculado automaticamente
3. Confirma email
4. Ve su entrenamiento del dia y hace click en "Comenzar"
5. Registra reps y peso por cada serie con botones +/-
6. Al terminar, guarda el entrenamiento

---

## Stack tecnico

```
Frontend: React 18 + Vite + Tailwind CSS + React Router v6
Backend:  Supabase (PostgreSQL + Auth + RLS)
Graficos: Recharts
Icons:    Lucide React
Deploy:   Vercel
```

---

## Deploy en Vercel

```bash
# Con Vercel CLI
vercel

# Variables de entorno en Vercel Dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

O importa el repo en [vercel.com](https://vercel.com) y agrega las variables de entorno.

---

## Estructura del proyecto

```
src/
├── lib/supabase.js              # Cliente Supabase
├── context/AuthContext.jsx      # Auth state + profile
├── components/
│   ├── Layout.jsx               # Header + nav bottom
│   ├── ProtectedRoute.jsx       # Guard por role
│   └── ui/index.jsx             # Button, Card, Modal, etc
└── pages/
    ├── Login.jsx
    ├── SignUp.jsx
    ├── trainer/
    │   ├── Dashboard.jsx        # Resumen de alumnos
    │   ├── Students.jsx         # Lista + link de invitacion
    │   ├── StudentDetail.jsx    # Perfil + historial + asignar plan
    │   ├── CreateWorkout.jsx    # Wizard crear plan
    │   ├── Workouts.jsx         # Lista de planes
    │   └── WorkoutDetail.jsx    # Ver plan detallado
    └── student/
        ├── Dashboard.jsx        # Entrenamiento del dia
        ├── WorkoutLog.jsx       # Logging touch-friendly
        ├── History.jsx          # Historial de sesiones
        └── Progress.jsx         # Graficas de progreso
```

---

## Features implementadas

- Auth completo (signup/login/logout) con roles trainer/student
- Link de invitacion con invite_code que vincula alumno automaticamente
- Wizard para crear planes (info → dias → ejercicios)
- Dashboard del trainer con estado de cada alumno (entren hoy, esta semana)
- Asignacion de planes a alumnos con fecha de inicio
- Logica de dia actual ciclico (Dia 1 → Dia 2 → Dia 3 → Dia 1...)
- Pantalla de logging touch-friendly con botones +/- para peso y reps
- Guardado de workout_logs y exercise_logs en Supabase
- Historial expandible del alumno
- Graficas de progreso de peso por ejercicio (Recharts)
- RLS policies — cada usuario solo ve sus datos
- Responsive mobile-first

---

## Troubleshooting

**"Error al conectar con Supabase"** — Verifica las variables de entorno en `.env`

**"No puedo hacer signup"** — Revisa Supabase → Authentication → Settings, puede que necesites deshabilitar email confirmation para testing

**"RLS policy error"** — Asegurate de ejecutar el schema SQL completo

**El alumno no queda vinculado al trainer** — Verifica que el invite_code en la URL sea el UUID correcto del trainer
