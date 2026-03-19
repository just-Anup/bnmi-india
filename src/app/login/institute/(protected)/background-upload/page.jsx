'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const BUCKET_ID = '6986e8a4001925504f6b'

export default function FranchiseImages() {
  const [images, setImages] = useState({})
  const [docId, setDocId] = useState(null)
  const [files, setFiles] = useState({})

  const userId = 'CURRENT_USER_ID' // replace with real user id

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    const adminRes = await databases.listDocuments(DATABASE_ID, 'upload_image')
    const adminData = adminRes.documents[0]

    const res = await databases.listDocuments(DATABASE_ID, 'franchise_images')
    let userDoc = res.documents.find(d => d.franchiseId === userId)

    if (!userDoc) {
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        'franchise_images',
        ID.unique(),
        { franchiseId: userId }
      )
      userDoc = newDoc
    }

    setDocId(userDoc.$id)

const merged = {
  certificateImage: userDoc?.certificateImage || adminData?.certificateImage,
  marksheetImage: userDoc?.marksheetImage || adminData?.marksheetImage,
  admissionImage: userDoc?.admissionImage || adminData?.admissionImage,
  idcardImage: userDoc?.idcardImage || adminData?.idcardImage,
  hallticketImage: userDoc?.hallticketImage || adminData?.hallticketImage,
  feesreceiptImage: userDoc?.feesreceiptImage || adminData?.feesreceiptImage,
  atccertificateImage: userDoc?.atccertificateImage || adminData?.atccertificateImage,
  typingmarksheetImage: userDoc?.typingmarksheetImage || adminData?.typingmarksheetImage,
}

setImages(merged)
  }

  const handleFile = (e, key) => {
    setFiles({ ...files, [key]: e.target.files[0] })
  }

  const uploadImage = async (key) => {
    if (!files[key]) return alert('Select image')

    const upload = await storage.createFile(BUCKET_ID, ID.unique(), files[key])

    const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    await databases.updateDocument(
      DATABASE_ID,
      'franchise_images',
      docId,
      { [key]: url }
    )

    fetchImages()
  }

  const renderCard = (label, key, canUpload) => (
    <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition">

      <h3 className="text-lg font-semibold mb-3">{label}</h3>

      {images[key] ? (
        <img
          src={images[key]}
          className="w-full h-40 object-contain border rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-40 flex items-center justify-center border rounded-lg text-gray-400 mb-3">
          No Image Uploaded
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => window.open(images[key], '_blank')}
          className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
        >
          Preview
        </button>
      </div>

      {canUpload && (
        <>
          <input
            type="file"
            onChange={(e) => handleFile(e, key)}
            className="w-full mb-2 text-sm border border-gray-300 rounded-lg p-2 file:mr-3 file:py-2 file:px-4 file:border-0 file:bg-blue-50 file:text-blue-700"
          />

          <button
            onClick={() => uploadImage(key)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Upload Image
          </button>
        </>
      )}

      {!canUpload && (
        <p className="text-sm text-gray-400 mt-2">Only admin can change this</p>
      )}

    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">Manage Your Background Images</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {renderCard('Admission', 'admissionImage', true)}
          {renderCard('Fees Receipt', 'feesreceiptImage', true)}
          {renderCard('ID Card', 'idcardImage', true)}
          {renderCard('Hall Ticket', 'hallticketImage', true)}

          {renderCard('Certificate', 'certificateImage', false)}
          {renderCard('Marksheet', 'marksheetImage', false)}
          {renderCard('Typing Marksheet', 'typingmarksheetImage', false)}
          {renderCard('ATC Certificate', 'atccertificateImage', false)}

        </div>

      </div>
    </div>
  )
}