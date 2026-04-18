'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  Coffee,
  Gamepad2,
  LayoutDashboard,
  LineChart,
  MonitorPlay,
  Receipt,
  Settings,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard#customers', icon: Users },
  { name: 'Machines', href: '/dashboard#machines', icon: MonitorPlay },
  { name: 'Bookings', href: '/dashboard#bookings', icon: CalendarCheck },
  { name: 'Active Sessions', href: '/dashboard#active-sessions', icon: Gamepad2 },
  { name: 'Billing', href: '/dashboard#billing', icon: Receipt },
  { name: 'Food Orders', href: '/dashboard#food-orders', icon: Coffee },
  { name: 'Reports', href: '/dashboard#reports', icon: LineChart },
  { name: 'Settings', href: '/dashboard#settings', icon: Settings },
]

const mobileNavItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard#bookings', icon: CalendarCheck },
  { name: 'Active', href: '/dashboard#active-sessions', icon: Gamepad2 },
  { name: 'Food', href: '/dashboard#food-orders', icon: Coffee },
  { name: 'Orders', href: '/dashboard#orders', icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()
  const [activeHash, setActiveHash] = useState('')

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash)

    syncHash()
    window.addEventListener('hashchange', syncHash)

    const sectionIds = mobileNavItems
      .map((item) => item.href.split('#')[1])
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry) {
          setActiveHash(`#${visibleEntry.target.id}`)
        }
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.15, 0.35, 0.6],
      }
    )

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)

      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      window.removeEventListener('hashchange', syncHash)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-64 border-r border-primary/20 bg-black/55 backdrop-blur-2xl md:block">
        <div className="flex h-16 items-center border-b border-border/50 px-6">
          <Image
            src="/game cafe logo.jpg"
            alt="RooM_1O1 Logo"
            width={36}
            height={36}
            className="mr-3 rounded-2xl border border-primary/50 object-cover shadow-[0_0_24px_-8px_hsl(var(--primary))]"
          />
          <div className="leading-tight">
            <span className="block text-xl font-black tracking-wider text-foreground">RooM_1O1</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Command
            </span>
          </div>
        </div>

        <div className="px-3 py-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard' && pathname === '/dashboard'
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center overflow-hidden rounded-2xl px-3 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-[0_0_30px_-18px_hsl(var(--primary))]'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  {isActive ? (
                    <span className="absolute top-0 left-0 h-full w-1 rounded-r-full bg-primary glow-primary" />
                  ) : null}
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <nav className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-[1.75rem] border border-primary/20 bg-black/85 p-1.5 shadow-2xl backdrop-blur-2xl md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const itemHash = item.href.includes('#') ? `#${item.href.split('#')[1]}` : ''
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' && !activeHash
              : activeHash === itemHash

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setActiveHash(itemHash)}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl px-1 text-[11px] font-semibold transition',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
