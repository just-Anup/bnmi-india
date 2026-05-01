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
  const [itemsPerView, setItemsPerView] = useState(3)

  /* ---------- RESPONSIVE ITEMS ---------- */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1)
      else if (window.innerWidth < 1024) setItemsPerView(2)
      else setItemsPerView(3)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* ---------- FETCH DATA ---------- */
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
    setIndex((prev) => (prev + 1) % Math.ceil(team.length / itemsPerView))

  const prev = () =>
    setIndex((prev) =>
      (prev - 1 + Math.ceil(team.length / itemsPerView)) %
      Math.ceil(team.length / itemsPerView)
    )

  useEffect(() => {
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [team, itemsPerView])

  if (!team.length) return null

  return (
    <section className="relative py-16 md:py-24 bg-[#1e1e1e] text-white overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4">
          We Make The Perfect{' '}
          <span className="text-[#19b9f1]">Solutions</span>
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto mb-10 md:mb-16 font-extrabold">
          OUR TEAM
        </p>

        <div className="overflow-hidden">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${index * 100}%)`,
              width: `${(team.length / itemsPerView) * 100}%`,
            }}
          >
            {team.map((member) => (
              <div
                key={member.$id}
                className="px-3"
                style={{ width: `${100 / team.length}%` }}
              >
                <div className="group">

                  <div className="overflow-hidden rounded-lg">
                    {member.imageUrl && (
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-[3000px] sm:h-[300px] md:h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>

                  <div className="mt-4 md:mt-6 text-center">
                    <h4 className="text-base md:text-lg font-bold">
                      {member.name}
                    </h4>
                   <p className="text-[#19b9f1] text-xs md:text-sm mt-1">
  {member.role}
</p>

<p className="text-gray-400 text-xs mt-1">
  {member.experience}
</p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}