'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function HeroCMSPage() {
  const [docId, setDocId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    heroSmallText: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBgImage: '',
  })

  /* ---------------- INIT DOCUMENT ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.limit(1)]
        )

        if (res.documents.length > 0) {
          const doc = res.documents[0]
          setDocId(doc.$id)
          setForm({
            heroSmallText: doc.heroSmallText || '',
            heroTitle: doc.heroTitle || '',
            heroSubtitle: doc.heroSubtitle || '',
            heroBgImage: doc.heroBgImage || '',
          })
        } else {
          const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            {
              heroSmallText: '',
              heroTitle: '',
              heroSubtitle: '',
              heroBgImage: '',
            }
          )
          setDocId(doc.$id)
        }
      } catch (err) {
        console.error('INIT ERROR:', err)
        alert('Failed to load CMS')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  /* ---------------- IMAGE UPLOAD ---------------- */const uploadImage = async (file) => {
    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      )

      const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

      setForm(prev => ({
        ...prev,
        heroBgImage: url,
      }))


      alert('Image uploaded ✅')
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    }
  }

  /* ---------------- SAVE HERO ---------------- */
  const saveHero = async () => {
    if (!docId) return

    setSaving(true)

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        docId,
        form
      )
      alert('Hero saved successfully ✅')
    } catch (err) {
      console.error('SAVE ERROR:', err)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-6">Loading Hero CMS…</p>

  return (
    <div className="max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-6">Hero Section</h1>

      <input
        className="w-full border p-3 mb-4"
        placeholder="Small Text"
        value={form.heroSmallText}
        onChange={(e) =>
          setForm({ ...form, heroSmallText: e.target.value })
        }
      />

      <input
        className="w-full border p-3 mb-4"
        placeholder="Hero Title"
        value={form.heroTitle}
        onChange={(e) =>
          setForm({ ...form, heroTitle: e.target.value })
        }
      />

      <input
        className="w-full border p-3 mb-4"
        placeholder="Hero Subtitle"
        value={form.heroSubtitle}
        onChange={(e) =>
          setForm({ ...form, heroSubtitle: e.target.value })
        }
      />

      {/* IMAGE UPLOAD */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadImage(e.target.files?.[0])}
        />
        {uploading && <p className="text-sm mt-2">Uploading image…</p>}
      </div>

      {form.heroBgImage && (
        <img
          src={form.heroBgImage}
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}

      <button
        onClick={saveHero}
        disabled={saving}
        className="bg-black text-white px-6 py-3"
      >
        {saving ? 'Saving…' : 'Save Hero'}
      </button>
    </div>
  )
}
