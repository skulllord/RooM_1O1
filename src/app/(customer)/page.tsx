import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Phone, Utensils } from 'lucide-react'

import { FoodOrderForm } from '@/components/food/food-order-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCustomerMachines } from '@/lib/bookings'
import { getAvailableFoodItems } from '@/lib/food'

export default async function CustomerHome() {
  const [machines, foodItems] = await Promise.all([
    getCustomerMachines(),
    getAvailableFoodItems(),
  ])

  return (
    <div className="container relative z-10 mx-auto max-w-5xl px-3 pt-2 pb-4 animate-in fade-in duration-700 sm:px-4 sm:py-8">
      <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-2xl sm:mb-12 sm:rounded-[2.5rem]">
        {/* Soft elegant RGB ambient lights */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        
        {/* Diagonal Gaming Lines */}
        <div className="absolute -right-[5%] -top-[50%] z-0 h-[200%] w-3 rotate-[35deg] bg-primary/80 shadow-[0_0_20px_hsl(var(--primary))] sm:-right-[5%] sm:w-4" />
        <div className="absolute -right-[15%] -top-[50%] z-0 h-[200%] w-3 rotate-[35deg] bg-primary/80 shadow-[0_0_20px_hsl(var(--primary))] sm:-right-[12%] sm:w-4" />
        <div className="absolute -right-[25%] -top-[50%] z-0 h-[200%] w-3 rotate-[35deg] bg-primary/80 shadow-[0_0_20px_hsl(var(--primary))] sm:-right-[19%] sm:w-4" />
        
        <div className="absolute -bottom-[50%] -left-[10%] z-0 h-[200%] w-3 rotate-[35deg] bg-primary/80 shadow-[0_0_20px_hsl(var(--primary))] sm:-left-[5%] sm:w-4" />
        
        <div className="relative z-10 px-4 py-3 sm:p-8 md:p-12 lg:p-14">
          
          <h1 className="mb-1.5 text-3xl font-extrabold tracking-tight text-white sm:mb-3 sm:text-5xl md:text-6xl lg:leading-[1.1]">
            Elevate Your <span className="text-primary">Game.</span>
          </h1>
          
          <p className="mb-3 max-w-xl text-[14px] leading-relaxed text-zinc-400 sm:mb-8 sm:text-base sm:leading-7">
            Experience zero waiting times. Reserve your premium PS5 console instantly and order snacks right to your station in just a few taps.
          </p>
          
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-4">
            <Link href="#stations" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-10 w-full rounded-xl bg-primary px-2 text-xs font-semibold text-primary-foreground shadow-[0_0_20px_-8px_hsl(var(--primary))] transition-all hover:bg-primary/90 sm:h-12 sm:rounded-2xl sm:px-8 sm:text-base sm:shadow-[0_0_30px_-5px_hsl(var(--primary))]"
              >
                Book Now
              </Button>
            </Link>
            <Link href="#food" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 px-2 text-xs font-medium text-zinc-200 transition-all hover:bg-white/10 hover:text-white sm:h-12 sm:rounded-2xl sm:px-8 sm:text-base"
              >
                Food Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="stations" className="mb-10 scroll-mt-24 sm:mb-12">
        <div className="mb-5 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Reserve
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Available Stations
            </h2>
          </div>
        </div>

        {machines.every((machine) => !machine.isBookable) ? (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Live booking is unavailable right now because the database connection is offline.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {machines.map((machine) => (
            <Card
              key={machine.slug}
              className="group relative overflow-hidden rounded-xl border-border/50 bg-card/45 shadow-[0_18px_70px_-55px_hsl(var(--primary))] backdrop-blur-xl transition-all hover:border-primary/50"
            >
              <div className="absolute top-0 z-20 h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative h-20 w-full overflow-hidden bg-black/50 sm:h-36">
                <Image
                  src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop"
                  alt={machine.name}
                  fill
                  priority={machine.slug === 'ps5-1'}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
              </div>

              <CardContent className="relative z-10 bg-card/70 p-3 backdrop-blur-md sm:p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{machine.name}</h3>
                    <p className="text-sm text-muted-foreground">{machine.controller}</p>
                  </div>
                  <div
                    className={`rounded border px-2.5 py-1 text-xs font-semibold ${
                      machine.isBookable
                        ? 'border-green-500/20 bg-green-500/10 text-green-500'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {machine.statusLabel}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Rs. {machine.hourlyRate} / hour</span>
                  </div>
                  {machine.isBookable ? (
                    <Link href={`/book?machine=${machine.slug}`}>
                      <Button size="sm" className="h-9 bg-white px-4 text-black hover:bg-gray-200">
                        Reserve
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="bg-white text-black" disabled>
                      Unavailable
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="food" className="mb-10 scroll-mt-24 sm:mb-12">
        <Card className="overflow-hidden rounded-xl border-border/50 bg-card/45 shadow-[0_20px_90px_-70px_hsl(var(--primary))] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row">
            <div className="flex flex-col justify-center border-b border-border/50 bg-secondary/30 p-4 sm:p-6 md:w-1/3 md:border-b-0 md:border-r">
              <Utensils className="mb-4 h-10 w-10 text-primary glow-text" />
              <h3 className="mb-2 text-2xl font-bold text-white">Feeling Hungry?</h3>
              <p className="text-sm text-muted-foreground">
                Choose your snacks
              </p>
            </div>
            <div className="p-3 sm:p-4 md:w-2/3">
              <FoodOrderForm items={foodItems} />
            </div>
          </div>
        </Card>
      </section>

      <section id="about" className="scroll-mt-24">
        <Card className="overflow-hidden rounded-xl border-border/50 bg-card/45 backdrop-blur-xl">
          <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                About RooM_1O1
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Gaming, food, and quick bookings near Law Gate.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                RooM_1O1 is built for fast PS5 bookings and easy snack ordering from
                mobile. Book a slot, reach the cafe, and enjoy your gaming time without waiting.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border border-primary/20 bg-background/45 p-3">
              <div className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold text-white">Near Pizza Virus law gate</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a className="font-semibold text-white" href="tel:6280843629">
                    6280843629
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
