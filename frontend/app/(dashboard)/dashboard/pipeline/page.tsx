'use client'
import { useEffect, useState } from 'react'
import { Plus, DollarSign, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'border-gray-300 bg-gray-50' },
  { id: 'contact', label: 'Contacto', color: 'border-blue-300 bg-blue-50' },
  { id: 'proposal', label: 'Propuesta', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'negotiation', label: 'Negociación', color: 'border-orange-300 bg-orange-50' },
  { id: 'closed_won', label: 'Ganado ✓', color: 'border-green-300 bg-green-50' },
  { id: 'closed_lost', label: 'Perdido ✗', color: 'border-red-300 bg-red-50' },
]

interface Deal {
  id: string; title: string; value: number; stage: string
  client?: { name: string }; clientId: string
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', value: '', stage: 'lead', clientId: '' })
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const fetchDeals = async () => {
    const [d, c] = await Promise.all([api.get('/api/deals'), api.get('/api/clients')])
    setDeals(d.data)
    setClients(c.data)
  }

  useEffect(() => { fetchDeals() }, [])

  const handleSave = async () => {
    if (!form.title || !form.clientId) return
    setLoading(true)
    await api.post('/api/deals', form)
    setShowModal(false)
    setForm({ title: '', value: '', stage: 'lead', clientId: '' })
    fetchDeals()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await api.delete(`/api/deals/${id}`)
    fetchDeals()
  }

  const handleDrop = async (stage: string) => {
    if (!dragging || dragging === stage) return
    const deal = deals.find(d => d.id === dragging)
    if (!deal) return
    await api.put(`/api/deals/${dragging}`, { ...deal, stage })
    setDragging(null)
    fetchDeals()
  }

  const dealsByStage = (stage: string) => deals.filter(d => d.stage === stage)
  const totalByStage = (stage: string) => dealsByStage(stage).reduce((s, d) => s + d.value, 0)

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de ventas</h1>
          <p className="text-gray-500 text-sm mt-1">Arrastra los negocios entre etapas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo negocio
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(({ id, label, color }) => (
          <div
            key={id}
            className={clsx('flex-shrink-0 w-64 rounded-2xl border-2 border-dashed p-3 min-h-[400px] transition-all', color)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
              <div className="text-right">
                <p className="text-xs text-gray-500">{dealsByStage(id).length} negocios</p>
                <p className="text-xs font-medium text-gray-700">${totalByStage(id).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              {dealsByStage(id).map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => setDragging(deal.id)}
                  onDragEnd={() => setDragging(null)}
                  className="bg-white rounded-xl p-3 shadow-sm border border-white/80 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{deal.title}</p>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{deal.client?.name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{deal.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Nuevo negocio</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                <input type="text" className="input" value={form.title} onChange={f('title')} placeholder="Nombre del negocio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
                <select className="input" value={form.clientId} onChange={f('clientId')}>
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor ($)</label>
                  <input type="number" className="input" value={form.value} onChange={f('value')} placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Etapa</label>
                  <select className="input" value={form.stage} onChange={f('stage')}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="btn-primary" disabled={loading || !form.title || !form.clientId}>
                {loading ? 'Guardando...' : 'Crear negocio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
