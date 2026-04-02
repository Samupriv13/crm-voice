'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, User, Mail, Phone, Building2, Trash2, Edit2, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600'
}

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', active: 'Activo', inactive: 'Inactivo'
}

interface Client {
  id: string; name: string; email?: string; phone?: string
  company?: string; status: string; deals: any[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', status: 'lead' })
  const [loading, setLoading] = useState(false)

  const fetchClients = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const { data } = await api.get(`/api/clients?${params}`)
    setClients(data)
  }

  useEffect(() => { fetchClients() }, [search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', company: '', status: 'lead' })
    setShowModal(true)
  }

  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/api/clients/${editing.id}`, form)
      } else {
        await api.post('/api/clients', form)
      }
      setShowModal(false)
      fetchClients()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await api.delete(`/api/clients/${id}`)
    fetchClients()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} registros</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="lead">Lead</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-4">Cliente</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-4 hidden md:table-cell">Contacto</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-4 hidden lg:table-cell">Empresa</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-4">Estado</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-4 hidden lg:table-cell">Negocios</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No hay clientes. Crea uno o usa el asistente de voz.
                </td>
              </tr>
            ) : clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-600 text-sm font-semibold">{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <Link href={`/dashboard/clients/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-600">
                        {c.name}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="space-y-0.5">
                    {c.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                    {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <p className="text-sm text-gray-600">{c.company || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">{c.deals?.length || 0}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link href={`/dashboard/clients/${c.id}`} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" className="input" value={form.name} onChange={f('name')} placeholder="Juan Pérez" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" className="input" value={form.email} onChange={f('email')} placeholder="juan@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <input type="tel" className="input" value={form.phone} onChange={f('phone')} placeholder="+52 55..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
                <input type="text" className="input" value={form.company} onChange={f('company')} placeholder="Empresa S.A." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                <select className="input" value={form.status} onChange={f('status')}>
                  <option value="lead">Lead</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="btn-primary" disabled={loading || !form.name.trim()}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
