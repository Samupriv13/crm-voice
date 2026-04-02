'use client'
import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500'
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta', medium: 'Media', low: 'Baja'
}

interface Task {
  id: string; title: string; description?: string
  dueDate?: string; status: string; priority: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState('pending')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'medium' })
  const [loading, setLoading] = useState(false)

  const fetchTasks = async () => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    const { data } = await api.get(`/api/tasks?${params}`)
    setTasks(data)
  }

  useEffect(() => { fetchTasks() }, [filter])

  const handleSave = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    await api.post('/api/tasks', form)
    setShowModal(false)
    setForm({ title: '', description: '', dueDate: '', priority: 'medium' })
    fetchTasks()
    setLoading(false)
  }

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    await api.put(`/api/tasks/${task.id}`, { ...task, status: newStatus })
    fetchTasks()
  }

  const handleDelete = async (id: string) => {
    await api.delete(`/api/tasks/${id}`)
    fetchTasks()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const grouped = {
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'),
    today: tasks.filter(t => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }),
    upcoming: tasks.filter(t => !t.dueDate || new Date(t.dueDate) > new Date()),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.filter(t => t.status !== 'done').length} pendientes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[['pending', 'Pendientes'], ['in_progress', 'En progreso'], ['done', 'Completadas'], ['all', 'Todas']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === val ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Sin tareas. Crea una o usa el asistente de voz.</p>
          </div>
        ) : tasks.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'card py-4 flex items-center gap-4 hover:shadow-md transition-all',
              task.status === 'done' && 'opacity-60'
            )}
          >
            <button onClick={() => toggleStatus(task)} className="flex-shrink-0">
              {task.status === 'done'
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <Circle className="w-5 h-5 text-gray-300 hover:text-brand-500 transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium text-gray-900', task.status === 'done' && 'line-through text-gray-400')}>
                {task.title}
              </p>
              {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-3 mt-1">
                {task.dueDate && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.dueDate), "d MMM, HH:mm", { locale: es })}
                  </span>
                )}
                <span className={clsx('text-xs flex items-center gap-1', PRIORITY_COLORS[task.priority])}>
                  <Flag className="w-3 h-3" />
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            </div>
            <button onClick={() => handleDelete(task.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Nueva tarea</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                <input type="text" className="input" value={form.title} onChange={f('title')} placeholder="Descripción de la tarea" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} placeholder="Detalles opcionales..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha límite</label>
                  <input type="datetime-local" className="input" value={form.dueDate} onChange={f('dueDate')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
                  <select className="input" value={form.priority} onChange={f('priority')}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="btn-primary" disabled={loading || !form.title.trim()}>
                {loading ? 'Guardando...' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
