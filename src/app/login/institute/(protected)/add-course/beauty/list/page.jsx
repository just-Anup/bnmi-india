'use client'

import { useEffect, useState } from 'react'
import { databases, ID, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COURSE_COLLECTION = 'beauty_courses_single'
const SUBJECT_COLLECTION = 'beauty_courses_subjects'

export default function ListBeautyCourses() {

  const [courses, setCourses] = useState([])
  const [editCourse, setEditCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [courseFees, setCourseFees] = useState('')
  const [minimumFees, setMinimumFees] = useState('')
  const [subject, setSubject] = useState('')

  const fetchCourses = async () => {

    try {

      const user = await account.get()

      const res = await databases.listDocuments(
        DATABASE_ID,
        COURSE_COLLECTION,
        [
          Query.equal("franchiseEmail", user.email)
        ]
      )

      setCourses(res.documents)

    } catch (error) {
      console.log("Fetch Error:", error)
    }

  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const deleteCourse = async (id) => {

    if (!id) return

    try {

      await databases.deleteDocument(
        DATABASE_ID,
        COURSE_COLLECTION,
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
        COURSE_COLLECTION,
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

const saveSubject = async () => {

  if (!selectedCourse) return

  if (!subject.trim()) {
    alert("Enter subject name")
    return
  }

  try {

    const user = await account.get()

    const res = await databases.createDocument(
      DATABASE_ID,
      SUBJECT_COLLECTION,
      ID.unique(),
      {
        courseId: String(selectedCourse.$id),
        subjectName: String(subject),
        franchiseEmail: user.email
      }
    )

    console.log("Saved:", res)

    alert("Subject Saved Successfully")

    setSubject('')
    setSelectedCourse(null)

  } catch (error) {

    console.error("Appwrite Error:", error)
    alert(error.message)

  }

}

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-800">

        <h2 className="text-xl font-bold mb-6">
          Course List
        </h2>

        <table className="w-full border border-gray-800">

          <thead className="bg-orange-500 text-black">

            <tr>
              <th className="border border-gray-800 p-2">Sr</th>
              <th className="border border-gray-800 p-2">Course Name</th>
              <th className="border border-gray-800 p-2">Exam Fees</th>
              <th className="border border-gray-800 p-2">Course Fees</th>
              <th className="border border-gray-800 p-2">Minimum Fees</th>
              <th className="border border-gray-800 p-2">Duration</th>
              <th className="border border-gray-800 p-2">Status</th>
              <th className="border border-gray-800 p-2">Action</th>
            </tr>

          </thead>

          <tbody>

            {courses.map((course, index) => (

              <tr key={course.$id} className="hover:bg-[#1a1a1a]">

                <td className="border border-gray-800 p-2">{index + 1}</td>

                <td className="border border-gray-800 p-2">{course.courseName}</td>

                <td className="border border-gray-800 p-2">{course.examFees}</td>

                <td className="border border-gray-800 p-2">{course.courseFees}</td>

                <td className="border border-gray-800 p-2">{course.minimumFees}</td>

                <td className="border border-gray-800 p-2">{course.duration}</td>

                <td className="border border-gray-800 p-2 text-green-400">{course.status}</td>

                <td className="border border-gray-800 p-2 space-x-2">

                  <button
                    onClick={() => openEdit(course)}
                    className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    Add Subject
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

          </tbody>

        </table>

      </div>


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


      {selectedCourse && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/70">

          <div className="bg-[#121212] border border-gray-700 p-6 rounded w-[400px] text-white">

            <h3 className="text-lg font-bold mb-4">
              Add Course Subject
            </h3>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject Name"
              className="border border-gray-700 bg-black text-white p-2 w-full mb-4 rounded"
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setSelectedCourse(null)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>

              <button
                onClick={saveSubject}
                className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded"
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