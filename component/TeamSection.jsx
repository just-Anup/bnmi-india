'use client'

import { useEffect, useRef, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'team'

export default function TeamSlider() {
  const sliderRef = useRef(null)
  const [team, setTeam] = useState([])
  const [index, setIndex] = useState(0)

  const slideWidth = 300

  useEffect(() => {
    const fetchTeam = async () => {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )
      setTeam(res.documents)
    }

    fetchTeam()
  }, [])

  const next = () =>
    setIndex((prev) => (prev + 1) % team.length)

  const prev = () =>
    setIndex((prev) =>
      (prev - 1 + team.length) % team.length
    )

  useEffect(() => {
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [team])

  if (!team.length) return null

  return (
    <section className="relative py-28 bg-[#1e1e1e] text-white overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-8 text-center">

        <h2 className="text-4xl font-extrabold mb-4">
          We Make The Perfect{' '}
          <span className="text-[#19b9f1]">Solutions</span>
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto mb-16 font-extrabold ">
         OUR TEAM
        </p>

        <div className="overflow-hidden">
          <div
            ref={sliderRef}
            className="flex gap-10 transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${index * slideWidth}px)`,
            }}
          >
            {team.map((member) => (
              <div
                key={member.$id}
                className="min-w-[260px] group"
              >
                <div className="overflow-hidden">
                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="mt-6 text-center">
                  <h4 className="text-lg font-bold">
                    {member.name}
                  </h4>
                  <p className="text-[#19b9f1] text-sm mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
