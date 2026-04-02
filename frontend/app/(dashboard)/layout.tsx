'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import VoiceAssistant from '@/components/VoiceAssistant'
import { useAuthStore } from '@/lib/store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) router.replace('/login')
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <VoiceAssistant />
    </div>
  )
}
