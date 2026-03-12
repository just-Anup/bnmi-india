"use client"

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useRouter } from "next/navigation"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION = "course_categories"
const BUCKET_ID = "6986e8a4001925504f6b" // change if your bucket id is different

export default function WorkShowcase() {

  const [categories, setCategories] = useState([])
  const router = useRouter()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION,
      [Query.orderDesc("$createdAt")]
    )

    setCategories(res.documents)

  }

  const getImage = (imageId) => {

    if (!imageId) return ""

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

  }

  return (

    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-8">

        {/* HEADING */}

        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold">
            LASTET WORKING PROJECT <br />
            WORK <span className="text-[#19b9f1]">SHOWCASE</span>
          </h2>
        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {categories.map((item) => (

            <div
              key={item.$id}
              onClick={() => router.push(`/courses/${item.slug}`)}
              className="group relative overflow-hidden cursor-pointer"
            >

              <img
                src={getImage(item.imageId)}
                className="w-full h-[380px] object-cover"
              />

              <div
                className="absolute inset-0 bg-white/80
                translate-x-[-100%] group-hover:translate-x-0
                transition-transform duration-500 ease-in-out"
              >

                <div className="absolute bottom-8 left-8">

                  <h4 className="font-bold tracking-wide">
                    {item.name}
                  </h4>

                  <p className="text-[#19b9f1] text-sm mt-1">
                    {item.subtitle}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>

  )

}