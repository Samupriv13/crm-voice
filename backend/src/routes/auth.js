import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const router = Router()

// Register company + admin user
router.post('/register', async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body
    if (!companyName || !name || !email || !password)
      return res.status(400).json({ error: 'All fields required' })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const slug = companyName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const company = await prisma.company.create({ data: { name: companyName, slug } })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'admin', companyId: company.id }
    })

    const token = jwt.sign(
      { id: user.id, email: user.email, companyId: company.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, company })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email }, include: { company: true } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, companyId: user.companyId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: user.company
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
