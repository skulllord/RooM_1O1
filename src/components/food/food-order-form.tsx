'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { ShoppingBag, Utensils } from 'lucide-react'

import {
  createCustomerFoodOrder,
  type FoodOrderActionState,
} from '@/app/(customer)/food/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CustomerFoodItem } from '@/lib/food'
import { formatCurrency } from '@/lib/utils'

const initialState: FoodOrderActionState = {}

type FoodOrderFormProps = {
  items: CustomerFoodItem[]
}

export function FoodOrderForm({ items }: FoodOrderFormProps) {
  const [state, formAction, isPending] = useActionState(
    createCustomerFoodOrder,
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-row items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-2 sm:flex-col sm:items-stretch sm:p-3"
          >
            <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/80 sm:mb-3 sm:h-auto sm:w-full sm:aspect-[4/3]">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100px, 220px"
                  className="object-cover"
                />
              ) : (
                <Utensils className="h-5 w-5 text-muted-foreground sm:h-7 sm:w-7" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-3 sm:w-full sm:items-start">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-white">{item.name}</h4>
                <p className="mt-0.5 text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex w-[4.5rem] shrink-0 flex-col justify-center space-y-1 sm:w-20">
                <Label className="hidden text-[10px] uppercase text-muted-foreground sm:block" htmlFor={`quantity_${item.id}`}>
                  Qty
                </Label>
                <Input
                  id={`quantity_${item.id}`}
                  name={`quantity_${item.id}`}
                  type="number"
                  min={0}
                  max={20}
                  defaultValue={0}
                  className="h-8 px-1 text-center sm:h-9"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="rounded-3xl border border-primary/20 bg-background/45 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-white">Order details</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="food-customer-name">Your name</Label>
              <Input
                id="food-customer-name"
                name="customerName"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-phone-number">Phone number</Label>
              <Input
                id="food-phone-number"
                name="phoneNumber"
                placeholder="62808 43629"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="food-note">Station / note</Label>
              <Input
                id="food-note"
                name="note"
                placeholder="PS5 Station 1, table note, or pickup request"
              />
            </div>
          </div>

          {state.error ? (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {state.success}
            </p>
          ) : null}

          <Button className="mt-4 h-11 w-full sm:w-auto" disabled={isPending} type="submit">
            {isPending ? 'Placing food order...' : 'Place food order'}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 text-sm text-muted-foreground">
          Food menu is being updated. Please check again soon.
        </div>
      )}
    </form>
  )
}
