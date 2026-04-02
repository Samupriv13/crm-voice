'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/register', form)
      setAuth(data.user, data.company, data.token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">VoiceCRM</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta gratis</p>
        </div>

        <div className="card shadow-xl shadow-gray-200/50">
          <h2 className="text-xl font-semibold mb-6">Crear cuenta</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de empresa</label>
              <input type="text" className="input" placeholder="Mi Empresa S.A." value={form.companyName} onChange={f('companyName')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tu nombre</label>
              <input type="text" className="input" placeholder="Juan Pérez" value={form.name} onChange={f('name')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" className="input" placeholder="tu@empresa.com" value={form.email} onChange={f('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input type="password" className="input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={f('password')} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
