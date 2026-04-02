import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const { status, date } = req.query
  const where = {
    companyId: req.user.companyId,
    userId: req.user.id,
    ...(status && { status }),
    ...(date && {
      dueDate: {
        gte: new Date(date + 'T00:00:00'),
        lte: new Date(date + 'T23:59:59')
      }
    })
  }
  const tasks = await prisma.task.findMany({ where, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] })
  res.json(tasks)
})

router.post('/', async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        userId: req.user.id,
        companyId: req.user.companyId
      }
    })
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, description, dueDate, status, priority } = req.body
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { title, description, dueDate: dueDate ? new Date(dueDate) : undefined, status, priority }
    })
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
