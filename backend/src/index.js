import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import clientRoutes from './routes/clients.js'
import dealRoutes from './routes/deals.js'
import taskRoutes from './routes/tasks.js'
import dashboardRoutes from './routes/dashboard.js'
import voiceRoutes from './routes/voice.js'
import noteRoutes from './routes/notes.js'
import prisma from './lib/prisma.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/notes', noteRoutes)

app.get('/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

app.listen(PORT, () => console.log(`CRM Backend running on port ${PORT}`))
