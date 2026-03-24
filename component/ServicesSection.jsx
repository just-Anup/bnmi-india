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
        if (!databases || !DATABASE_ID) return

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
    <section className="w-full bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center text-white">

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Professional &{' '}
          <span className="text-[#19b9f1]">Trust-Focused</span>
        </h2>

        <p className="mt-5 text-gray-400 max-w-2xl mx-auto text-lg">
          We provide effective learning solutions, committed to delivering exceptional education.
        </p>

        {/* EMPTY STATE */}
        {services.length === 0 && (
          <p className="mt-10 text-gray-500">
            No services available
          </p>
        )}

        {/* Slider */}
        {services.length > 0 && (
          <div className="relative mt-20">

            <div
              className="flex gap-8 transition-transform duration-500 ease-in-out"
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
                    state={item.state}
                  />
                </div>
              ))}
            </div>

            {/* Arrows */}
            {services.length > itemsPerView && (
              <>
                <button
                  onClick={() => setIndex(Math.max(index - 1, 0))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 
                  w-12 h-12 rounded-full bg-white/10 backdrop-blur-md 
                  border border-white/20 hover:bg-[#19b9f1] transition"
                >
                  ‹
                </button>

                <button
                  onClick={() =>
                    setIndex(Math.min(index + 1, maxIndex))
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 
                  w-12 h-12 rounded-full bg-white/10 backdrop-blur-md 
                  border border-white/20 hover:bg-[#19b9f1] transition"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}

        {/* Dots */}
        {services.length > itemsPerView && (
          <div className="mt-10 flex justify-center gap-3">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <span
                key={i}
                onClick={() => setIndex(i)}
                className={`cursor-pointer rounded-full transition-all duration-300 ${
                  i === index
                    ? 'w-8 h-2 bg-[#19b9f1]'
                    : 'w-3 h-2 bg-gray-600'
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

function ServiceCard({ title, text, imageUrl, state }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden
      bg-white/5 backdrop-blur-xl
      p-8 text-center border border-white/10
      transition-all duration-500
      hover:-translate-y-3 hover:shadow-[0_10px_40px_rgba(25,185,241,0.25)]
      min-h-[360px]">

      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
        transition duration-500 bg-gradient-to-br from-[#19b9f1]/20 to-transparent blur-xl" />

      <div className="relative z-10 flex flex-col items-center">

        {/* Image */}
        <div className="mb-5 flex justify-center">
          <div className="w-16 h-16 flex items-center justify-center 
            rounded-full bg-white/10 border border-white/20
            group-hover:bg-[#19b9f1]/20 transition">
            {imageUrl && (
              <img
                src={imageUrl}
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-xl tracking-wide">
          {title}
        </h3>


        {/* Description */}
        <p className="mt-4 text-gray-400 text-sm leading-relaxed 
        group-hover:text-gray-300 transition">
          {text}
        </p>

        
        {/* STATE BADGE */}
        {state && (
          <span className="mt-2 px-3 py-1 text-xs rounded-full 
          bg-[#19b9f1]/20 text-[#19b9f1] border border-[#19b9f1]/30">
            📍 {state}
          </span>
        )}


      </div>
    </div>
  )
}