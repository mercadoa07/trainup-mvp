# 🚀 GUÍA RÁPIDA - TrainUp MVP

## ⏱️ Setup en 10 minutos

### PASO 1: Supabase (3 mins)

1. Ve a https://supabase.com → Sign Up
2. "New Project":
   - Nombre: `trainup-mvp`
   - Password: (guárdala, la necesitarás)
   - Región: `South America (São Paulo)` (la más cercana a Colombia)
3. Click "Create new project" y espera 2 minutos

### PASO 2: Base de datos (2 mins)

1. En tu proyecto → **SQL Editor** (icono ⚡)
2. Click "New query"
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia TODO el contenido y pégalo en el editor
5. Click "RUN" (abajo a la derecha)
6. Deberías ver "Success. No rows returned" ✅

### PASO 3: Credenciales (1 min)

1. Ve a **Settings** (⚙️ abajo izquierda) → **API**
2. Copia:
   - **URL**: `https://abcdefghijk.supabase.co`
   - **anon public**: `eyJhbGciOiJI...` (key larga)

### PASO 4: Configurar app (1 min)

**OPCIÓN A: Sin variables de entorno (más rápido)**
1. Abre `src/App.jsx`
2. Líneas 10-11, reemplaza:
```javascript
const supabaseUrl = 'TU_URL_AQUI';
const supabaseAnonKey = 'TU_KEY_AQUI';
```

**OPCIÓN B: Con variables de entorno (más seguro)**
1. Copia `.env.example` a `.env`
2. En `.env`, pega tus credenciales
3. En `src/App.jsx` líneas 10-11:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### PASO 5: Instalar y correr (3 mins)

```bash
npm install
npm run dev
```

Se abre en http://localhost:3000 🎉

---

## 🧪 PRUEBA RÁPIDA (5 mins)

### Test 1: Crear entrenador y plan

1. **Sign Up** → Entrenador
   - Email: `trainer@test.com`
   - Nombre: "Juan Trainer"
2. Confirma email (revisa inbox/spam)
3. **Login**
4. Click "Crear Plan"
   - Nombre: "Plan Test"
   - Duración: 4 semanas
5. "Siguiente: Agregar Días"
6. Agrega ejercicios:
   - Día 1: Sentadilla (4 series, 8 reps, 60s descanso)
   - Press Banca (4 series, 10 reps, 90s descanso)
7. "Crear Plan ✓"

### Test 2: Invitar alumno

1. Ve a pestaña "Alumnos"
2. Click "Invitar Alumno"
3. Copia el link que sale
4. Abre ventana incógnito y pega el link

### Test 3: Registrar alumno y asignar plan

1. En ventana incógnito, **Sign Up** → Alumno
   - Email: `student@test.com`
   - Nombre: "Pedro Student"
2. Confirma email
3. Vuelve a ventana normal (entrenador)
4. Refresh → deberías ver a Pedro en lista
5. Click "Asignar Plan" → elige "Plan Test"

### Test 4: Alumno completa entrenamiento

1. En ventana incógnito (alumno), **Login**
2. Deberías ver "Mi Entrenamiento de Hoy"
3. Completa los ejercicios:
   - Sentadilla: 4 series, 8 reps, 100kg
   - Press Banca: 4 series, 10 reps, 80kg
4. "Completar Entrenamiento" ✅

---

## 🎯 CHECKLIST DE FUNCIONALIDAD

Si todo funciona, deberías poder hacer esto:

### Como Entrenador:
- [ ] Sign up y login
- [ ] Crear plan de entrenamiento
- [ ] Agregar días con ejercicios
- [ ] Ver lista de planes
- [ ] Invitar alumno (generar link)
- [ ] Ver lista de alumnos
- [ ] Asignar plan a alumno

### Como Alumno:
- [ ] Sign up con link de entrenador
- [ ] Login
- [ ] Ver plan del día
- [ ] Loggear ejercicios (series/reps/peso)
- [ ] Completar entrenamiento

---

## ❌ ERRORES COMUNES

### "Failed to fetch" al hacer login/signup
**Solución**: Revisa que las credenciales de Supabase estén correctas en `App.jsx`

### "confirm your email"
**Solución**: 
1. Revisa tu email (inbox y spam)
2. Si no llegó, ve a Supabase → Authentication → Users → click en el usuario → "Send magic link"

### "Row Level Security policy violation"
**Solución**: El schema no se ejecutó bien. Ve a SQL Editor y ejecuta de nuevo `supabase-schema.sql` completo

### No aparecen los alumnos del entrenador
**Solución**: El alumno debe registrarse CON EL LINK que generó el entrenador. Si se registró directo, no quedó conectado.

---

## 🚢 DEPLOY A INTERNET (Vercel - 5 mins)

### Setup:
1. Sube código a GitHub
2. Ve a https://vercel.com → "New Project"
3. Import tu repo
4. **NO agregues variables de entorno aún**
5. Deploy

### Configurar credenciales:
1. En Vercel → Project Settings → Environment Variables
2. Agrega:
   - `VITE_SUPABASE_URL` = tu URL
   - `VITE_SUPABASE_ANON_KEY` = tu key
3. Redeploy (Vercel hace auto-redeploy)

### Importante:
Si usas variables de entorno, DEBES cambiar `App.jsx`:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'TU_URL_FALLBACK';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_KEY_FALLBACK';
```

---

## 🎨 PERSONALIZACIÓN RÁPIDA

### Cambiar colores:
En `App.jsx`, busca clases como:
- `from-blue-600 to-purple-600` → cambia a tus colores
- `bg-blue-600` → tu color primario

### Cambiar nombre:
1. `index.html` → título
2. `App.jsx` → "TrainUp" por tu marca

### Agregar logo:
1. Pon tu logo en `/public/logo.svg`
2. En `App.jsx`, reemplaza el componente `Dumbbell` con tu logo

---

## 📱 TESTING EN MÓVIL

```bash
npm run dev -- --host
```

Verás algo como:
```
Local:   http://localhost:3000
Network: http://192.168.1.X:3000
```

Abre la URL "Network" en tu celular (misma red WiFi)

---

## 🆘 AYUDA

Si algo no funciona:
1. Abre DevTools (F12) → Console → copia error
2. Revisa que Supabase esté online (Dashboard)
3. Verifica que las credenciales sean las correctas

---

**¡Listo para probar! 🚀**
