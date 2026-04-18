'use server'

import { redirect } from 'next/navigation'

import { setCustomerSession } from '@/lib/customer-session'
import { isDatabaseUnavailable } from '@/lib/bookings'
import { confirmMockRazorpayPayment, failMockRazorpayPayment } from '@/lib/payments'

export async function completeMockPayment(formData: FormData) {
  const bookingId = String(formData.get('bookingId') ?? '')

  if (!bookingId) {
    redirect('/book')
  }

  try {
    const booking = await confirmMockRazorpayPayment(bookingId)
    await setCustomerSession(booking.customer.id)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      redirect(`/book/payment?booking=${bookingId}&error=database-offline`)
    }

    redirect(`/book/payment?booking=${bookingId}&error=payment-confirmation-failed`)
  }

  redirect(`/book/confirmation?booking=${bookingId}`)
}

export async function rejectMockPayment(formData: FormData) {
  const bookingId = String(formData.get('bookingId') ?? '')

  if (!bookingId) {
    redirect('/book')
  }

  try {
    await failMockRazorpayPayment(bookingId)
  } catch {
    redirect(`/book/payment?booking=${bookingId}&error=payment-failed`)
  }

  redirect('/?payment=failed')
}
