'use client'

import { useEffect, useState } from 'react'
import { databases, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function ListPage() {

    const [courses, setCourses] = useState([])
    const [editCourse, setEditCourse] = useState(null)
const [courseFees, setCourseFees] = useState('')
const [minimumFees, setMinimumFees] = useState('')
const [search, setSearch] = useState('')

    useEffect(() => {
        fetchCourses()
    }, [])

    const deleteCourse = async (id) => {
  if (!id) return

  try {
    await databases.deleteDocument(
      DATABASE_ID,
      "franchise_multiple_courses",
      id
    )
    fetchCourses()
  } catch (error) {
    console.log("Delete Error:", error)
  }
}

const openEdit = (course) => {
  setEditCourse(course)
  setCourseFees(course.courseFees)
  setMinimumFees(course.minimumFees)
}

const updateFees = async () => {
  if (!editCourse) return

  try {
    await databases.updateDocument(
      DATABASE_ID,
      "franchise_multiple_courses",
      editCourse.$id,
      {
        courseFees: Number(courseFees),
        minimumFees: Number(minimumFees)
      }
    )

    setEditCourse(null)
    fetchCourses()

  } catch (error) {
    console.log("Update Error:", error)
  }
}

    const fetchCourses = async () => {

        const user = await account.get()

        const res = await databases.listDocuments(
            DATABASE_ID,
            "franchise_multiple_courses",
            [
                Query.equal("franchiseEmail", user.email)
            ]
        )

        setCourses(res.documents)

    }

    return (

        <div className="p-10 bg-black min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6">
                LIST COURSES ADDED MULTIPLE SUBJECT
            </h1>
<input
  type="text"
  placeholder="Search by course code..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="mb-4 p-2 w-full bg-black border border-gray-700 rounded"
/>
            <table className="w-full bg-[#121212] border border-gray-800 shadow rounded">

                <thead className="bg-orange-500 text-black">

                    <tr>
                        <th className="p-3 border border-gray-800">Course Code</th>
                        <th className=" border border-gray-800">Subjects</th>
                        <th className="p-3 border border-gray-800">Course Fees</th>
                        <th className="p-3 border border-gray-800">Minimum Fees</th>
                        <th className="p-3 border border-gray-800">Status</th>
                        <th className="p-3 border border-gray-800">Action</th>
                    </tr>

                </thead>

                <tbody>

        {courses
  .filter(course =>
    course.courseCode?.toLowerCase().includes(search.toLowerCase())
  )
  .map(course => (
                        <tr key={course.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                            <td className="p-3 border border-gray-800">{course.courseCode}</td>
<td className="p-3 border border-gray-800 max-w-[400px] truncate">
  {course.subjects || "No Subjects"}
</td>

                            <td className="p-3 border border-gray-800">{course.courseFees}</td>
                            <td className="p-3 border border-gray-800">{course.minimumFees}</td>
                            <td className="p-3 border border-gray-800 text-green-400">{course.status}</td>
                            <td className="p-3 border border-gray-800 space-x-2">

  <button
    onClick={() => openEdit(course)}
    className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1 rounded"
  >
    Edit
  </button>

  <button
    onClick={() => deleteCourse(course.$id)}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
  >
    Delete
  </button>

</td>

                        </tr>
                    ))}

                    {editCourse && (

  <div className="fixed inset-0 flex items-center justify-center bg-black/70">

    <div className="bg-[#121212] border border-gray-700 p-6 rounded w-[400px] text-white">

      <h3 className="text-lg font-bold mb-4">
        Edit Course Fees
      </h3>

      <input
        type="number"
        value={courseFees}
        onChange={(e) => setCourseFees(e.target.value)}
        className="border border-gray-700 bg-black text-white p-2 w-full mb-4 rounded"
        placeholder="Course Fee"
      />

      <input
        type="number"
        value={minimumFees}
        onChange={(e) => setMinimumFees(e.target.value)}
        className="border border-gray-700 bg-black text-white p-2 w-full mb-4 rounded"
        placeholder="Minimum Fee"
      />

      <div className="flex justify-end gap-2">

        <button
          onClick={() => setEditCourse(null)}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>

        <button
          onClick={updateFees}
          className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded"
        >
          Save
        </button>

      </div>

    </div>

  </div>

)}

                </tbody>

            </table>

        </div>

    )

}