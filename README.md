# 🏋️ TrainUp MVP

Plataforma que conecta **entrenadores** con **alumnos** para gestionar planes de entrenamiento y trackear progreso.

---

## 🚀 Quick Start (10 minutos)

### 1️⃣ Setup Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto (elige región más cercana a Colombia)
3. Espera 2 minutos mientras se crea el proyecto
4. Ve a **SQL Editor** (icono de base de datos en sidebar)
5. Crea una nueva query y pega TODO el contenido de `supabase-schema.sql`
6. Click en **RUN** (o F5)
7. Si todo salió bien, verás "Success. No rows returned"

### 2️⃣ Obtener credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** (engrane abajo a la izquierda)
2. Click en **API**
3. Copia estos 2 valores:
   - **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - **anon public** key (es una key larga que empieza con `eyJ...`)

### 3️⃣ Configurar el proyecto

1. Abre el archivo `src/App.jsx`
2. Busca estas líneas al principio (línea ~10):
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```
3. Reemplaza con tus valores:
```javascript
const supabaseUrl = 'https://abcdefgh.supabase.co';
const supabaseAnonKey = 'eyJhbGc...tu-key-completa';
```

### 4️⃣ Instalar y correr

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```

La app se abrirá en `http://localhost:3000` 🎉

---

## 📱 Cómo usar el MVP

### Como ENTRENADOR:

1. **Sign up** como "Entrenador"
2. Confirma tu email (revisa spam si no llega)
3. **Crear Plan**:
   - Nombre: "Hipertrofia 8 semanas"
   - Agrega días (ej: Día 1: Pierna, Día 2: Push, etc)
   - Por cada día, agrega ejercicios con series/reps
4. **Invitar alumno**:
   - Ve a "Alumnos" → "Invitar Alumno"
   - Copia el link y envíaselo
5. **Asignar plan**:
   - Una vez tu alumno se registre, aparecerá en tu lista
   - Click en "Asignar Plan" y elige el plan

### Como ALUMNO:

1. Recibe el link de invitación de tu entrenador
2. **Sign up** como "Alumno"
3. Confirma email
4. Verás tu plan de hoy
5. Completa ejercicios marcando series/reps/peso
6. Click en "Completar Entrenamiento"

---

## 🛠️ Stack Técnico

```
Frontend: React 18 + Vite + Tailwind CSS
Backend: Supabase (PostgreSQL + Auth + Realtime)
Icons: Lucide React
Deploy: Vercel (recomendado)
```

---

## 🚢 Deploy a Producción (Vercel)

### Opción A: Desde GitHub (recomendado)

1. Sube tu código a un repo de GitHub
2. Ve a [vercel.com](https://vercel.com)
3. "New Project" → Import tu repo
4. Vercel detectará Vite automáticamente
5. Agrega variables de entorno:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
6. Deploy!

**IMPORTANTE**: Si usas variables de entorno, actualiza `App.jsx`:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Opción B: Deploy directo con Vercel CLI

```bash
npm install -g vercel
vercel
```

---

## 📊 Estructura de la Base de Datos

```
profiles (usuarios base)
├─ trainer_profiles (info de entrenadores)
└─ student_profiles (info de alumnos)

workouts (planes de entrenamiento)
└─ workout_days (días del plan)
   └─ exercises (ejercicios por día)

assignments (plan asignado a alumno)

workout_logs (registro de entrenamiento)
└─ exercise_logs (registro por ejercicio)
```

---

## 🎯 Features del MVP v0.1

### ✅ Implementado:
- [x] Auth (Login/Signup)
- [x] Dashboard Entrenador
- [x] Crear planes con días y ejercicios
- [x] Ver lista de alumnos
- [x] Invitar alumnos (link)
- [x] Asignar plan a alumno
- [x] Dashboard Alumno
- [x] Ver plan de hoy
- [x] Loggear ejercicios (series/reps/peso)
- [x] Completar entrenamiento

### 🔜 Próximas features (v0.2):
- [ ] Ver historial de entrenamientos
- [ ] Gráficas de progreso
- [ ] Chat entrenador-alumno
- [ ] Editar planes existentes
- [ ] Templates de planes
- [ ] Videos por ejercicio

---

## 🐛 Troubleshooting

### "Error connecting to Supabase"
- Verifica que las credenciales estén correctas
- Revisa que el schema se haya ejecutado sin errores

### "No puedo hacer signup"
- Ve a Supabase → Authentication → Settings
- Confirma que "Enable email confirmations" esté ON
- Revisa tu spam para el email de confirmación

### "RLS policy error"
- Las políticas RLS están configuradas en el schema
- Si ves errores de permisos, verifica que el schema se ejecutó completo

### "Cannot find module @supabase/supabase-js"
- Corre `npm install` de nuevo
- Borra `node_modules` y `package-lock.json`, luego `npm install`

---

## 📈 Roadmap

### Phase 1 - MVP (2-3 semanas) ✅
- Sistema base funcional

### Phase 2 - Core Features (1 mes)
- Historial y progreso
- Chat
- Notificaciones
- Mobile responsive mejorado

### Phase 3 - Growth Features (2 meses)
- IA para generar planes
- IA para análisis de progreso
- Templates marketplace
- Integración calendario

### Phase 4 - Scale (3-6 meses)
- App móvil nativa (React Native)
- Sistema de pagos
- Wearables integration
- Comunidad/social

---

## 💡 Tips para probar rápido

1. Crea 2 cuentas en ventanas diferentes (Incognito):
   - Ventana 1: Entrenador
   - Ventana 2: Alumno

2. Flujo rápido:
   - Entrenador: Crear plan simple (1 día, 3 ejercicios)
   - Entrenador: Copiar link de invitación
   - Alumno: Registrarse con ese link
   - Entrenador: Asignar plan
   - Alumno: Ver y completar entrenamiento

---

## 📞 Soporte

Si algo no funciona:
1. Revisa la consola del navegador (F12 → Console)
2. Revisa logs de Supabase (Dashboard → Logs)
3. Crea un issue en el repo

---

## 📄 Licencia

MIT - Úsalo como quieras

---

## 🙌 Créditos

Built by Apelis
Stack: React + Supabase + Tailwind
Icons: Lucide React
