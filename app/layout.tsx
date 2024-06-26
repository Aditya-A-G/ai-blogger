import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/header'
import { Toaster } from 'sonner'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Blogger',
  description: 'Generated Blogs with AI'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <ClerkProvider>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Toaster position='top-right' theme='light' richColors/>
      </body>
    </ClerkProvider>
    </html>
  )
}
