import type { Metadata } from 'next'
import { plusJakartaSans } from '@/lib/fonts';
import Script from 'next/script'
import './globals.css'
import { SoundProvider } from '@/contexts/SoundContext'
import { StudentProvider } from '@/contexts/StudentContext'
import StudentConfigModal from '@/components/StudentConfigModal'
import { AuthProvider } from '@/contexts/AuthContext'
import DataSyncProvider from '@/components/DataSyncProvider'
import AccountStatus from '@/components/AccountStatus'



export const metadata: Metadata = {
  title: 'EasyTyping - Luyện Gõ Phím Tiếng Việt',
  description: 'EasyTyping, một phiên bản của VietTyping, giúp học sinh luyện gõ phím tiếng Việt từ cơ bản đến nâng cao.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <AuthProvider>
          <DataSyncProvider>
            <SoundProvider>
              <StudentProvider>
                {children}
                <StudentConfigModal />
                <AccountStatus />
              </StudentProvider>
            </SoundProvider>
          </DataSyncProvider>
        </AuthProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-842GXMC4LK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-842GXMC4LK');
          `}
        </Script>
      </body>
    </html>
  )
}
