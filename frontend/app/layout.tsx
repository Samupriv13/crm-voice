import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VoiceCRM — Gestión inteligente con voz',
  description: 'CRM moderno con asistente de voz AI integrado'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
