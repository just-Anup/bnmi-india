'use client'

import { useState, useEffect, useRef } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'

export default function StagesSection() {
  const [open, setOpen] = useState(2)
  const [data, setData] = useState(null)
  const sectionRef = useRef(null)

 useEffect(() => {
  const fetchData = async () => {
    try {

      if (!databases || !DATABASE_ID) return   // FIX

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1)]
      )

      if (res.documents.length) {
        setData(res.documents[0])
      }

    } catch (error) {
      console.error('Stages load failed:', error)
    }
  }

  fetchData()
}, [])

  useEffect(() => {
    if (!sectionRef.current) return

    gsap.fromTo(
      sectionRef.current.children,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      }
    )
  }, [data])

  if (!data) return null

  const items = [
    {
      id: 1,
      title: data.missionTitle,
      content: data.missionContent,
    },
    {
      id: 2,
      title: data.visionTitle,
      content: data.visionContent,
    },
 
  ]

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:18px_18px] opacity-40" />

      <div
        ref={sectionRef}
        className="relative max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-8"
      >
        {/* IMAGE */}
        <div>
          <img
            src={data.aboutImage}
            className="w-[800px] h-[700px]"
          />
        </div>

        {/* CONTENT */}
        <div>
          <h2 className="text-5xl font-extrabold mb-4">
            {data.aboutTitle}{' '}
          
          </h2>

          <p className="text-gray-600 mb-8">
            {data.aboutDescription}
          </p>

          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.id} className="border bg-white">
                <button
                  onClick={() =>
                    setOpen(open === item.id ? null : item.id)
                  }
                  className="w-full flex justify-between px-6 py-5"
                >
                  <span className="font-bold">
                    {item.title}
                  </span>
                  <span>
                    {open === item.id ? '−' : '+'}
                  </span>
                </button>

                {open === item.id && (
                  <div className="px-6 pb-6 text-gray-600">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
