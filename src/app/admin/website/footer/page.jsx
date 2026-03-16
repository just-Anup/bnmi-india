'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'

export default function FooterCMS() {
  const [docId, setDocId] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1)]
      )

      if (res.documents.length) {
        const doc = res.documents[0]
        setDocId(doc.$id)
        setForm(doc)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const saveFooter = async () => {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      form
    )
    alert('Footer updated ✅')
  }

  if (loading) return <p className="p-10">Loading...</p>

  return (

    <div className="max-w-5xl mx-auto p-8">

      <div className="bg-white shadow-xl rounded-xl p-8 space-y-6">

        <h1 className="text-3xl font-bold border-b pb-4">
          Footer Settings
        </h1>

        {/* About Text */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Footer About Text
          </label>

          <textarea
            className="border rounded-lg p-3 w-full h-28 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="About Text"
            value={form.footerAboutText || ''}
            onChange={e =>
              setForm({ ...form, footerAboutText: e.target.value })
            }
          />
        </div>

        {/* Address */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Address
          </label>

          <textarea
            className="border rounded-lg p-3 w-full h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Address"
            value={form.footerAddress || ''}
            onChange={e =>
              setForm({ ...form, footerAddress: e.target.value })
            }
          />
        </div>

        {/* Phone */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Phone Number
          </label>

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Phone"
            value={form.footerPhone || ''}
            onChange={e =>
              setForm({ ...form, footerPhone: e.target.value })
            }
          />
        </div>

        {/* Email */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Email Address
          </label>

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Email"
            value={form.footerEmail || ''}
            onChange={e =>
              setForm({ ...form, footerEmail: e.target.value })
            }
          />
        </div>

        {/* Save Button */}

        <button
          onClick={saveFooter}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Save Footer
        </button>

      </div>

    </div>

  )
}