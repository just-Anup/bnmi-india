'use client'

import { useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { useRouter } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'marketing_materials'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function AddMarketing() {
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'active'
  })

  const [file, setFile] = useState(null)

  const handleSubmit = async () => {
    if (!form.title || !file) return alert('Fill all fields')

    const upload = await storage.createFile(BUCKET_ID, ID.unique(), file)

    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        ...form,
        image: fileUrl,
        createdAt: new Date().toISOString()
      }
    )

    alert('Added successfully 🚀')
    router.push('/admin/dashboard/marketing-material')
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Add Marketing Material</h1>

      <input
        placeholder="Title"
        className="w-full border p-2 mb-3"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        placeholder="Description"
        className="w-full border p-2 mb-3"
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-3" />

      <div className="mb-3">
        <label>
          <input type="radio" checked={form.status === 'active'} onChange={() => setForm({ ...form, status: 'active' })} />
          Active
        </label>
        <label className="ml-3">
          <input type="radio" checked={form.status === 'inactive'} onChange={() => setForm({ ...form, status: 'inactive' })} />
          Inactive
        </label>
      </div>

      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
        Add
      </button>
    </div>
  )
}