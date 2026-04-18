import type { Metadata } from 'next'

import { cn } from '@/lib/utils'
import { RgbGlobalEffect } from '@/components/layout/rgb-global-effect'

import './globals.css'

export const metadata: Metadata = {
  title: 'RooM_1O1 Gaming Cafe',
  description: 'Gaming Cafe Booking & Management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <RgbGlobalEffect />
        {children}
      </body>
    </html>
  )
}
