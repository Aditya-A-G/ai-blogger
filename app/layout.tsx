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
      <head>
      <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(function(OneSignal) {
    OneSignal.init({
      appId: "02b9c047-5eca-4d24-8e3a-13cfee1e4623",
    });
  });
</script>
      </head>
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
