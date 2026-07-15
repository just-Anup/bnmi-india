'use client'

import { useEffect, useState } from 'react'
import { databases, ID, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COURSE_COLLECTION = 'courses_single'
const SUBJECT_COLLECTION = 'course_subjects'

export default function ListSingleCourses() {

  const [courses, setCourses] = useState([])
  const [editCourse, setEditCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [subjectDocId, setSubjectDocId] = useState(null);
const [loadingSubject, setLoadingSubject] = useState(false);


  const [courseFees, setCourseFees] = useState('')
  const [minimumFees, setMinimumFees] = useState('')
  const [subject, setSubject] = useState('')
  const [search, setSearch] = useState('')

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

     const user = await account.get();

if (subjectDocId) {

  // Update existing subject
  await databases.updateDocument(
    DATABASE_ID,
    SUBJECT_COLLECTION,
    subjectDocId,
    {
      subjectName: subject.toUpperCase()
    }
  );

  alert("Subject Updated Successfully");

} else {

  // Create new subject
  const doc = await databases.createDocument(
    DATABASE_ID,
    SUBJECT_COLLECTION,
    ID.unique(),
    {
      courseId: selectedCourse.$id,
      subjectName: subject.toUpperCase(),
      franchiseEmail: user.email
    }
  );

  setSubjectDocId(doc.$id);

  alert("Subject Saved Successfully");
}

setSelectedCourse(null);

      console.log("Saved:", res)

      alert("Subject Saved Successfully")

      setSubject('')

      const textarea = document.querySelector('textarea')

      if (textarea) textarea.style.height = "auto"

      setSelectedCourse(null)

    } catch (error) {

      console.error("Appwrite Error:", error)
      alert(error.message)

    }
  }

  const loadSubject = async (course) => {
  try {
    setLoadingSubject(true);

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      SUBJECT_COLLECTION,
      [
        Query.equal("courseId", course.$id),
        Query.equal("franchiseEmail", user.email),
        Query.limit(1)
      ]
    );

    if (res.documents.length > 0) {
      setSubject(res.documents[0].subjectName);
      setSubjectDocId(res.documents[0].$id);
    } else {
      setSubject("");
      setSubjectDocId(null);
    }

    setSelectedCourse(course);

  } catch (err) {
    console.log(err);
  } finally {
    setLoadingSubject(false);
  }
};

  const handleInput = (e) => {

    setSubject(e.target.value)

    e.target.style.height = "auto"
    e.target.style.height = e.target.scrollHeight + "px"
  }

  return (

    <div className="min-h-screen bg-black text-white p-3 sm:p-5 lg:p-10">

      <div className="bg-[#121212] rounded-xl p-3 sm:p-5 lg:p-6 shadow-lg border border-gray-800">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <h2 className="text-lg sm:text-xl font-bold">
            Course List
          </h2>

        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search Course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 p-3 w-full bg-black border border-gray-700 rounded outline-none focus:border-orange-500 text-sm sm:text-base"
        />

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border border-gray-800">

          <table className="w-full min-w-[1000px] border-collapse text-xs sm:text-sm">

            <thead className="bg-orange-500 text-black">

              <tr>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Sr</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Course Name</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Exam Fees</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Course Fees</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Minimum Fees</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Duration</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Status</th>
                <th className="border border-gray-800 p-2 whitespace-nowrap">Action</th>
              </tr>

            </thead>

            <tbody>

              {courses
                .filter(course =>
                  course.courseName.toLowerCase().includes(search.toLowerCase())
                )
                .map((course, index) => (

                  <tr
                    key={course.$id}
                    className="hover:bg-[#1a1a1a]"
                  >

                    <td className="border border-gray-800 p-2">
                      {index + 1}
                    </td>

                    <td className="border border-gray-800 p-2 min-w-[220px]">
                      {course.courseName}
                    </td>

                    <td className="border border-gray-800 p-2 whitespace-nowrap">
                      {course.examFees}
                    </td>

                    <td className="border border-gray-800 p-2 whitespace-nowrap">
                      {course.courseFees}
                    </td>

                    <td className="border border-gray-800 p-2 whitespace-nowrap">
                      {course.minimumFees}
                    </td>

                    <td className="border border-gray-800 p-2 whitespace-nowrap">
                      {course.duration}
                    </td>

                    <td className="border border-gray-800 p-2 text-green-400 whitespace-nowrap">
                      {course.status}
                    </td>

                    <td className="border border-gray-800 p-2">

                      <div className="flex flex-wrap gap-2 min-w-[260px]">

                        <button
                          onClick={() => openEdit(course)}
                          className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1 rounded text-xs sm:text-sm font-medium"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => loadSubject(course)}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-medium"
                        >
                          Add Subject
                        </button>

                        <button
                          onClick={() => deleteCourse(course.$id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs sm:text-sm font-medium"
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

      {/* SUBJECT MODAL */}
      {selectedCourse && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">

          <div className="bg-[#121212] border border-gray-700 p-4 sm:p-6 rounded-xl w-full max-w-md text-white">

            <h3 className="text-lg font-bold mb-4">
              Add Course Subject
            </h3>

            <div className="flex flex-col gap-4">

            <textarea
  value={subject}
  onChange={(e) => {
    setSubject(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }}
  placeholder="Enter subjects (one per line)"
  rows={10}
  className="border border-gray-700 bg-black text-white p-3 w-full min-h-[250px] max-h-[500px] rounded resize-y overflow-auto uppercase outline-none focus:border-orange-500"
/>

              <div className="flex flex-col sm:flex-row justify-end gap-2">

                <button
                  onClick={() => setSelectedCourse(null)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto"
                >
                  Close
                </button>

                <button
                  onClick={saveSubject}
                  className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded w-full sm:w-auto"
                >
                  Save
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}