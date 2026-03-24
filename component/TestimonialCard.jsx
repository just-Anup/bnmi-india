'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'testimonials' // ✅ make sure this matches your collection

export default function TestimonialSection() {
  const [testimonials, setTestimonials] = useState([])
  const [index, setIndex] = useState(0)

  const visibleCards = 3

  /* ================= FETCH FROM APPWRITE ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!databases || !DATABASE_ID) return

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        )

        setTestimonials(res.documents)
      } catch (error) {
        console.error('Testimonial fetch error:', error)
      }
    }

    fetchData()
  }, [])

  const total = testimonials.length

  /* ================= AUTO SLIDE ================= */
  useEffect(() => {
    if (total <= visibleCards) return

    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= total - visibleCards) {
          return 0 // 🔁 restart from beginning
        }
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [total])

  return (
    <section className="w-full bg-[#0f0f0f] py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-white">

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold">
            What Our <span className="text-[#19b9f1]">Students Say</span>
          </h2>
          <p className="mt-4 text-gray-400">
            Real feedback from our successful students
          </p>
        </div>

        {/* EMPTY STATE */}
        {total === 0 && (
          <p className="text-center mt-10 text-gray-500">
            No testimonials available
          </p>
        )}

        {/* SLIDER */}
        {total > 0 && (
          <div className="relative mt-16 overflow-hidden">

            <div
              className="flex gap-6 transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${index * (100 / visibleCards)}%)`,
              }}
            >
              {testimonials.map((item) => (
                <div
                  key={item.$id}
                  className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0"
                >
                  <TestimonialCard
                    name={item.name}
                    role={item.role}
                    image={item.imageUrl}
                    text={item.text}
                  />
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  )
}

/* ================= CARD ================= */

function TestimonialCard({
  name,
  role,
  image,
  text,
}) {
  return (
    <div className="group h-full rounded-3xl 
      bg-gradient-to-br from-white to-gray-50
      shadow-lg hover:shadow-2xl transition-all duration-500
      p-8">

      {/* Top */}
      <div className="flex justify-between items-center mb-6">

        {/* Stars */}
        <div className="flex text-yellow-400">
          ★★★★★
        </div>

        {/* Image */}
        {image && (
          <img
            src={image}
            alt={name}
            className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow"
          />
        )}
      </div>

      {/* Text */}
      <p className="text-gray-600 text-base leading-relaxed mb-6">
        “{text}”
      </p>

      {/* Bottom */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {name}
        </h3>
        <p className="text-[#19b9f1] text-sm">
          {role}
        </p>
      </div>

    </div>
  )
}