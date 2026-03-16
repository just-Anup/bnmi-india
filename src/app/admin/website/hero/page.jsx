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

  const uploadImage = async (file) => {
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

  if (loading) return <p className="p-10">Loading Hero CMS…</p>

  return (

    <div className="max-w-5xl mx-auto p-8">

      <div className="bg-white shadow-xl rounded-xl p-8 space-y-6">

        <h1 className="text-3xl font-bold border-b pb-4">
          Hero Section CMS
        </h1>

        {/* Small Text */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Small Text
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Small Text"
            value={form.heroSmallText}
            onChange={(e) =>
              setForm({ ...form, heroSmallText: e.target.value })
            }
          />
        </div>

        {/* Hero Title */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Hero Title
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Hero Title"
            value={form.heroTitle}
            onChange={(e) =>
              setForm({ ...form, heroTitle: e.target.value })
            }
          />
        </div>

        {/* Subtitle */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Hero Subtitle
          </label>

          <input
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Hero Subtitle"
            value={form.heroSubtitle}
            onChange={(e) =>
              setForm({ ...form, heroSubtitle: e.target.value })
            }
          />
        </div>

        {/* Image Upload */}

        <div className="space-y-3">

          <label className="font-semibold text-gray-700">
            Upload Background Image
          </label>

          <input
            type="file"
            accept="image/*"
            className="border rounded-lg p-3 w-full"
            onChange={(e) => uploadImage(e.target.files?.[0])}
          />

          {uploading && (
            <p className="text-sm text-gray-500">Uploading image…</p>
          )}

        </div>

        {/* Image Preview */}

        {form.heroBgImage && (
          <div className="border rounded-lg overflow-hidden">
            <img
              src={form.heroBgImage}
              className="w-full h-52 object-cover"
            />
          </div>
        )}

        {/* Save Button */}

        <button
          onClick={saveHero}
          disabled={saving}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          {saving ? 'Saving…' : 'Save Hero'}
        </button>

      </div>

    </div>

  )
}