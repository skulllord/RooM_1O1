'use client'

import { useActionState, useState } from 'react'
import { LogIn, Save, UserPlus } from 'lucide-react'

import {
  loginCustomer,
  registerCustomer,
  updateCustomerProfile,
  type CustomerAccountState,
} from '@/app/(customer)/account/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: CustomerAccountState = {}

type CustomerProfileFormProps = {
  mode: 'register' | 'login' | 'edit'
  customer?: {
    name: string
    phoneNumber: string | null
    email: string | null
  }
}

export function CustomerProfileForm({ mode, customer }: CustomerProfileFormProps) {
  const action =
    mode === 'register'
      ? registerCustomer
      : mode === 'login'
        ? loginCustomer
        : updateCustomerProfile
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [name, setName] = useState(customer?.name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(customer?.phoneNumber ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (mode === 'login') {
    return (
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-login-identifier">Phone or email</Label>
          <Input
            id="customer-login-identifier"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Phone number or email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-login-password">Password</Label>
          <Input
            id="customer-login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <Button className="h-11 w-full" disabled={isPending} type="submit">
          <LogIn className="mr-2 h-4 w-4" />
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-customer-name`}>Name</Label>
        <Input
          id={`${mode}-customer-name`}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-customer-phone`}>Phone</Label>
          <Input
            id={`${mode}-customer-phone`}
            name="phoneNumber"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="62808 43629"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-customer-email`}>Email</Label>
          <Input
            id={`${mode}-customer-email`}
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {mode === 'register' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-password">Create password</Label>
            <Input
              id="customer-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-confirm-password">Confirm password</Label>
            <Input
              id="customer-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>
        </div>
      ) : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <Button className="h-11 w-full sm:w-auto" disabled={isPending} type="submit">
        {mode === 'register' ? (
          <UserPlus className="mr-2 h-4 w-4" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isPending
          ? mode === 'register'
            ? 'Creating account...'
            : 'Saving...'
          : mode === 'register'
            ? 'Create account'
            : 'Save profile'}
      </Button>
    </form>
  )
}
