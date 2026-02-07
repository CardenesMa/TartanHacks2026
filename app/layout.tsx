import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
