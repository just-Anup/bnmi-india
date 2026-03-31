'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'

export default function Hero() {
  const [hero, setHero] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchHero = async () => {
    try {

      if (!databases || !DATABASE_ID) return   // FIX

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1)]
      )

      if (res.documents.length > 0) {
        setHero(res.documents[0])
      }

    } catch (error) {
      console.error('Hero fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchHero()
}, [])

  if (loading) return null
  if (!hero) return null

  return (
    <section
      className="relative h-screen bg-cover bg-center flex items-center"
      style={{
        backgroundImage: `url(${hero.heroBgImage || '/bgimage.jpg'})`,
      }}
    >
      

      {/* Content */}
      {/* <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
        <div className="text-white max-w-xl">
          <p className="text-sky-400 mb-4 uppercase tracking-wide">
            {hero.heroSmallText || 'Welcome'}
          </p>

          <h1 className="text-5xl font-extrabold leading-tight">
            {hero.heroTitle || "We're Fulrange"} <br />
            {hero.heroSubtitle || 'Franchise Institute'}
          </h1>

          <button className="mt-8 bg-sky-400 hover:bg-sky-500 transition text-black px-8 py-4 font-semibold">
            DISCOVER MORE
          </button>
        </div>
      </div> */}
    </section>
  )
}

