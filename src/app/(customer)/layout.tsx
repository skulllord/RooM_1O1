import Image from 'next/image'
import Link from 'next/link'

import { CustomerMobileNav } from '@/components/customer/customer-mobile-nav'
import { BackgroundCarousel } from '@/components/layout/background-carousel'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col pb-20 sm:pb-0">
      <BackgroundCarousel />
      <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/game cafe logo.jpg"
              alt="RooM_1O1 Logo"
              width={32}
              height={32}
              className="rounded-full border border-primary/50 object-cover"
            />
            <div className="leading-tight">
              <span className="block text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                RooM_1O1
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">Gaming Cafe</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/50 hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/#stations"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/50 hover:text-white"
            >
              Book
            </Link>
            <Link
              href="/#food"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/50 hover:text-white"
            >
              Food
            </Link>
            <Link
              href="/#about"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/50 hover:text-white"
            >
              About
            </Link>
            <Link
              href="/account"
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/50 hover:text-white"
            >
              Profile
            </Link>
          </nav>

          <Link
            href="/account"
            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary sm:hidden"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/50 bg-card/20 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RooM_1O1. All rights reserved.
        </p>
      </footer>

      <CustomerMobileNav />
    </div>
  )
}
