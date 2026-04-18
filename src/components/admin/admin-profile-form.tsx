import Image from 'next/image'
import { Save, UserRound } from 'lucide-react'

import { updateAdminProfile } from '@/app/(admin)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AdminProfile } from '@/lib/admin-profile'

type AdminProfileFormProps = {
  profile: AdminProfile
}

export function AdminProfileForm({ profile }: AdminProfileFormProps) {
  return (
    <form action={updateAdminProfile} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10">
          {profile.imageUrl ? (
            <Image src={profile.imageUrl} alt={profile.name} fill sizes="56px" className="object-cover" />
          ) : (
            <UserRound className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <p className="font-semibold text-white">{profile.name}</p>
          <p className="text-xs text-muted-foreground">Shown in admin panel</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-display-name">Display name</Label>
        <Input id="admin-display-name" name="name" defaultValue={profile.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-image">Profile image</Label>
        <Input id="admin-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
      </div>
      <Button className="w-full sm:w-auto" type="submit">
        <Save className="mr-2 h-4 w-4" />
        Save admin profile
      </Button>
    </form>
  )
}
