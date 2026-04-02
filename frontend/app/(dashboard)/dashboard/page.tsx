'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, DollarSign, CheckSquare, ArrowUpRight, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', contact: 'Contacto', proposal: 'Propuesta',
  negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido'
}

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700',
  contact: 'bg-blue-100 text-blue-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700'
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard/metrics').then(({ data }) => {
      setMetrics(data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const stats = [
    { label: 'Clientes activos', value: metrics.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Leads', value: metrics.totalLeads, icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ingresos cerrados', value: `$${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tareas pendientes', value: metrics.pendingTasks, icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Buenos días, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Pipeline de ventas</h2>
          <div className="space-y-3">
            {metrics.pipeline.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin negocios aún</p>
            ) : metrics.pipeline.map((p: any) => (
              <div key={p.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${STAGE_COLORS[p.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {STAGE_LABELS[p.stage] || p.stage}
                  </span>
                  <span className="text-sm text-gray-500">{p._count} negocios</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${(p._sum.value || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today tasks */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            Tareas de hoy
          </h2>
          <div className="space-y-2">
            {metrics.todayTasks.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin tareas para hoy 🎉</p>
            ) : metrics.todayTasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  {t.dueDate && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(t.dueDate), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent deals */}
      {metrics.weekDeals.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Negocios recientes</h2>
          <div className="space-y-3">
            {metrics.weekDeals.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.title}</p>
                  <p className="text-xs text-gray-400">{d.client?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${d.value.toLocaleString()}</p>
                  <span className={`badge text-xs ${STAGE_COLORS[d.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {STAGE_LABELS[d.stage] || d.stage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
