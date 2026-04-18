'use client'

import { useActionState } from 'react'
import { ImagePlus, Plus } from 'lucide-react'

import {
  addFoodItem,
  type FoodItemActionState,
} from '@/app/(admin)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: FoodItemActionState = {}

export function FoodItemForm() {
  const [state, formAction, isPending] = useActionState(addFoodItem, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="food-name">Food name</Label>
          <Input id="food-name" name="name" placeholder="Cheese sandwich" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="food-price">Price</Label>
          <Input
            id="food-price"
            name="price"
            min="1"
            placeholder="120"
            step="1"
            type="number"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="food-image">Food image</Label>
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-3">
          <ImagePlus className="h-5 w-5 text-primary" />
          <Input
            id="food-image"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            className="border-none bg-transparent p-0 file:text-foreground"
            type="file"
          />
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. Max 2 MB.</p>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
        <Plus className="mr-2 h-4 w-4" />
        {isPending ? 'Adding item...' : 'Add to food menu'}
      </Button>
    </form>
  )
}
