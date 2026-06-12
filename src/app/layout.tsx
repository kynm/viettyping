import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SoundProvider } from '@/contexts/SoundContext'
import { StudentProvider } from '@/contexts/StudentContext'
import StudentConfigModal from '@/components/StudentConfigModal'
import { AuthProvider } from '@/contexts/AuthContext'
import DataSyncProvider from '@/components/DataSyncProvider'
import AccountStatus from '@/components/AccountStatus'

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

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
      </body>
    </html>
  )
}


