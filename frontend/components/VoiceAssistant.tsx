'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, X, Send, Volume2, VolumeX, Bot, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  text: string
  action?: any
}

export default function VoiceAssistant() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '¡Hola! Soy tu asistente de CRM. Puedes hablar o escribir comandos como "Agrega un cliente llamado Juan" o "¿Qué tareas tengo hoy?"' }
  ])
  const [input, setInput] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'es-ES'
    utter.rate = 1.05
    utter.pitch = 1
    // Try to find a Spanish voice
    const voices = window.speechSynthesis.getVoices()
    const esVoice = voices.find(v => v.lang.startsWith('es'))
    if (esVoice) utter.voice = esVoice
    synthRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [ttsEnabled])

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const { data } = await api.post('/api/voice/command', { text })
      const assistantMsg: Message = { role: 'assistant', text: data.response, action: data.action }
      setMessages(prev => [...prev, assistantMsg])
      speak(data.response)

      // Handle navigation actions
      if (data.action?.type === 'navigate') {
        router.push(data.action.data.path)
      }
    } catch {
      const errMsg = 'Lo siento, hubo un error procesando tu comando.'
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }])
      speak(errMsg)
    } finally {
      setLoading(false)
    }
  }, [speak, router])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')
        setLoading(true)
        try {
          const { data } = await api.post('/api/voice/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (data.text) await processCommand(data.text)
        } catch {
          setMessages(prev => [...prev, { role: 'assistant', text: 'No pude transcribir el audio. Intenta escribir tu comando.' }])
        } finally {
          setLoading(false)
        }
      }
      recorder.start()
      mediaRef.current = recorder
      setRecording(true)
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current = null
    setRecording(false)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    await processCommand(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50',
          open ? 'bg-gray-800 rotate-0' : 'bg-brand-500 hover:bg-brand-600 hover:scale-110'
        )}
        aria-label="Asistente de voz"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-slide-up overflow-hidden"
          style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Asistente CRM</p>
                <p className="text-white/70 text-xs">Powered by GPT-4 + Whisper</p>
              </div>
            </div>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="text-white/70 hover:text-white transition-colors"
              title={ttsEnabled ? 'Silenciar voz' : 'Activar voz'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx(
                  'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                )}>
                  {msg.text}
                  {msg.action && msg.action.type !== 'navigate' && msg.action.data && (
                    <ActionPreview action={msg.action} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input flex-1 text-sm py-2"
                placeholder="Escribe un comando..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || recording}
              />
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={loading}
                className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                  recording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600'
                )}
                title={recording ? 'Detener grabación' : 'Hablar'}
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {recording && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                Grabando... haz clic en el micrófono para detener
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ActionPreview({ action }: { action: any }) {
  if (!action?.data) return null
  const { type, data } = action

  if (type === 'client_created') {
    return (
      <div className="mt-2 bg-white/20 rounded-lg p-2 text-xs">
        ✅ Cliente creado: <strong>{data.name}</strong>
      </div>
    )
  }
  if (type === 'task_created') {
    return (
      <div className="mt-2 bg-white/20 rounded-lg p-2 text-xs">
        ✅ Tarea creada: <strong>{data.title}</strong>
      </div>
    )
  }
  if (type === 'deal_created') {
    return (
      <div className="mt-2 bg-white/20 rounded-lg p-2 text-xs">
        ✅ Negocio creado: <strong>{data.title}</strong>
      </div>
    )
  }
  if (type === 'clients_list' && Array.isArray(data)) {
    return (
      <div className="mt-2 bg-white/10 rounded-lg p-2 text-xs space-y-1">
        {data.slice(0, 5).map((c: any) => (
          <div key={c.id}>• {c.name} ({c.status})</div>
        ))}
        {data.length > 5 && <div>...y {data.length - 5} más</div>}
      </div>
    )
  }
  if (type === 'tasks_list' && Array.isArray(data)) {
    return (
      <div className="mt-2 bg-white/10 rounded-lg p-2 text-xs space-y-1">
        {data.length === 0 ? <div>Sin tareas pendientes</div> : data.slice(0, 5).map((t: any) => (
          <div key={t.id}>• {t.title}</div>
        ))}
      </div>
    )
  }
  return null
}
