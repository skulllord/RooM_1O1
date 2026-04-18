'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const bgImages = [
  '/background images.jpg',
  '/background images 2.jpg',
  '/background images 3.jpg',
  '/background images 4.jpg',
  '/background images 5.jpg',
]

export function BackgroundCarousel() {
  const [currentBg, setCurrentBg] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {bgImages.map((src, index) => (
        <div
          key={src}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            index === currentBg ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Image
            src={src}
            alt="RooM_1O1 Background"
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
        </div>
      ))}
    </div>
  )
}
