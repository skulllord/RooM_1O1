'use client'

import { startTransition, useState } from 'react'
import Script from 'next/script'
import { BadgeIndianRupee } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  completeRazorpayPayment,
  rejectRazorpayPayment,
} from '@/app/(customer)/book/payment/actions'

declare global {
  interface Window {
    Razorpay: any
  }
}

type RazorpayCheckoutButtonProps = {
  bookingId: string
  amount: number
  providerOrderId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
}

export function RazorpayCheckoutButton({
  bookingId,
  amount,
  providerOrderId,
  customerName,
  customerEmail,
  customerPhone,
}: RazorpayCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = () => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      alert('Razorpay SDK failed to load. Please check your connection or disable adblockers.')
      return
    }

    setIsProcessing(true)

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use the public key explicitly from env
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'RooM_1O1',
      description: 'PS5 Station Booking',
      order_id: providerOrderId,
      prefill: {
        name: customerName,
        email: customerEmail || undefined,
        contact: customerPhone || undefined,
      },
      theme: {
        color: '#ff0033', // Primary brand color fallback
      },
      handler: function (response: any) {
        startTransition(() => {
          const formData = new FormData()
          formData.append('bookingId', bookingId)
          formData.append('razorpay_payment_id', response.razorpay_payment_id)
          formData.append('razorpay_order_id', response.razorpay_order_id)
          formData.append('razorpay_signature', response.razorpay_signature)
          completeRazorpayPayment(formData)
        })
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false)
        },
      },
    }

    const rzp = new window.Razorpay(options)

    rzp.on('payment.failed', function (response: any) {
      startTransition(() => {
        const formData = new FormData()
        formData.append('bookingId', bookingId)
        formData.append('razorpay_error', JSON.stringify(response.error))
        rejectRazorpayPayment(formData)
      })
    })

    rzp.open()
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Button
        className="h-13 w-full rounded-2xl text-base font-bold shadow-[0_0_35px_-15px_hsl(var(--primary))]"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        <BadgeIndianRupee className="mr-2 h-5 w-5" />
        {isProcessing ? 'Connecting to Razorpay...' : 'Pay securely via Razorpay'}
      </Button>
    </>
  )
}
