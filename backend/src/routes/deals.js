import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: { companyId: req.user.companyId },
    include: { client: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(deals)
})

router.post('/', async (req, res) => {
  try {
    const { title, value, stage, clientId } = req.body
    const deal = await prisma.deal.create({
      data: { title, value: parseFloat(value) || 0, stage: stage || 'lead', clientId, companyId: req.user.companyId },
      include: { client: { select: { name: true } } }
    })
    res.json(deal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, value, stage } = req.body
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { title, value: parseFloat(value), stage }
    })
    res.json(deal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  await prisma.deal.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
