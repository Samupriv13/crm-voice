import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/metrics', async (req, res) => {
  const companyId = req.user.companyId
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const [totalClients, totalLeads, totalDeals, weekDeals, pendingTasks, todayTasks] = await Promise.all([
    prisma.client.count({ where: { companyId, status: 'active' } }),
    prisma.client.count({ where: { companyId, status: 'lead' } }),
    prisma.deal.aggregate({ where: { companyId, stage: 'closed_won' }, _sum: { value: true } }),
    prisma.deal.findMany({
      where: { companyId, createdAt: { gte: weekStart } },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.task.count({ where: { companyId, userId: req.user.id, status: 'pending' } }),
    prisma.task.findMany({
      where: {
        companyId,
        userId: req.user.id,
        status: { not: 'done' },
        dueDate: {
          gte: new Date(now.toDateString()),
          lte: new Date(now.toDateString() + ' 23:59:59')
        }
      },
      orderBy: { dueDate: 'asc' }
    })
  ])

  const pipeline = await prisma.deal.groupBy({
    by: ['stage'],
    where: { companyId },
    _count: true,
    _sum: { value: true }
  })

  res.json({
    totalClients,
    totalLeads,
    totalRevenue: totalDeals._sum.value || 0,
    pendingTasks,
    weekDeals,
    todayTasks,
    pipeline
  })
})

export default router
