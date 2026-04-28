import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kiwi — ADHD Companion',
  description: 'Your judgment-free focus companion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
