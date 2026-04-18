'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarClock, Home, Info, UserRound, Utensils } from 'lucide-react'

import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/#stations', icon: CalendarClock, label: 'Book' },
  { href: '/#food', icon: Utensils, label: 'Food' },
  { href: '/#about', icon: Info, label: 'About' },
  { href: '/account', icon: UserRound, label: 'Profile' },
]

export function CustomerMobileNav() {
  const pathname = usePathname()
  const [activeHash, setActiveHash] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      if (window.location.pathname !== '/') {
        return
      }

      // Force Home if we are at the very top
      if (window.scrollY < 80) {
        setActiveHash('')
        return
      }

      // If we are at the very bottom of the page, highlight the last section
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
        if (document.getElementById('about')) {
          setActiveHash('#about')
          return
        }
      }

      const sections = ['about', 'food', 'stations']
      let found = false
      
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // Only trigger when the section reaches the upper 40% of the screen
          if (rect.top <= window.innerHeight * 0.4) {
            setActiveHash('#' + id)
            found = true
            break
          }
        }
      }
      
      if (!found) {
        setActiveHash('')
      }
    }

    // Capture manual hash jumps
    const syncHash = () => {
      const hash = window.location.hash
      if (['#stations', '#food', '#about'].includes(hash)) {
        setActiveHash(hash)
      }
    }
    
    // Initial evaluations
    syncHash()
    // Small delay ensures we capture the browser's silent auto-scroll on page load
    setTimeout(handleScroll, 150)
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('hashchange', syncHash)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('hashchange', syncHash)
    }
  }, [])

  return (
    <nav className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-[1.75rem] border border-primary/20 bg-background/90 p-1.5 shadow-2xl backdrop-blur-2xl sm:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const itemHash = item.href.includes('#') ? `#${item.href.split('#')[1]}` : ''
        let isActive = false
        if (item.href === '/account') {
          isActive = pathname.startsWith('/account')
        } else if (item.href === '/') {
          isActive = pathname === '/' && !activeHash
        } else if (item.href === '/#stations') {
          isActive = (pathname === '/' && activeHash === '#stations') || pathname.startsWith('/book')
        } else if (item.href === '/#food') {
          isActive = pathname === '/' && activeHash === '#food'
        } else if (item.href === '/#about') {
          isActive = pathname === '/' && activeHash === '#about'
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setActiveHash(itemHash)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl px-1 text-[11px] font-semibold transition',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
