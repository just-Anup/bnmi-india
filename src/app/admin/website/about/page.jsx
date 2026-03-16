'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function AboutCMS() {
  const [docId, setDocId] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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

  const uploadImage = async (file) => {
    setUploading(true)

    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      )

      const fileUrl = storage.getFileView(
        BUCKET_ID,
        uploaded.$id
      )

      setForm(prev => ({ ...prev, aboutImage: fileUrl }))
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    }

    setUploading(false)
  }

  const saveAbout = async () => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        docId,
        form
      )
      alert('About updated ✅')
    } catch (err) {
      console.error(err)
      alert('Save failed')
    }
  }

  if (loading) return <p className="p-10">Loading...</p>

  return (
    <div className="max-w-5xl mx-auto p-8">

      <div className="bg-white shadow-xl rounded-xl p-8 space-y-6">

        <h1 className="text-3xl font-bold border-b pb-4">
          About Page CMS
        </h1>

        {/* Main Section */}

        <div className="grid md:grid-cols-2 gap-6">

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Main Title"
            value={form.aboutTitle || ''}
            onChange={e =>
              setForm({ ...form, aboutTitle: e.target.value })
            }
          />

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Highlighted Word"
            value={form.aboutSubtitleHighlight || ''}
            onChange={e =>
              setForm({ ...form, aboutSubtitleHighlight: e.target.value })
            }
          />

        </div>

        <textarea
          className="border rounded-lg p-3 w-full h-32 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Description"
          value={form.aboutDescription || ''}
          onChange={e =>
            setForm({ ...form, aboutDescription: e.target.value })
          }
        />

        {/* Image Upload */}

        <div className="space-y-3">

          <label className="font-semibold text-gray-700">
            Upload About Image
          </label>

          <input
            type="file"
            className="border rounded-lg p-2 w-full"
            onChange={(e) => uploadImage(e.target.files[0])}
          />

          {uploading && (
            <p className="text-sm text-gray-500">Uploading image...</p>
          )}

          {form.aboutImage && (
            <img
              src={form.aboutImage}
              className="w-72 rounded-lg shadow-md border"
            />
          )}

        </div>

        {/* Accordion Section */}

        <div className="border-t pt-6 space-y-6">

          <h2 className="text-xl font-bold">
            Accordion Sections
          </h2>

          {/* Mission */}

          <div className="bg-gray-50 p-5 rounded-lg space-y-3">

            <h3 className="font-semibold text-lg">
              Mission
            </h3>

            <input
              className="border rounded-lg p-3 w-full"
              placeholder="Mission Title"
              value={form.missionTitle || ''}
              onChange={e =>
                setForm({ ...form, missionTitle: e.target.value })
              }
            />

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Mission Content"
              value={form.missionContent || ''}
              onChange={e =>
                setForm({ ...form, missionContent: e.target.value })
              }
            />

          </div>

          {/* Vision */}

          <div className="bg-gray-50 p-5 rounded-lg space-y-3">

            <h3 className="font-semibold text-lg">
              Vision
            </h3>

            <input
              className="border rounded-lg p-3 w-full"
              placeholder="Vision Title"
              value={form.visionTitle || ''}
              onChange={e =>
                setForm({ ...form, visionTitle: e.target.value })
              }
            />

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Vision Content"
              value={form.visionContent || ''}
              onChange={e =>
                setForm({ ...form, visionContent: e.target.value })
              }
            />

          </div>

          {/* Objective */}

          <div className="bg-gray-50 p-5 rounded-lg space-y-3">

            <h3 className="font-semibold text-lg">
              Objective
            </h3>

            <input
              className="border rounded-lg p-3 w-full"
              placeholder="Objective Title"
              value={form.objectiveTitle || ''}
              onChange={e =>
                setForm({ ...form, objectiveTitle: e.target.value })
              }
            />

            <textarea
              className="border rounded-lg p-3 w-full"
              placeholder="Objective Content"
              value={form.objectiveContent || ''}
              onChange={e =>
                setForm({ ...form, objectiveContent: e.target.value })
              }
            />

          </div>

        </div>

        {/* Save Button */}

        <button
          onClick={saveAbout}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Save About Section
        </button>

      </div>

    </div>
  )
}