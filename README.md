# VoiceCRM

CRM moderno con asistente de voz AI integrado. Gestiona clientes, ventas y tareas mediante comandos de voz y texto.

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS → Vercel (gratis)
- **Backend**: Node.js + Express + Prisma → Railway (gratis)
- **Base de datos**: PostgreSQL → Railway (gratis)
- **AI**: OpenAI GPT-4o-mini + Whisper

---

## Deploy en la nube (gratis)

### Requisitos previos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Railway](https://railway.app) (conectada con GitHub)
- Cuenta en [Vercel](https://vercel.com) (conectada con GitHub)
- API Key de [OpenAI](https://platform.openai.com)

---

### Paso 1 — Subir el código a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

---

### Paso 2 — Deploy del Backend en Railway

1. Entra a [railway.app](https://railway.app) → **New Project**
2. Selecciona **Deploy from GitHub repo** → elige tu repositorio
3. Railway detectará el proyecto. Configura el **Root Directory** como `backend`
4. Agrega una base de datos: **New** → **Database** → **PostgreSQL**
5. Railway conectará automáticamente `DATABASE_URL`

**Variables de entorno** (en Railway → tu servicio backend → Variables):

| Variable | Valor |
|---|---|
| `JWT_SECRET` | Una cadena aleatoria larga (ej: `openssl rand -hex 32`) |
| `OPENAI_API_KEY` | `sk-...` tu key de OpenAI |
| `FRONTEND_URL` | La URL de Vercel (la agregas después del paso 3) |
| `NODE_ENV` | `production` |

6. Railway hará el deploy automáticamente. Copia la URL pública del servicio (ej: `https://crm-backend-production.up.railway.app`)

---

### Paso 3 — Deploy del Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repositorio de GitHub
3. Configura:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Agrega la variable de entorno:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | La URL de Railway del paso 2 (sin `/` al final) |

5. Click en **Deploy**. Copia la URL de Vercel (ej: `https://crm-voice.vercel.app`)

---

### Paso 4 — Conectar Frontend ↔ Backend

En Railway, actualiza la variable `FRONTEND_URL` con la URL de Vercel del paso 3 y haz redeploy.

---

## Desarrollo local

### 1. Clonar y configurar

```bash
# Backend
cd backend
cp .env.example .env
# Edita .env con tus valores

# Frontend
cd frontend
cp .env.local.example .env.local
# Edita .env.local con NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Con Docker (recomendado)

```bash
docker-compose up
```

### 3. Sin Docker

```bash
# Terminal 1 — Base de datos (necesitas PostgreSQL local)
# Asegúrate de tener PostgreSQL corriendo

# Terminal 2 — Backend
cd backend
npm install
npx prisma db push
npm run dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Variables de entorno

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/crmvoice"
JWT_SECRET="tu-secreto-super-seguro"
OPENAI_API_KEY="sk-..."
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Comandos de voz disponibles

- "Agrega un cliente llamado [nombre]"
- "Muéstrame mis clientes activos"
- "Crea una tarea para mañana: [descripción]"
- "¿Qué tareas tengo hoy?"
- "Crea un negocio de $5000 para [cliente]"
- "Muéstrame las ventas de esta semana"
- "Ir al dashboard"
