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

    /* CATEGORY FORM */

    const [categoryForm, setCategoryForm] = useState({
        name: "",
        slug: "",
        subtitle: ""
    })

    /* COURSE FORM */

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

    /* HANDLE INPUT */

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

    /* ADD CATEGORY */

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

    /* ADD COURSE */

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

        <div className="p-10 space-y-12">

            <h1 className="text-2xl font-bold">
                COURSE CMS PANEL
            </h1>


            {/* CATEGORY SECTION */}

            <div className="bg-white p-6 rounded shadow">

                <h2 className="text-xl font-semibold mb-4">
                    Add Category
                </h2>

                <div className="grid grid-cols-2 gap-4">

                    <input
                        name="name"
                        value={categoryForm.name}
                        onChange={handleCategoryChange}
                        placeholder="Category Name"
                        className="border p-2"
                    />

                    <input
                        name="slug"
                        value={categoryForm.slug}
                        onChange={handleCategoryChange}
                        placeholder="Slug (computer)"
                        className="border p-2"
                    />

                    <input
                        name="subtitle"
                        value={categoryForm.subtitle}
                        onChange={handleCategoryChange}
                        placeholder="Subtitle"
                        className="border p-2"
                    />

                    <input
                        type="file"
                        onChange={(e) => setCatImage(e.target.files[0])}
                        className="border p-2"
                    />

                    <button
                        onClick={addCategory}
                        className="col-span-2 bg-blue-600 text-white py-2 rounded"
                    >
                        Add Category
                    </button>

                </div>


                {/* CATEGORY LIST */}

                <div className="mt-6 grid grid-cols-4 gap-4">

                    {categories.map(cat => (
                        <div key={cat.$id} className="border p-3 rounded text-center">

                            {cat.imageId && (
                                <img
                                    src={getImage(cat.imageId)}
                                    className="h-24 w-full object-cover mb-2"
                                />
                            )}

                            <p className="font-semibold">
                                {cat.name}
                            </p>

                        </div>
                    ))}

                </div>

            </div>


            {/* COURSE SECTION */}

            <div className="bg-white p-6 rounded shadow">

                <h2 className="text-xl font-semibold mb-4">
                    Add Course
                </h2>

                <div className="grid grid-cols-2 gap-4">

                    <input
                        name="title"
                        value={courseForm.title}
                        onChange={handleCourseChange}
                        placeholder="Course Title"
                        className="border p-2"
                    />

                    <select
                        name="category"
                        value={courseForm.category}
                        onChange={handleCourseChange}
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
                        value={courseForm.duration}
                        onChange={handleCourseChange}
                        placeholder="Course Duration"
                        className="border p-2"
                    />

                    <input
                        name="fees"
                        value={courseForm.fees}
                        onChange={handleCourseChange}
                        placeholder="Course Fees"
                        className="border p-2"
                    />

                    <input
                        type="file"
                        onChange={(e) => setCourseImage(e.target.files[0])}
                        className="border p-2"
                    />

                    <textarea
                        name="description"
                        value={courseForm.description}
                        onChange={handleCourseChange}
                        placeholder="Course Description"
                        className="border p-2 col-span-2"
                    />

                    <button
                        onClick={addCourse}
                        className="col-span-2 bg-green-600 text-white py-2 rounded"
                    >
                        Add Course
                    </button>

                </div>

            </div>

        </div>

    )

}