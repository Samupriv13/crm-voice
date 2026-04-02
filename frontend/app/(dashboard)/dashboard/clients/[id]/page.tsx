'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Building2, Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700', contact: 'bg-blue-100 text-blue-700',
  proposal: 'bg-yellow-100 text-yellow-700', negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700', closed_lost: 'bg-red-100 text-red-700'
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchClient = async () => {
    const { data } = await api.get(`/api/clients/${id}`)
    setClient(data)
  }

  useEffect(() => { fetchClient() }, [id])

  const addNote = async () => {
    if (!note.trim()) return
    setLoading(true)
    await api.post('/api/notes', { content: note, clientId: id })
    setNote('')
    fetchClient()
    setLoading(false)
  }

  const deleteNote = async (noteId: string) => {
    await api.delete(`/api/notes/${noteId}`)
    fetchClient()
  }

  if (!client) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-500 text-sm">Perfil del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Información</h2>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{client.company}</span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Cliente desde {format(new Date(client.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {/* Deals */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Negocios ({client.deals.length})</h2>
          <div className="space-y-3">
            {client.deals.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin negocios</p>
            ) : client.deals.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.title}</p>
                  <span className={`badge text-xs mt-1 ${STAGE_COLORS[d.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {d.stage}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">${d.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Notas</h2>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {client.notes.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin notas</p>
            ) : client.notes.map((n: any) => (
              <div key={n.id} className="p-3 bg-gray-50 rounded-xl group">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 flex-1">{n.content}</p>
                  <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {n.user?.name} · {format(new Date(n.createdAt), 'd MMM', { locale: es })}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder="Agregar nota..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button onClick={addNote} disabled={loading || !note.trim()} className="btn-primary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
