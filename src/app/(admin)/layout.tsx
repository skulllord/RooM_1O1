import { redirect } from 'next/navigation'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { getCurrentAdminSession } from '@/lib/admin-session'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentAdminSession()

  if (!session) {
    redirect('/login?message=Please+sign+in+to+access+the+admin+dashboard.')
  }

  return (
    <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_32rem),radial-gradient(circle_at_bottom_left,hsl(185_100%_30%/0.12),transparent_26rem)]">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-3 py-4 pb-24 sm:px-5 sm:py-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
