'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { ID } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'help_settings'

export default function AdminHelpSettings() {
  const [docId, setDocId] = useState(null)
  const [data, setData] = useState({
    phone: '',
    whatsapp: '',
    instagram: '',
    facebook: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID)

    if (res.documents.length > 0) {
      const doc = res.documents[0]
      setDocId(doc.$id)
      setData(doc)
    } else {
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        data
      )
      setDocId(newDoc.$id)
    }
  }

  const handleSave = async () => {
    if (!docId) return alert('Loading...')

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      data
    )

    alert('Updated successfully ✅')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md">

        <h1 className="text-2xl font-bold mb-4">
          Help Desk Settings
        </h1>

        {/* Phone */}
        <input
          type="text"
          placeholder="Customer Care Number"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          className="w-full mb-3 p-2 border rounded-lg"
        />

        {/* WhatsApp */}
        <input
          type="text"
          placeholder="WhatsApp Number (with country code)"
          value={data.whatsapp}
          onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
          className="w-full mb-3 p-2 border rounded-lg"
        />

        {/* Instagram */}
        <input
          type="text"
          placeholder="Instagram Link"
          value={data.instagram}
          onChange={(e) => setData({ ...data, instagram: e.target.value })}
          className="w-full mb-3 p-2 border rounded-lg"
        />

        {/* Facebook */}
        <input
          type="text"
          placeholder="Facebook Link"
          value={data.facebook}
          onChange={(e) => setData({ ...data, facebook: e.target.value })}
          className="w-full mb-4 p-2 border rounded-lg"
        />

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>

      </div>
    </div>
  )
}