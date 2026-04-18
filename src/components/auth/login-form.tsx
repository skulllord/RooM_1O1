'use client'

import { useActionState } from 'react'
import { LockKeyhole, Mail } from 'lucide-react'

import { loginAdmin, type LoginActionState } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: LoginActionState = {}

type LoginFormProps = {
  message?: string
  error?: string
}

export function LoginForm({ message, error }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState)
  const visibleError = state.error ?? error

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Admin email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter admin password"
            className="pl-9"
            required
          />
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {visibleError ? <p className="text-sm text-destructive">{visibleError}</p> : null}

      <Button className="h-10 w-full" disabled={isPending} type="submit">
        {isPending ? 'Signing in...' : 'Sign in to dashboard'}
      </Button>
    </form>
  )
}
