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

    <div className="min-h-screen bg-black text-white p-3 sm:p-5 lg:p-10">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-xl sm:text-2xl font-bold leading-tight">
          LIST COURSES ADDED MULTIPLE SUBJECT
        </h1>

      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by course code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-3 w-full bg-black border border-gray-700 rounded-lg outline-none focus:border-orange-500 text-sm sm:text-base"
      />

      {/* TABLE */}
     <div className="relative w-full overflow-x-auto rounded-xl border border-gray-800">

  <table className="min-w-max bg-[#121212] border-collapse shadow">

          <thead className="bg-orange-500 text-black text-xs sm:text-sm">

            <tr>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Course Code
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Course Name
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Subjects
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
  Duration
</th>

<th className="p-3 border border-gray-800 whitespace-nowrap">
  Exam Fees
</th>


              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Course Fees
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Minimum Fees
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Status
              </th>

              <th className="p-3 border border-gray-800 whitespace-nowrap">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {courses
              .filter(course =>
                course.courseCode
                  ?.toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map(course => (

                <tr
                  key={course.$id}
                  className="border-t border-gray-800 hover:bg-[#1a1a1a]"
                >

                 <td className="p-3 border border-gray-800 whitespace-nowrap">
                    {course.courseCode}
                  </td>

             <td className="p-3 border border-gray-800 whitespace-nowrap">
  {course.courseName}
</td>

                  <td className="p-3 border border-gray-800 min-w-[300px] max-w-[450px] break-words">
  {course.subjects
    ? course.subjects
        .split(",")
        .map((subject, index) => (
          <div key={index} className="mb-1">
            {index + 1}. {subject.trim()}
          </div>
        ))
    : "No Subjects"}
</td>

<td className="p-3 border border-gray-800 whitespace-nowrap">
  {course.duration}
</td>

<td className="p-3 border border-gray-800 whitespace-nowrap">
  ₹{course.examFees || 0}
</td>

       <td className="p-3 border border-gray-800 whitespace-nowrap">
  ₹{course.courseFees || 0}
</td>

                  <td className="p-3 border border-gray-800 whitespace-nowrap">
                    {course.minimumFees}
                  </td>

                  <td className="p-3 border border-gray-800 text-green-400 whitespace-nowrap">
                    {course.status}
                  </td>

                  <td className="p-3 border border-gray-800">

                    <div className="flex flex-wrap gap-2 min-w-[180px]">

                      <button
                        onClick={() => openEdit(course)}
                        className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1 rounded text-xs sm:text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteCourse(course.$id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm"
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

      {/* EDIT MODAL */}
      {editCourse && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">

          <div className="bg-[#121212] border border-gray-700 p-4 sm:p-6 rounded-xl w-full max-w-md text-white">

            <h3 className="text-lg font-bold mb-4">
              Edit Course Fees
            </h3>

            <input
              type="number"
              value={courseFees}
              onChange={(e) => setCourseFees(e.target.value)}
              className="border border-gray-700 bg-black text-white p-3 w-full mb-4 rounded outline-none"
              placeholder="Course Fee"
            />

            <input
              type="number"
              value={minimumFees}
              onChange={(e) => setMinimumFees(e.target.value)}
              className="border border-gray-700 bg-black text-white p-3 w-full mb-4 rounded outline-none"
              placeholder="Minimum Fee"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">

              <button
                onClick={() => setEditCourse(null)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto"
              >
                Close
              </button>

              <button
                onClick={updateFees}
                className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded w-full sm:w-auto"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}