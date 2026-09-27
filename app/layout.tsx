import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'

import MobileBottomNav from '@/components/MobileBottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { AuthGateProvider } from '@/contexts/AuthGateContext'
import './globals.css'

// geist/font ships the font files locally, so the build never depends on
// reaching fonts.googleapis.com — more reliable in CI/offline environments.

export const metadata: Metadata = {
  title: 'Fleex - Build Your Identity, Share Your World',
  description: 'Fleex is where creators build a Face, forge portfolios, blogs, shops, and short videos, and get discovered through Spark.',
  generator: 'Sagheer Muhd - Sagheer+ Lab',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fleex',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  
  themeColor: '#000000',   // was: '#f97316'
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`bg-background ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">

        <div className="md:pb-0 pb-20">
          <AuthGateProvider>{children}</AuthGateProvider>
        </div>
        <MobileBottomNav />
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
