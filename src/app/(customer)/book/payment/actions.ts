'use server'

import { redirect } from 'next/navigation'

import { setCustomerSession } from '@/lib/customer-session'
import { isDatabaseUnavailable } from '@/lib/bookings'
import { confirmRazorpayPayment, failRazorpayPayment } from '@/lib/payments'

export async function completeRazorpayPayment(formData: FormData) {
  const bookingId = String(formData.get('bookingId') ?? '')
  const providerPaymentId = String(formData.get('razorpay_payment_id') ?? '')
  const providerSignature = String(formData.get('razorpay_signature') ?? '')

  if (!bookingId || !providerPaymentId || !providerSignature) {
    redirect('/book')
  }

  try {
    const booking = await confirmRazorpayPayment(bookingId, providerPaymentId, providerSignature)
    await setCustomerSession(booking.customer.id)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      redirect(`/book/payment?booking=${bookingId}&error=database-offline`)
    }

    redirect(`/book/payment?booking=${bookingId}&error=payment-confirmation-failed`)
  }

  redirect(`/book/confirmation?booking=${bookingId}`)
}

export async function rejectRazorpayPayment(formData: FormData) {
  const bookingId = String(formData.get('bookingId') ?? '')
  const rawPayload = formData.get('razorpay_error') ?? null

  if (!bookingId) {
    redirect('/book')
  }

  try {
    await failRazorpayPayment(bookingId, rawPayload)
  } catch {
    redirect(`/book/payment?booking=${bookingId}&error=payment-failed`)
  }

  redirect('/?payment=failed')
}
