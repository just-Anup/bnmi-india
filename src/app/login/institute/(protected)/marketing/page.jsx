'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'

export default function MarketPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      'marketing_materials'
    )

    // only active
    const active = res.documents.filter(item => item.status === 'active')
    setData(active)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketing Materials</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {data.map(item => (
          <div key={item.$id} className="bg-white p-4 rounded-xl shadow">

            <img src={item.image} className="h-40 w-full object-cover rounded mb-2" />

            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.description}</p>

          </div>
        ))}
      </div>
    </div>
  )
}