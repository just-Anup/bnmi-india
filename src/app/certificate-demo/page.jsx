'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'upload_image'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function ManageImagesPage() {
  const [docId, setDocId] = useState(null)
  const [images, setImages] = useState({})
  const [files, setFiles] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID)

        if (res.documents.length > 0) {
          const doc = res.documents[0]
          setDocId(doc.$id)
          setImages(doc)
        } else {
          const newDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            {}
          )
          setDocId(newDoc.$id)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const handleFileChange = (e, key) => {
    setFiles(prev => ({ ...prev, [key]: e.target.files[0] }))
  }

  const uploadImage = async (key) => {
    if (!docId) return alert('Loading...')
    if (!files[key]) return alert('Select image')

    try {
      const upload = await storage.createFile(BUCKET_ID, ID.unique(), files[key])

      const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, {
        [key]: fileUrl
      })

      setImages(prev => ({ ...prev, [key]: fileUrl }))
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  const sections = [
    { label: 'Certificate', key: 'certificateImage' },
    { label: 'Marksheet', key: 'marksheetImage' },
    { label: 'Admission Form', key: 'admissionImage' },
    { label: 'ID Card', key: 'idcardImage' },
    { label: 'Hall Ticket', key: 'hallticketImage' },
    { label: 'Fees Receipt', key: 'feesreceiptImage' },
    { label: 'ATC Certificate', key: 'atccertificateImage' },
    { label: 'Typing Marksheet', key: 'typingmarksheetImage' }
  ]

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">Manage Background Images</h1>

        <div className="grid md:grid-cols-2 gap-6">

          {sections.map(({ label, key }) => (
            <div key={key} className="bg-white rounded-2xl shadow-md p-4">

              <h2 className="text-lg font-semibold mb-3">{label}</h2>

              {images[key] ? (
                <img
                  src={images[key]}
                  alt={label}
                  className="w-full h-40 object-contain border rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center border rounded-lg text-gray-400 mb-3">
                  No Image
                </div>
              )}

              <input
                type="file"
                onChange={(e) => handleFileChange(e, key)}
                className="mb-3 w-full text-sm border border-gray-300 rounded-lg p-2 file:mr-3 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => uploadImage(key)}
                  disabled={!docId}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {docId ? 'Upload' : 'Loading...'}
                </button>

                {images[key] && (
                  <button
                    onClick={() => window.open(images[key], '_blank')}
                    className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Preview
                  </button>
                )}
              </div>

            </div>
          ))}

        </div>
      </div>
    </div>
  )
}
