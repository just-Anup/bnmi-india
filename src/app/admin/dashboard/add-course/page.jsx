"use client"

import { useEffect, useState } from "react"
import { databases, storage } from "@/lib/appwrite"
import { ID, Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const CATEGORY_COLLECTION = "course_categories"
const COURSE_COLLECTION = "website_courses"
const BUCKET_ID = "course_images"

export default function CourseCMS() {

    const [categories, setCategories] = useState([])
    const [image, setImage] = useState(null)

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        duration: "",
        fees: ""
    })

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {

        const res = await databases.listDocuments(
            DATABASE_ID,
            CATEGORY_COLLECTION,
            [Query.orderDesc("$createdAt")]
        )

        setCategories(res.documents)

    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const addCourse = async () => {

        try {

            let imageId = ""

            if (image) {

                const upload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    image
                )

                imageId = upload.$id

            }

            const slug = form.title
                .toLowerCase()
                .replaceAll(" ", "-")

            await databases.createDocument(
                DATABASE_ID,
                COURSE_COLLECTION,
                ID.unique(),
                {
                    title: form.title,
                    slug: slug,
                    description: form.description,
                    category: form.category,
                    duration: form.duration,
                    fees: Number(form.fees),
                    imageId: imageId,
                    createdAt: new Date().toISOString()
                }
            )

            alert("Course Added Successfully")

            setForm({
                title: "",
                description: "",
                category: "",
                duration: "",
                fees: ""
            })

            setImage(null)

        } catch (err) {

            console.log(err)
            alert("Error adding course")

        }

    }

    return (

        <div className="p-10">

            <h1 className="text-2xl font-bold mb-6">
                COURSE MANAGEMENT CMS
            </h1>

            <div className="bg-white p-6 rounded shadow grid grid-cols-2 gap-4">

                <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Course Title"
                    className="border p-2"
                />

                <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="border p-2"
                >

                    <option value="">Select Category</option>

                    {categories.map(cat => (
                        <option key={cat.$id} value={cat.slug}>
                            {cat.name}
                        </option>
                    ))}

                </select>

                <input
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="Course Duration"
                    className="border p-2"
                />

                <input
                    name="fees"
                    value={form.fees}
                    onChange={handleChange}
                    placeholder="Course Fees"
                    className="border p-2"
                />

                <input
                    type="file"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="border p-2"
                />

                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Course Description"
                    className="border p-2 col-span-2"
                />

                <button
                    onClick={addCourse}
                    className="col-span-2 bg-blue-600 text-white py-2 rounded"
                >
                    Add Course
                </button>

            </div>

        </div>

    )

}