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

  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Footer Settings</h1>

      <textarea
        className="border p-3 w-full"
        placeholder="About Text"
        value={form.footerAboutText || ''}
        onChange={e =>
          setForm({ ...form, footerAboutText: e.target.value })
        }
      />

      <textarea
        className="border p-3 w-full"
        placeholder="Address"
        value={form.footerAddress || ''}
        onChange={e =>
          setForm({ ...form, footerAddress: e.target.value })
        }
      />

      <input
        className="border p-3 w-full"
        placeholder="Phone"
        value={form.footerPhone || ''}
        onChange={e =>
          setForm({ ...form, footerPhone: e.target.value })
        }
      />

      <input
        className="border p-3 w-full"
        placeholder="Email"
        value={form.footerEmail || ''}
        onChange={e =>
          setForm({ ...form, footerEmail: e.target.value })
        }
      />

      <button
        onClick={saveFooter}
        className="bg-black text-white px-6 py-3"
      >
        Save Footer
      </button>
    </div>
  )
}
