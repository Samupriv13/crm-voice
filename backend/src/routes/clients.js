import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const { search, status } = req.query
  const where = {
    companyId: req.user.companyId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    })
  }
  const clients = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, include: { deals: true } })
  res.json(clients)
})

router.get('/:id', async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
    include: { deals: true, notes: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }, interactions: { orderBy: { createdAt: 'desc' } } }
  })
  if (!client) return res.status(404).json({ error: 'Not found' })
  res.json(client)
})

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body
    const client = await prisma.client.create({
      data: { name, email, phone, company, status: status || 'lead', companyId: req.user.companyId }
    })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, email, phone, company, status }
    })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
