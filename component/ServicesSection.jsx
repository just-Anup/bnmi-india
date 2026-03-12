'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'services'

export default function ServicesSection() {
  const [services, setServices] = useState([])
  const [index, setIndex] = useState(0)

  const itemsPerView = 4

  /* ---------------- FETCH SERVICES ---------------- */
useEffect(() => {
  const fetchServices = async () => {
    try {

      if (!databases || !DATABASE_ID) return   // FIX

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )

      setServices(res.documents)

    } catch (error) {
      console.error('Services load failed:', error)
    }
  }

  fetchServices()
}, [])
  const maxIndex =
    services.length > 0
      ? Math.ceil(services.length / itemsPerView) - 1
      : 0

  return (
    <section className="w-full bg-[#1c1c1c] py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center text-white">

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold">
          Professional & <span className="text-[#19b9f1]">Trust-Focused</span>
        </h2>

        <p className="mt-6 text-gray-300 max-w-2xl mx-auto">
          We provide effective learning solutions, committed to delivering exceptional education.
        </p>

        {/* Slider */}
        <div className="relative mt-20">

          <div
            className="flex gap-8 transition-transform duration-500"
            style={{
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {services.map((item) => (
              <div
                key={item.$id}
                className="min-w-[100%] sm:min-w-[50%] lg:min-w-[25%]"
              >
                <ServiceCard
  title={item.title}
  imageUrl={item.imageUrl}
  text={item.description}
/>

              </div>
            ))}
          </div>

          {/* Arrows */}
          {services.length > itemsPerView && (
            <>
              <button
                onClick={() => setIndex(Math.max(index - 1, 0))}
                className="w-20 h-20 absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 text-white"
              >
                ‹
              </button>

              <button
                onClick={() =>
                  setIndex(Math.min(index + 1, maxIndex))
                }
                className="w-20 h-20 absolute right-0 top-1/2 -translate-y-1/2 bg-black/60 text-white"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {services.length > itemsPerView && (
          <div className="mt-10 flex justify-center gap-3">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <span
                key={i}
                onClick={() => setIndex(i)}
                className={`cursor-pointer h-1 ${
                  i === index
                    ? 'w-8 bg-[#19b9f1]'
                    : 'w-3 bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ================= SERVICE CARD ================= */

function ServiceCard({ title, text, imageUrl }) {
  return (
    <div className="group relative overflow-hidden
      bg-gradient-to-b from-black to-[#111]
      p-8 text-center border border-white/5
      transition-all duration-500 hover:border-[#19b9f1]
      min-h-[320px]">

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-white -translate-y-full
        group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />

      <div className="relative z-10 transition-colors duration-500 group-hover:text-black">

        {/* IMAGE SAME SIZE AS ICON */}
        <div className="mb-6 flex justify-center">
          {imageUrl && (
            <img
              src={imageUrl}
              className="w-14 h-14 object-contain transition-all duration-500 group-hover:invert"
            />
          )}
        </div>

        <h3 className="font-bold text-lg mb-4">
          {title}
        </h3>

        <p className="text-gray-400 text-sm leading-relaxed transition-colors duration-500 group-hover:text-gray-700">
          {text}
        </p>

      </div>
    </div>
  )
}
