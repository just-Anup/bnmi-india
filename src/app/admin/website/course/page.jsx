"use client"

import { useEffect, useState } from "react"
import { databases, storage } from "@/lib/appwrite"
import { ID, Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const CATEGORY_COLLECTION = "course_categories"
const COURSE_COLLECTION = "website_courses"

const BUCKET_ID = "6986e8a4001925504f6b"

export default function CourseCMS() {

    const [categories, setCategories] = useState([])

    const [catImage, setCatImage] = useState(null)
    const [courseImage, setCourseImage] = useState(null)

    const [categoryForm, setCategoryForm] = useState({
        name: "",
        slug: "",
        subtitle: ""
    })

    const [courseForm, setCourseForm] = useState({
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

    const handleCategoryChange = (e) => {
        setCategoryForm({
            ...categoryForm,
            [e.target.name]: e.target.value
        })
    }

    const handleCourseChange = (e) => {
        setCourseForm({
            ...courseForm,
            [e.target.name]: e.target.value
        })
    }

    const addCategory = async () => {

        try {

            let imageId = ""

            if (catImage) {

                const upload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    catImage
                )

                imageId = upload.$id

            }

            await databases.createDocument(
                DATABASE_ID,
                CATEGORY_COLLECTION,
                ID.unique(),
                {
                    name: categoryForm.name,
                    slug: categoryForm.slug,
                    subtitle: categoryForm.subtitle,
                    imageId: imageId,
                    createdAt: new Date().toISOString()
                }
            )

            alert("Category Added")

            setCategoryForm({
                name: "",
                slug: "",
                subtitle: ""
            })

            setCatImage(null)

            loadCategories()

        } catch (err) {

            console.log(err)
            alert("Error adding category")

        }

    }

    const addCourse = async () => {

        try {

            let imageId = ""

            if (courseImage) {

                const upload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    courseImage
                )

                imageId = upload.$id

            }

            const slug = courseForm.title
                .toLowerCase()
                .replaceAll(" ", "-")

            await databases.createDocument(
                DATABASE_ID,
                COURSE_COLLECTION,
                ID.unique(),
                {
                    title: courseForm.title,
                    slug: slug,
                    description: courseForm.description,
                    category: courseForm.category,
                    duration: courseForm.duration,
                    fees: Number(courseForm.fees),
                    imageId: imageId,
                    createdAt: new Date().toISOString()
                }
            )

            alert("Course Added")

            setCourseForm({
                title: "",
                description: "",
                category: "",
                duration: "",
                fees: ""
            })

            setCourseImage(null)

        } catch(err){
            console.error("Appwrite Error:", err)
            alert(err.message)
        }
    }

    const getImage = (imageId) => {

        return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    }

    return (

        <div className="p-10 space-y-12 bg-gray-50 min-h-screen">

            <h1 className="text-3xl font-bold text-gray-800">
                Course CMS Panel
            </h1>

            {/* CATEGORY SECTION */}

            <div className="bg-white p-8 rounded-xl shadow-lg">

                <h2 className="text-xl font-semibold mb-6 text-gray-700">
                    Add Category
                </h2>

                <div className="grid grid-cols-2 gap-5">

                    <input
                        name="name"
                        value={categoryForm.name}
                        onChange={handleCategoryChange}
                        placeholder="Category Name"
                        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <input
                        name="slug"
                        value={categoryForm.slug}
                        onChange={handleCategoryChange}
                        placeholder="Slug (computer)"
                        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <input
                        name="subtitle"
                        value={categoryForm.subtitle}
                        onChange={handleCategoryChange}
                        placeholder="Subtitle"
                        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <input
                        type="file"
                        onChange={(e) => setCatImage(e.target.files[0])}
                        className="border rounded-lg p-3"
                    />

                    <button
                        onClick={addCategory}
                        className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                    >
                        Add Category
                    </button>

                </div>

                {/* CATEGORY LIST */}

                <div className="mt-8 grid grid-cols-4 gap-6">

                    {categories.map(cat => (
                        <div key={cat.$id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition text-center">

                            {cat.imageId && (
                                <img
                                    src={getImage(cat.imageId)}
                                    className="h-28 w-full object-cover rounded-lg mb-3"
                                />
                            )}

                            <p className="font-semibold text-gray-700">
                                {cat.name}
                            </p>

                            <p className="text-sm text-gray-500">
                                {cat.subtitle}
                            </p>

                        </div>
                    ))}

                </div>

            </div>


            {/* COURSE SECTION */}

            <div className="bg-white p-8 rounded-xl shadow-lg">

                <h2 className="text-xl font-semibold mb-6 text-gray-700">
                    Add Course
                </h2>

                <div className="grid grid-cols-2 gap-5">

                    <input
                        name="title"
                        value={courseForm.title}
                        onChange={handleCourseChange}
                        placeholder="Course Title"
                        className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
                    />

                    <select
                        name="category"
                        value={courseForm.category}
                        onChange={handleCourseChange}
                        className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
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
                        value={courseForm.duration}
                        onChange={handleCourseChange}
                        placeholder="Course Duration"
                        className="border rounded-lg p-3"
                    />

                    <input
                        name="fees"
                        value={courseForm.fees}
                        onChange={handleCourseChange}
                        placeholder="Course Fees"
                        className="border rounded-lg p-3"
                    />

                    <input
                        type="file"
                        onChange={(e) => setCourseImage(e.target.files[0])}
                        className="border rounded-lg p-3"
                    />

                    <textarea
                        name="description"
                        value={courseForm.description}
                        onChange={handleCourseChange}
                        placeholder="Course Description"
                        className="border rounded-lg p-3 col-span-2 h-32"
                    />

                    <button
                        onClick={addCourse}
                        className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition"
                    >
                        Add Course
                    </button>

                </div>

            </div>

        </div>

    )

}