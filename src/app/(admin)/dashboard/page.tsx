import { BookingStatus, type Prisma } from '@prisma/client'
import { unstable_noStore as noStore } from 'next/cache'
import Image from 'next/image'
import { CalendarCheck, Gamepad2, Pencil, Receipt, Trash2, Users } from 'lucide-react'

import { AdminLiveRefresh } from '@/components/admin/admin-live-refresh'
import { AdminProfileForm } from '@/components/admin/admin-profile-form'
import { FoodItemForm } from '@/components/admin/food-item-form'
import { RemainingTime } from '@/components/booking/remaining-time'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ensureDefaultMachines,
  getFallbackMachines,
  isDatabaseUnavailable,
  withDatabaseRetry,
} from '@/lib/bookings'
import prisma from '@/lib/prisma'
import { getAdminProfile, type AdminProfile } from '@/lib/admin-profile'
import {
  getAvailableFoodItems,
  getRecentCustomerFoodOrders,
  type CustomerFoodItem,
  type CustomerFoodOrder,
} from '@/lib/food'
import { formatBookingDate, formatCurrency } from '@/lib/utils'
import { removeFoodItem, updateBookingStatus, updateFoodItem } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    customer: true
    machine: true
  }
}>

export default async function Dashboard() {
  noStore()

  let machinesCount = 0
  let activeBookings = 0
  let activeBookingsList: BookingWithRelations[] = []
  let customersCount = 0
  let todaysBookings = 0
  let recentBookings: BookingWithRelations[] = []
  let latestBooking: BookingWithRelations | null = null
  let foodItems: CustomerFoodItem[] = []
  let foodOrders: CustomerFoodOrder[] = []
  let adminProfile: AdminProfile = { name: 'Admin', imageUrl: null }
  let todaysRevenue = 0
  let databaseOffline = false
  const now = new Date()

  try {
    const [
      machineCountResult,
      activeBookingsResult,
      customersCountResult,
      todaysBookingsResult,
      recentBookingsResult,
      latestBookingResult,
      foodItemsResult,
      foodOrdersResult,
      adminProfileResult,
    ] = await withDatabaseRetry(async () => {
      await ensureDefaultMachines()

      return Promise.all([
        prisma.machine.count(),
        prisma.booking.findMany({
          include: {
            customer: true,
            machine: true,
          },
          where: {
            status: BookingStatus.CONFIRMED,
            startTime: { lte: now },
            endTime: { gt: now },
          },
          orderBy: [{ endTime: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.customer.count(),
        prisma.booking.count({
          where: {
            startTime: {
              gte: startOfToday(),
              lt: startOfTomorrow(),
            },
          },
        }),
        prisma.booking.findMany({
          include: {
            customer: true,
            machine: true,
          },
          where: {
            startTime: {
              gte: startOfToday(),
              lt: startOfTomorrow(),
            },
          },
          orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
          take: 20,
        }),
        prisma.booking.findFirst({
          include: {
            customer: true,
            machine: true,
          },
          where: {
            status: BookingStatus.CONFIRMED,
          },
          orderBy: { createdAt: 'desc' },
        }),
        getAvailableFoodItems(),
        getRecentCustomerFoodOrders(),
        getAdminProfile(),
      ])
    })

    machinesCount = machineCountResult
    activeBookings = activeBookingsResult.length
    activeBookingsList = activeBookingsResult
    customersCount = customersCountResult
    todaysBookings = todaysBookingsResult
    recentBookings = recentBookingsResult
    latestBooking = latestBookingResult
    foodItems = foodItemsResult
    foodOrders = foodOrdersResult
    adminProfile = adminProfileResult
    todaysRevenue = recentBookingsResult
      .filter((booking) => booking.status !== BookingStatus.CANCELLED)
      .reduce((total, booking) => total + getBookingAmount(booking), 0)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      databaseOffline = true
      machinesCount = getFallbackMachines().length
    } else {
      throw error
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-card/40 p-5 shadow-[0_20px_80px_-55px_hsl(var(--primary))] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Live command center
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white glow-text sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Welcome back, here&apos;s what&apos;s happening at the cafe today.
          </p>
        </div>
        <AdminLiveRefresh
          latestBookingId={latestBooking?.id}
          latestBookingLabel={
            latestBooking
              ? `${latestBooking.customer.name} - ${latestBooking.machine.name}`
              : null
          }
        />
        </div>
      </div>

      {databaseOffline ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Database is offline right now, so live bookings and customer data cannot be loaded.
        </div>
      ) : null}

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          id="machines"
          className="rounded-[1.75rem] border-border/50 bg-card/60 backdrop-blur-xl transition-colors hover:border-primary/50"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Bookings / Sessions
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeBookings}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirmed bookings currently in their time slot out of {machinesCount} machines
            </p>
          </CardContent>
        </Card>

        <Card
          id="billing"
          className="rounded-[1.75rem] border-border/50 bg-card/60 backdrop-blur-xl transition-colors hover:border-primary/50"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Revenue
            </CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(todaysRevenue)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Expected booking value today</p>
          </CardContent>
        </Card>

        <Card
          id="customers"
          className="rounded-[1.75rem] border-border/50 bg-card/60 backdrop-blur-xl transition-colors hover:border-primary/50"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{customersCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card
          id="reports"
          className="rounded-[1.75rem] border-border/50 bg-card/60 backdrop-blur-xl transition-colors hover:border-primary/50"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Bookings
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{todaysBookings}</div>
            <p className="mt-1 text-xs text-muted-foreground">Upcoming reservations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card id="food-orders" className="rounded-[1.75rem] border-border/50 bg-card/50 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">Food menu</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add snacks and drinks here. They appear on the customer food section instantly.
              </p>
            </div>
            <Badge className="w-fit bg-primary/10 text-primary">{foodItems.length} items</Badge>
          </div>

          <FoodItemForm />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {foodItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/50 bg-background/40 p-3"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{item.name}</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-muted-foreground">Visible to customers</p>
                  </div>
                  <form action={removeFoodItem}>
                    <input name="foodItemId" type="hidden" value={item.id} />
                    <Button
                      size="icon"
                      type="submit"
                      variant="ghost"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                <details className="mt-3 rounded-xl border border-border/50 bg-background/40 p-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary">
                    <Pencil className="h-4 w-4" />
                    Edit item
                  </summary>
                  <form action={updateFoodItem} className="mt-3 space-y-3">
                    <input name="foodItemId" type="hidden" value={item.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        name="name"
                        defaultValue={item.name}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        required
                      />
                      <input
                        name="price"
                        type="number"
                        min="1"
                        step="1"
                        defaultValue={item.price}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        required
                      />
                    </div>
                    <input
                      name="image"
                      accept="image/png,image/jpeg,image/webp"
                      className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground"
                      type="file"
                    />
                    <Button size="sm" type="submit" className="w-full sm:w-auto">
                      Save changes
                    </Button>
                  </form>
                </details>
              </div>
            ))}
            {foodItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No food items yet. Add your first item above.</p>
            ) : null}
          </div>
        </Card>
        <Card id="orders" className="rounded-[1.75rem] border-border/50 bg-card/50 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Customer food orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                New customer food orders appear here during live refresh.
              </p>
            </div>
            <Badge className="w-fit bg-amber-500/10 text-amber-300">
              {foodOrders.length} recent
            </Badge>
          </div>
          <div className="space-y-3">
            {foodOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border/50 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.phoneNumber}</p>
                  </div>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{order.items}</p>
                {order.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">Note: {order.note}</p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-primary">
                  {formatCurrency(order.totalPrice)}
                </p>
              </div>
            ))}
            {foodOrders.length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">
                No food orders yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card id="settings" className="rounded-[1.75rem] border-border/50 bg-card/50 p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-white">Admin profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the admin name and image shown in the admin panel.
          </p>
        </div>
        <AdminProfileForm profile={adminProfile} />
      </Card>

      <Card id="active-sessions" className="rounded-[1.75rem] border-border/50 bg-card/55 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Active sessions right now</h3>
            <p className="text-sm text-muted-foreground">
              Only confirmed bookings whose start time has passed and end time has not passed.
            </p>
          </div>
          <Badge className="w-fit bg-emerald-500/10 text-emerald-300">
            {activeBookings} active
          </Badge>
        </div>

        {activeBookingsList.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeBookingsList.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{booking.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.machine.name}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatBookingDate(booking.startTime)} to {formatBookingDate(booking.endTime)}
                </p>
                <div className="mt-3">
                  <RemainingTime startTime={booking.startTime} endTime={booking.endTime} compact />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">
            No active sessions right now. Upcoming bookings will move here automatically when their
            booked time starts.
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card id="bookings" className="col-span-4 rounded-[1.75rem] border-border/50 bg-card/55 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 ring-1 ring-primary/30 glow-primary">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recent bookings</h3>
              <p className="text-sm text-muted-foreground">
                Customers who booked a PS5 now appear here with their confirmed details.
              </p>
            </div>
          </div>

          {recentBookings.length > 0 ? (
            <>
            <div className="space-y-3 md:hidden">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-border/50 bg-background/45 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{booking.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.machine.name}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {formatBookingDate(booking.startTime)}
                  </p>
                  <div className="mt-3">
                    <RemainingTime startTime={booking.startTime} endTime={booking.endTime} compact />
                  </div>
                  <div className="mt-3">
                    <BookingActions bookingId={booking.id} status={booking.status} />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-border/50">
                    <TableCell className="font-medium text-white">{booking.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{booking.machine.name}</TableCell>
                    <TableCell className="max-w-60 whitespace-normal text-muted-foreground">
                      {formatBookingDate(booking.startTime)}
                    </TableCell>
                    <TableCell>
                      <RemainingTime
                        startTime={booking.startTime}
                        endTime={booking.endTime}
                        compact
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <BookingActions bookingId={booking.id} status={booking.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No bookings yet. The next confirmed reservation will appear here.</p>
          )}
        </Card>

        <Card id="schedule" className="col-span-3 rounded-[1.75rem] border-border/50 bg-card/55 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 rounded-full bg-secondary p-4 w-fit">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-white">Today&apos;s schedule</h3>
          <div className="mt-4 space-y-3">
            {recentBookings.slice(0, 4).map((booking) => (
              <div key={booking.id} className="rounded-xl border border-border/50 bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{booking.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.machine.name}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatBookingDate(booking.startTime)}
                </p>
                <div className="mt-3">
                  <RemainingTime
                    startTime={booking.startTime}
                    endTime={booking.endTime}
                    compact
                  />
                </div>
              </div>
            ))}
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reservations have been confirmed yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

function getBookingAmount(booking: BookingWithRelations) {
  const durationHours = Math.max(
    1,
    Math.ceil((booking.endTime.getTime() - booking.startTime.getTime()) / (60 * 60 * 1000))
  )

  return Number(booking.machine.hourlyRate) * durationHours
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfTomorrow() {
  const date = startOfToday()
  date.setDate(date.getDate() + 1)
  return date
}

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === BookingStatus.CONFIRMED) {
    return <Badge className="bg-emerald-500/10 text-emerald-300">Confirmed</Badge>
  }

  if (status === BookingStatus.CANCELLED) {
    return <Badge variant="destructive">Cancelled</Badge>
  }

  if (status === BookingStatus.COMPLETED) {
    return <Badge variant="secondary">Completed</Badge>
  }

  return <Badge variant="outline">Pending</Badge>
}

function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: BookingStatus
}) {
  if (status === BookingStatus.CANCELLED || status === BookingStatus.COMPLETED) {
    return <span className="block text-right text-xs text-muted-foreground">Closed</span>
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <form action={updateBookingStatus}>
        <input name="bookingId" type="hidden" value={bookingId} />
        <input name="status" type="hidden" value={BookingStatus.COMPLETED} />
        <Button size="sm" variant="secondary" type="submit">
          Complete
        </Button>
      </form>
      <form action={updateBookingStatus}>
        <input name="bookingId" type="hidden" value={bookingId} />
        <input name="status" type="hidden" value={BookingStatus.CANCELLED} />
        <Button size="sm" variant="destructive" type="submit">
          Cancel
        </Button>
      </form>
    </div>
  )
}
