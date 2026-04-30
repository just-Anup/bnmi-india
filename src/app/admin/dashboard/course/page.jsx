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
  <div className="min-h-screen bg-gray-100 p-4 md:p-6 space-y-6">

    {/* HEADER */}
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
        Course CMS Panel
      </h1>
      <p className="text-gray-500 text-sm">
        Manage categories and courses easily
      </p>
    </div>

    {/* CATEGORY */}
    <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">

      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Add Category
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input name="name" value={categoryForm.name} onChange={handleCategoryChange} placeholder="Category Name" className="input-clean"/>

        <input name="slug" value={categoryForm.slug} disabled placeholder="Slug auto-generated" className="input-clean bg-gray-100"/>

        <input name="subtitle" value={categoryForm.subtitle} onChange={handleCategoryChange} placeholder="Subtitle" className="input-clean"/>

        <input type="file" onChange={(e)=>setCatImage(e.target.files[0])} className="input-clean"/>

        <button onClick={addCategory} className="btn-primary col-span-full">
          Add Category
        </button>

      </div>
    </div>

    {/* COURSE */}
    <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">

      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        {editingCourseId ? "Edit Course" : "Add Course"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input name="title" value={courseForm.title} onChange={handleCourseChange} placeholder="Course Title" className="input-clean"/>

        <select name="category" value={courseForm.category} onChange={handleCourseChange} className="input-clean">
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.$id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <input name="duration" value={courseForm.duration} onChange={handleCourseChange} placeholder="Course Duration" className="input-clean"/>

        <input name="Rating" value={courseForm.fees} onChange={handleCourseChange} placeholder="Course Rating (out of 5)" className="input-clean"/>

        <input type="file" onChange={(e)=>setCourseImage(e.target.files[0])} className="input-clean"/>

        <textarea name="description" value={courseForm.description} onChange={handleCourseChange} placeholder="Course Description" className="input-clean col-span-full h-28"/>

        <button onClick={saveCourse} className="btn-success col-span-full">
          {editingCourseId ? "Update Course" : "Add Course"}
        </button>

        {editingCourseId && (
          <button onClick={cancelEdit} className="btn-secondary col-span-full">
            Cancel Edit
          </button>
        )}

      </div>
    </div>

    {/* COURSE LIST */}
    <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200">

      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        All Courses
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {courses.map(course => (
          <div key={course.$id} className="border rounded-xl p-4 hover:shadow-md transition">

            {course.imageId && (
              <img
                src={getImage(course.imageId)}
                className="h-36 w-full object-cover rounded-lg mb-3"
              />
            )}

            <h3 className="font-semibold text-gray-800">
              {course.title}
            </h3>

            <p className="text-sm text-gray-500">
              {course.category}
            </p>

            <p className="text-sm mt-2 line-clamp-2">
              {course.description}
            </p>

            <div className="flex justify-between mt-3 text-sm">
              <span>⏱ {course.duration}</span>
              <span className="text-yellow-500 font-semibold">
                ⭐ {course.fees}
              </span>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={()=>editCourse(course)} className="btn-primary flex-1">Edit</button>
              <button onClick={()=>deleteCourse(course.$id)} className="btn-danger flex-1">Delete</button>
            </div>

          </div>
        ))}

      </div>

    </div>

  </div>
)
}