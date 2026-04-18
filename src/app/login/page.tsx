import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentAdminSession } from '@/lib/admin-session'

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string
    message?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined
  const session = await getCurrentAdminSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            Admin access only
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Secure dashboard sign-in for cafe staff
          </h1>
          <p className="text-muted-foreground">
            Customer browsing can stay lightweight, but dashboard access should be protected.
            Use the admin email and password configured in this project&apos;s environment.
          </p>
          <p className="text-sm text-muted-foreground">
            For real-world use, keep customer booking public and protect only staff tools like
            bookings, revenue, and machine management.
          </p>
          <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Back to customer site
          </Link>
        </div>

        <Card className="w-full max-w-md border-border/50 bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Enter the cafe owner credentials to open dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm message={params?.message} error={params?.error} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
