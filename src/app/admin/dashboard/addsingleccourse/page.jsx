'use client'

import { useState, useEffect } from 'react'
import { databases, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'courses_master'

export default function CourseCMS() {

  const [courses, setCourses] = useState([])
  const [editingId, setEditingId] = useState(null)

  const awardList = [
    "CERTIFICATE",
    "DIPLOMA",
    "ADVANCE CERTIFICATE",
    "ADVANCE DIPLOMA",
    "MASTER DIPLOMA",
    "CERTIFICATE IN POST GRADUATE DIPLOMA",
    "PROFESSIONAL DIPLOMA",
    "ALL INDIA CERTIFICATE",
    "MASTER CERTIFICATE",
    "CERTIFICATE BASIC DIPLOMA",
    "ADVANCE",
    "CERTIFICATE IN PROFESSIONAL DIPLOMA",
    "POST GRADUATE",
    "POST GRADUATE DIPLOMA",
    "BASIC",
    "CERTIFICATE COURSE",
    "CERTIFICATION",
    "PRE-VOCATIONAL COURSE",
    "PERSONAL",
  "HIGHER DIPLOMA",
  ]

  const editCourse = (course) => {

  setForm({
    courseCode: course.courseCode,
    award: course.award,
    courseTitle: course.courseName.replace(`${course.award} IN `, ''),
    duration: course.duration,
    courseFees: course.courseFees || ''
  })

  setEditingId(course.$id)
}

  const [form, setForm] = useState({
    courseCode: '',
    award: '',
    courseTitle: '',
    duration: '',
    courseFees: ''
  })

  const fetchCourses = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('courseCode'),
        Query.limit(500) // 🔥 increase limit
      ]
    )
    setCourses(res.documents)
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

const addCourse = async () => {

  if (
    !form.courseCode ||
    !form.award ||
    !form.courseTitle ||
    !form.duration ||
    !form.courseFees
  ) {
    alert("Please fill all fields")
    return
  }

  const courseName = `${form.award} IN ${form.courseTitle}`

  if (editingId) {

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      editingId,
      {
        courseCode: form.courseCode,
        courseName,
        duration: form.duration,
        award: form.award,
        courseFees: form.courseFees
      }
    )

    alert("Course Updated Successfully")

    setEditingId(null)

  } else {

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        courseCode: form.courseCode,
        courseName,
        duration: form.duration,
        award: form.award,
        courseFees: form.courseFees,
        status: "Active"
      }
    )

    alert("Course Added Successfully")
  }

  setForm({
    courseCode: '',
    award: '',
    courseTitle: '',
    duration: '',
    courseFees: ''
  })

  fetchCourses()
}

  const deleteCourse = async (id) => {

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID,
      id
    )

    fetchCourses()
  }

  return (

    <div className="p-10">

      <h2 className="text-2xl font-bold mb-6">
        Course Management
      </h2>

      {/* ADD COURSE */}
      <div className="bg-white shadow p-6 rounded-lg mb-8">

        <h3 className="text-lg font-semibold mb-4">
          Add New Course
        </h3>

        <div className="grid grid-cols-2 gap-4">

          <input
            type="text"
            name="courseCode"
            placeholder="Course Code"
            value={form.courseCode}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <select
            name="award"
            value={form.award}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">--select award--</option>
            {awardList.map((a, i) => (
              <option key={i} value={a}>{a}</option>
            ))}
          </select>

          <input
            type="text"
            name="courseTitle"
            placeholder="Course Name"
            value={form.courseTitle}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="text"
            name="duration"
            placeholder="Duration (Example: 6 Months)"
            value={form.duration}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="text"
            name="courseFees"
            placeholder="Course Fees"
            value={form.courseFees}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={addCourse}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
        >
          Add Course
        </button>

      </div>

      {/* COURSE LIST */}
      <div className="bg-white shadow p-6 rounded-lg">

        <h3 className="text-lg font-semibold mb-4">
          All Courses
        </h3>

        <table className="w-full border">

          <thead className="bg-gray-100">

           <tr>
  <th className="p-2 border">Code</th>
  <th className="p-2 border">Course Name</th>
  <th className="p-2 border">Duration</th>
  <th className="p-2 border">Fees</th>
  <th className="p-2 border">Action</th>
</tr>

          </thead>

          <tbody>

            {courses.map((course) => (

              <tr key={course.$id}>

                <td className="p-2 border">
                  {course.courseCode}
                </td>

                <td className="p-2 border">
                  {course.courseName}
                </td>

                <td className="p-2 border">
                  {course.duration}
                </td>
                <td className="p-2 border">
  ₹ {course.courseFees}
</td>

                <td className="p-2 border">
                  
                 <div className="flex gap-2 justify-center">

  <button
    onClick={() => editCourse(course)}
    className="bg-blue-500 text-white px-3 py-1 rounded"
  >
    Edit
  </button>

  <button
    onClick={() => deleteCourse(course.$id)}
    className="bg-red-500 text-white px-3 py-1 rounded"
  >
    Delete
  </button>

</div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}