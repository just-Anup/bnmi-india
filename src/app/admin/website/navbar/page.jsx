'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function NavbarCMS() {
  const [docId, setDocId] = useState(null)
  const [form, setForm] = useState({
    topBarText: '',
    phone: '',
    logoUrl: '',
    navMenus: '',
    showFranchiseBtn: true,
    showAdminBtn: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1)]
      )

      if (res.documents.length) {
        const d = res.documents[0]
        setDocId(d.$id)
        setForm({
          topBarText: d.topBarText || '',
          phone: d.phone || '',
          logoUrl: d.logoUrl || '',
          navMenus: d.navMenus || '',
          showFranchiseBtn: d.showFranchiseBtn ?? true,
          showAdminBtn: d.showAdminBtn ?? true,
        })
      }
    }

    fetchData()
  }, [])

  const uploadLogo = async (file) => {
    const uploaded = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    )

    const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    setForm(prev => ({ ...prev, logoUrl: url }))
  }

  const saveNavbar = async () => {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      form
    )
    alert('Navbar updated ✅')
  }

  return (

    <div className="max-w-5xl mx-auto p-8">

      <div className="bg-white shadow-xl rounded-xl p-8 space-y-6">

        <h1 className="text-3xl font-bold border-b pb-4">
          Navbar CMS
        </h1>

        {/* Top Bar Text */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Top Bar Text
          </label>

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Top Bar Text"
            value={form.topBarText}
            onChange={e => setForm({ ...form, topBarText: e.target.value })}
          />
        </div>

        {/* Phone */}

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">
            Phone Number
          </label>

          <input
            className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Phone Number"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Logo Upload */}

        <div className="space-y-3">

          <label className="font-semibold text-gray-700">
            Upload Logo
          </label>

          <input
            type="file"
            className="border rounded-lg p-3 w-full"
            onChange={e => uploadLogo(e.target.files[0])}
          />

          {form.logoUrl && (
            <img
              src={form.logoUrl}
              className="h-16 border rounded-lg mt-2"
            />
          )}

        </div>

        {/* Toggle Buttons */}

        <div className="space-y-3">

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={form.showFranchiseBtn}
              onChange={e =>
                setForm({ ...form, showFranchiseBtn: e.target.checked })
              }
              className="w-4 h-4"
            />

            <span className="text-gray-700">
              Show Franchise Login
            </span>

          </label>

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={form.showAdminBtn}
              onChange={e =>
                setForm({ ...form, showAdminBtn: e.target.checked })
              }
              className="w-4 h-4"
            />

            <span className="text-gray-700">
              Show Admin Login
            </span>

          </label>

        </div>

        {/* Save Button */}

        <button
          onClick={saveNavbar}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Save Navbar
        </button>

      </div>

    </div>

  )
}