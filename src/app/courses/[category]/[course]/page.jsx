"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION = "website_courses"
const BUCKET_ID = "6986e8a4001925504f6b"

export default function CourseDetailPage() {

  const { course, category } = useParams()

    const [courseData, setCourseData] = useState(null)

  useEffect(() => {
    if (course && category) {
        loadCourse()
    }
}, [course, category])
    const loadCourse = async () => {

        const res = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION,
          [
  Query.equal("slug", course),
  Query.equal("category", category)
]
        )

        setCourseData(res.documents[0])

    }

    const getImage = (imageId) => {

        return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    }

    if (!courseData) return <div className="p-20">Loading...</div>

    return (

        <div className="max-w-6xl mx-auto px-8 py-20">

            <img
                src={getImage(courseData.imageId)}
                className="w-full h-[400px] object-cover rounded mb-10"
            />

            <h1 className="text-4xl font-bold mb-4">
                {courseData.title}
            </h1>

            <p className="text-gray-600 text-lg mb-6">
                {courseData.description}
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">

                <div className="bg-gray-100 p-5 rounded">
                    Duration: {courseData.duration}
                </div>

                <div className="bg-gray-100 p-5 rounded">
                    Fees: ₹ {courseData.fees}
                </div>

                <div className="bg-gray-100 p-5 rounded">
                    Category: {courseData.category}
                </div>

            </div>

            <button className="bg-blue-600 text-white px-8 py-3 rounded">
                Enroll Now
            </button>

        </div>

    )

}