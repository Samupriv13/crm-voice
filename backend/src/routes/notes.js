import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.post('/', async (req, res) => {
  try {
    const { content, clientId } = req.body
    const note = await prisma.note.create({
      data: { content, clientId, userId: req.user.id }
    })
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  await prisma.note.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
