import { Router } from 'express'
import multer from 'multer'
import { Readable } from 'stream'
import OpenAI from 'openai'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// Store in memory — no disk dependency, works on any cloud provider
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })
let openai = null
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

// Transcribe audio with Whisper (stream from memory buffer, no /tmp needed)
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file' })

    // Convert buffer to a readable stream that OpenAI SDK accepts
    const readable = Readable.from(req.file.buffer)
    readable.path = 'audio.webm' // SDK needs a filename to detect format

    const transcription = await getOpenAI().audio.transcriptions.create({
      file: readable,
      model: 'whisper-1',
      language: 'es'
    })

    res.json({ text: transcription.text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Process command with GPT and execute CRM actions
router.post('/command', async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'No command text' })

    const companyId = req.user.companyId
    const userId = req.user.id

    // Get context for GPT
    const [clients, tasks] = await Promise.all([
      prisma.client.findMany({ where: { companyId }, select: { id: true, name: true }, take: 20 }),
      prisma.task.findMany({ where: { companyId, userId, status: 'pending' }, take: 10 })
    ])

    const systemPrompt = `Eres un asistente de CRM inteligente. Analiza el comando del usuario y devuelve un JSON con la acción a ejecutar.

Clientes disponibles: ${JSON.stringify(clients.map(c => ({ id: c.id, name: c.name })))}
Tareas pendientes: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate })))}
Fecha actual: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Acciones disponibles:
- create_client: { action, name, email?, phone?, company? }
- list_clients: { action, status? }
- create_task: { action, title, dueDate?, priority? }
- list_tasks: { action, date? } // date en formato YYYY-MM-DD
- create_deal: { action, title, value?, clientId?, stage? }
- list_deals: { action, period? } // period: "week" | "month"
- show_dashboard: { action }
- unknown: { action, message }

Responde SOLO con JSON válido. Incluye también un campo "response" con la respuesta en español natural para el usuario.`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(completion.choices[0].message.content)
    const { action, response: aiResponse, ...params } = parsed

    let result = null
    let actionResult = null

    // Execute the action
    switch (action) {
      case 'create_client':
        result = await prisma.client.create({
          data: { name: params.name, email: params.email, phone: params.phone, company: params.company, companyId }
        })
        actionResult = { type: 'client_created', data: result }
        break

      case 'list_clients':
        result = await prisma.client.findMany({
          where: { companyId, ...(params.status && { status: params.status }) },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
        actionResult = { type: 'clients_list', data: result }
        break

      case 'create_task':
        result = await prisma.task.create({
          data: {
            title: params.title,
            dueDate: params.dueDate ? new Date(params.dueDate) : null,
            priority: params.priority || 'medium',
            userId,
            companyId
          }
        })
        actionResult = { type: 'task_created', data: result }
        break

      case 'list_tasks': {
        const today = new Date().toISOString().split('T')[0]
        const filterDate = params.date || today
        result = await prisma.task.findMany({
          where: {
            companyId,
            userId,
            status: { not: 'done' },
            ...(filterDate && {
              dueDate: {
                gte: new Date(filterDate + 'T00:00:00'),
                lte: new Date(filterDate + 'T23:59:59')
              }
            })
          },
          orderBy: { dueDate: 'asc' }
        })
        actionResult = { type: 'tasks_list', data: result }
        break
      }

      case 'create_deal':
        result = await prisma.deal.create({
          data: {
            title: params.title,
            value: parseFloat(params.value) || 0,
            stage: params.stage || 'lead',
            clientId: params.clientId || clients[0]?.id,
            companyId
          }
        })
        actionResult = { type: 'deal_created', data: result }
        break

      case 'list_deals': {
        const periodStart = new Date()
        if (params.period === 'week') periodStart.setDate(periodStart.getDate() - 7)
        else if (params.period === 'month') periodStart.setMonth(periodStart.getMonth() - 1)
        result = await prisma.deal.findMany({
          where: { companyId, createdAt: { gte: periodStart } },
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        })
        actionResult = { type: 'deals_list', data: result }
        break
      }

      case 'show_dashboard':
        actionResult = { type: 'navigate', data: { path: '/dashboard' } }
        break

      default:
        actionResult = { type: 'message', data: null }
    }

    res.json({ response: aiResponse, action: actionResult })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
