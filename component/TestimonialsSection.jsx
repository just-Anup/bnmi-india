'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import TestimonialCard from '../component/TestimonialCard'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'testimonials'

export default function TestimonialsSection() {
  const containerRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [testimonials, setTestimonials] = useState([])

  const CARD_WIDTH = 460 // must match card width + gap

  // ✅ Fetch Data
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        if (!databases || !DATABASE_ID) return

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderAsc('order')]
        )

        setTestimonials(res?.documents || [])
      } catch (err) {
        console.error('Testimonials load failed:', err)
        setTestimonials([])
      }
    }

    fetchTestimonials()
  }, [])

  // ✅ Slide Function
  const slideTo = (i) => {
    if (!containerRef.current) return

    gsap.to(containerRef.current, {
      x: -i * CARD_WIDTH,
      duration: 0.7,
      ease: 'power3.out',
    })

    setIndex(i)
  }

  const next = () => {
    if (!testimonials.length) return
    slideTo((index + 1) % testimonials.length)
  }

  const prev = () => {
    if (!testimonials.length) return
    slideTo(
      (index - 1 + testimonials.length) %
        testimonials.length
    )
  }

  // ✅ Safe Guard
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">

      {/* Heading */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold">
          What Says Our <br />
          <span className="text-[#19b9f1]">
            Student
          </span>{' '}
          Response
        </h2>
      </div>

      {/* Left Button */}
      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:scale-110 transition p-3 rounded-full"
      >
        ‹
      </button>

      {/* Right Button */}
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:scale-110 transition p-3 rounded-full"
      >
        ›
      </button>

      {/* Slider */}
      <div className="overflow-hidden px-10">
        <div
          ref={containerRef}
          className="flex gap-6"
          style={{
            width: testimonials.length * CARD_WIDTH,
          }}
        >
          {Array.isArray(testimonials) &&
            testimonials.map((t) => (
              <TestimonialCard
                key={t.$id}
                name={t.name}
                role={t.role}
                image={t.imageUrl}
                text={t.text}
              />
            ))}
        </div>
      </div>
    </section>
  )
}