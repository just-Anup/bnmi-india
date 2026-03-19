'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { useParams, useRouter } from 'next/navigation'
import { ID } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'marketing_materials'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function EditPage() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id)
    setForm(res)
  }

  const handleUpdate = async () => {
    let imageUrl = form.image

    if (file) {
      const upload = await storage.createFile(BUCKET_ID, ID.unique(), file)
      imageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    }

    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, {
      ...form,
      image: imageUrl
    })

    alert('Updated successfully')
    router.push('/admin/marketing')
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Edit Material</h1>

      <input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border p-2 mb-3"
      />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 mt-3 rounded">
        Update
      </button>
    </div>
  )
}