'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { databases } from "@/lib/appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = "student_admissions"
const BUCKET_ID = "6986e8a4001925504f6b"

export default function VerifyStudent() {

  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudent()
  }, [])

  const fetchStudent = async () => {

    try {
      const res = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      )
      setStudent(res)
    } catch {
      setStudent(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Verifying student...</p>
      </div>
    )
  }

  if (student === false) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          ❌ Invalid Student ID
        </h1>
        <p className="text-gray-500">
          This student record does not exist.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">

        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Student Verified
        </h1>

        {/* Student Photo */}
        <img
          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
          className="w-24 h-24 object-cover rounded-full mx-auto mb-4 border"
        />

        <div className="space-y-2 text-gray-700 text-sm">

          <p><b>Name:</b> {student.studentName}</p>
          <p><b>Roll No:</b> {student.rollNumber}</p>
          <p><b>Course:</b> {student.courseName}</p>
          <p><b>Mobile:</b> {student.mobile}</p>
          <p><b>Institute:</b> {student.instituteName}</p>

        </div>

      </div>

    </div>
  )
}