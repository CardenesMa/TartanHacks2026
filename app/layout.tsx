import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Drawing Game',
  description: 'Multiplayer drawing game with P2P messaging',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </Suspense>
  )
}
