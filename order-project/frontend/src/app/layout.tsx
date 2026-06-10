import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/AuthContext'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Order System',
  description: 'member · ordering · product MSA 데모 프론트엔드',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
