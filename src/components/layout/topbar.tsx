import { Bell, Search, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from '@/app/login/actions'
import { getAdminProfile } from '@/lib/admin-profile'

export async function Topbar() {
  const profile = await getAdminProfile()

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/75 px-4 backdrop-blur-2xl sm:h-16 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers, games, or machines..."
            className="w-full bg-secondary/30 border-none pl-9 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary glow-primary"></span>
        </Button>
        <div className="h-8 w-px bg-border/50 hidden sm:block mx-1"></div>
        <form action={signOut}>
          <Button variant="ghost" className="flex items-center gap-2 pl-2" type="submit">
            <Avatar className="h-8 w-8 border border-primary/30">
              {profile.imageUrl ? <AvatarImage src={profile.imageUrl} alt={profile.name} /> : null}
              <AvatarFallback>
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm hidden sm:flex">
              <span className="font-medium leading-none">{profile.name}</span>
              <span className="text-xs text-muted-foreground mt-1">Sign out</span>
            </div>
          </Button>
        </form>
      </div>
    </header>
  )
}
