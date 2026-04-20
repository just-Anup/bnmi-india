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
  const [courses, setCourses] = useState([])

  const [catImage, setCatImage] = useState(null)
  const [courseImage, setCourseImage] = useState(null)

  const [editingCourseId, setEditingCourseId] = useState(null)

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
    loadCourses()
  }, [])

  const loadCategories = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      CATEGORY_COLLECTION,
      [Query.orderDesc("$createdAt")]
    )

    setCategories(res.documents)
  }

  const loadCourses = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COURSE_COLLECTION,
      [Query.orderDesc("$createdAt")]
    )

    setCourses(res.documents)
  }

  const handleCategoryChange = (e) => {

    const { name, value } = e.target

    if (name === "name") {

      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, "-")

      setCategoryForm({
        ...categoryForm,
        name: value,
        slug: slug
      })

    } else {
      setCategoryForm({
        ...categoryForm,
        [name]: value
      })
    }
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

  const saveCourse = async () => {

    if (!courseForm.category) {
      alert("Please select a category")
      return
    }

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
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, "-")

      const payload = {
        title: courseForm.title,
        slug: slug,
        description: courseForm.description,
        category: courseForm.category.trim(),
        duration: courseForm.duration,
        fees: Number(courseForm.fees),
        createdAt: new Date().toISOString()
      }

      if (imageId) {
        payload.imageId = imageId
      }

      if (editingCourseId) {

        await databases.updateDocument(
          DATABASE_ID,
          COURSE_COLLECTION,
          editingCourseId,
          payload
        )

        alert("Course Updated")

      } else {

        await databases.createDocument(
          DATABASE_ID,
          COURSE_COLLECTION,
          ID.unique(),
          payload
        )

        alert("Course Added")
      }

      setCourseForm({
        title: "",
        description: "",
        category: "",
        duration: "",
        fees: ""
      })

      setCourseImage(null)
      setEditingCourseId(null)

      loadCourses()

    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const editCourse = (course) => {
    setEditingCourseId(course.$id)

    setCourseForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      duration: course.duration || "",
      fees: course.fees || ""
    })

    window.scrollTo({
      top: 600,
      behavior: "smooth"
    })
  }

  const deleteCourse = async (id) => {
    try {

      await databases.deleteDocument(
        DATABASE_ID,
        COURSE_COLLECTION,
        id
      )

      alert("Course Deleted")
      loadCourses()

    } catch (err) {
      console.log(err)
      alert("Delete failed")
    }
  }

  const cancelEdit = () => {
    setEditingCourseId(null)

    setCourseForm({
      title: "",
      description: "",
      category: "",
      duration: "",
      fees: ""
    })

    setCourseImage(null)
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
            className="border rounded-lg p-3"
          />

          <input
            name="slug"
            value={categoryForm.slug}
            disabled
            placeholder="Slug auto-generated"
            className="border rounded-lg p-3 bg-gray-100"
          />

          <input
            name="subtitle"
            value={categoryForm.subtitle}
            onChange={handleCategoryChange}
            placeholder="Subtitle"
            className="border rounded-lg p-3"
          />

          <input
            type="file"
            onChange={(e) => setCatImage(e.target.files[0])}
            className="border rounded-lg p-3"
          />

          <button
            onClick={addCategory}
            className="col-span-2 bg-blue-600 text-white py-3 rounded-lg"
          >
            Add Category
          </button>

        </div>

      </div>

      {/* COURSE SECTION */}

      <div className="bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          {editingCourseId ? "Edit Course" : "Add Course"}
        </h2>

        <div className="grid grid-cols-2 gap-5">

          <input
            name="title"
            value={courseForm.title}
            onChange={handleCourseChange}
            placeholder="Course Title"
            className="border rounded-lg p-3"
          />

          <select
            name="category"
            value={courseForm.category}
            onChange={handleCourseChange}
            className="border rounded-lg p-3"
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
            name="Rating"
            value={courseForm.fees}
            onChange={handleCourseChange}
            placeholder="Course Rating (out of 5)"
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
            onClick={saveCourse}
            className="col-span-2 bg-green-600 text-white py-3 rounded-lg"
          >
            {editingCourseId ? "Update Course" : "Add Course"}
          </button>

          {editingCourseId && (
            <button
              onClick={cancelEdit}
              className="col-span-2 bg-gray-500 text-white py-3 rounded-lg"
            >
              Cancel Edit
            </button>
          )}

        </div>

      </div>

      {/* COURSE LIST */}

      <div className="bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          All Courses
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {courses.map(course => (

            <div
              key={course.$id}
              className="border rounded-xl p-5 shadow-sm"
            >

              {course.imageId && (
                <img
                  src={getImage(course.imageId)}
                  className="h-40 w-full object-cover rounded-lg mb-4"
                />
              )}

              <h3 className="text-lg font-bold">
                {course.title}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {course.category}
              </p>

              <p className="mt-2 text-sm">
                {course.description}
              </p>

              <p className="mt-2 text-sm">
                Duration: {course.duration}
              </p>

              <p className="text-sm">
                Rating: {course.fees} ⭐⭐⭐⭐⭐
              </p>

              <div className="flex gap-3 mt-4">

                <button
                  onClick={() => editCourse(course)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteCourse(course.$id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg"
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}