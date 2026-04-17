"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION = "website_courses"
const BUCKET_ID = "6986e8a4001925504f6b"

export default function CourseCategoryPage() {

  const { category } = useParams()
  const router = useRouter()

  const [courses, setCourses] = useState([])

useEffect(() => {
  if (!category) return

  loadCourses()
}, [category])

const loadCourses = async () => {

  const decodedCategory = decodeURIComponent(category)
    .toLowerCase()
    .replaceAll(" ", "-")   // 🔥 IMPORTANT

  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION,
    [
      Query.equal("category", decodedCategory)
    ]
  )

  setCourses(res.documents)
}

  const getImage = (imageId) => {

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

  }

  return (

    <div className="max-w-7xl mx-auto px-8 py-20">

      <h1 className="text-4xl font-bold mb-10 capitalize">
       {decodeURIComponent(category).replaceAll("-", " ")} 
      </h1>

      <div className="grid md:grid-cols-3 gap-8">

        {courses.map(course => (
          <div
            key={course.$id}
            onClick={() => router.push(`/courses/${category}/${course.slug}`)}
            className="border rounded shadow p-5 cursor-pointer hover:shadow-lg transition"
          >

            <img
              src={getImage(course.imageId)}
              className="w-full h-48 object-cover mb-4"
            />

            <h3 className="text-xl font-bold">
              {course.title}
            </h3>

            <p className="text-gray-600 mt-2">
              {course.description}
            </p>

            <p className="mt-3 font-semibold">
              Duration: {course.duration}
            </p>

            <p className="text-blue-600 font-bold">
              ₹ {course.fees}
            </p>

          </div>
        ))}

      </div>

    </div>

  )

}