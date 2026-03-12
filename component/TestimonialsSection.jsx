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

  useEffect(() => {
  const fetchTestimonials = async () => {
    try {

      if (!databases || !DATABASE_ID) return   // FIX

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )

      setTestimonials(res.documents)

    } catch (err) {
      console.error('Testimonials load failed:', err)
    }
  }

  fetchTestimonials()
}, [])

  const slideTo = (i) => {
    const width = 620
    if (!containerRef.current) return

    gsap.to(containerRef.current, {
      x: -width * i,
      duration: 0.8,
      ease: 'power3.out',
    })

    setIndex(i)
  }

  const next = () =>
    slideTo((index + 1) % testimonials.length)

  const prev = () =>
    slideTo(
      (index - 1 + testimonials.length) %
        testimonials.length
    )

  if (!testimonials.length) return null

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold">
          What Says Our <br />
          <span className="text-[#19b9f1]">
            Student
          </span>{' '}
          Response
        </h2>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2"
      >
        ‹
      </button>

      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2"
      >
        ›
      </button>

      <div className="overflow-hidden px-24">
        <div
          ref={containerRef}
          className="flex gap-10"
          style={{
            width: testimonials.length * 620,
          }}
        >
          {testimonials.map((t) => (
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
