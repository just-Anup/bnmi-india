'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { databases, account, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const courseId = params.id

  const courseName = searchParams.get('name')
  const courseCode = searchParams.get('code')
  const duration = searchParams.get('duration')

  const [subjects, setSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        'subjects_master',
        [
          Query.equal('courseCode', courseCode),
          Query.limit(500)
        ]
      )

      setSubjects(res.documents)
    } catch (error) {
      console.log(error)
      alert('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectChange = (subjectName) => {
    const exists = selectedSubjects.includes(subjectName)

    if (exists) {
      setSelectedSubjects(
        selectedSubjects.filter(item => item !== subjectName)
      )
      return
    }

    if (selectedSubjects.length >= 10) {
      alert('You can select maximum 10 subjects only')
      return
    }

    setSelectedSubjects([
      ...selectedSubjects,
      subjectName
    ])
  }

  const saveCourse = async () => {
    try {
      if (selectedSubjects.length === 0) {
        alert('Please select at least one subject')
        return
      }

      setSaving(true)

      const user = await account.get()

      // CHECK DUPLICATE COURSE
      const existing = await databases.listDocuments(
        DATABASE_ID,
        'franchise_multiple_courses',
        [
          Query.equal('franchiseEmail', user.email),
          Query.equal('courseCode', courseCode)
        ]
      )

      if (existing.documents.length > 0) {
        alert('Course already added')
        setSaving(false)
        return
      }

      await databases.createDocument(
        DATABASE_ID,
        'franchise_multiple_courses',
        ID.unique(),
        {
          franchiseEmail: user.email,
          courseId: courseId,
          courseCode: courseCode,
          courseName: courseName,
          duration: duration,
          subjects: selectedSubjects.join(', '),
          courseFees: 0,
          minimumFees: 0,
          examFees: 0,
          status: 'Active'
        }
      )

      alert('Course Added Successfully')

      router.push('/login/institute/list-course/multiple')
    } catch (error) {
      console.log(error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-4 sm:p-6 lg:p-10">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto">

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6 shadow-xl">

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Select Subjects
          </h1>

          <p className="text-gray-400">
            Choose maximum 10 subjects for this course
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-black border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Course Code</p>
              <p className="font-bold text-orange-400">
                {courseCode}
              </p>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="font-bold text-orange-400">
                {duration}
              </p>
            </div>

            <div className="bg-black border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">
                Selected Subjects
              </p>
              <p className="font-bold text-green-400">
                {selectedSubjects.length}/10
              </p>
            </div>

          </div>

          <div className="mt-5">
            <p className="text-gray-300 font-semibold">
              {courseName}
            </p>
          </div>

        </div>

        {/* SUBJECT LIST */}
        <div className="mt-6 bg-[#121212] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

          <div className="bg-orange-500 text-black p-4 font-bold text-lg">
            Available Subjects
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading Subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 text-center text-red-400">
              No subjects found for this course
            </div>
          ) : (
            <div className="p-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {subjects.map((subject) => (
                  <label
                    key={subject.$id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSubjects.includes(subject.subjectName)
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-black hover:border-orange-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(
                        subject.subjectName
                      )}
                      onChange={() =>
                        handleSubjectChange(subject.subjectName)
                      }
                      className="w-5 h-5 accent-orange-500"
                    />

                    <span className="text-sm sm:text-base">
                      {subject.subjectName}
                    </span>
                  </label>
                ))}

              </div>

            </div>
          )}

        </div>

        {/* SELECTED SUBJECTS */}
        <div className="mt-6 bg-[#121212] border border-gray-800 rounded-2xl p-5">

          <h2 className="text-lg font-bold mb-4 text-orange-400">
            Selected Subjects ({selectedSubjects.length})
          </h2>

          {selectedSubjects.length === 0 ? (
            <p className="text-gray-500">
              No subject selected
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subject, index) => (
                <span
                  key={index}
                  className="bg-orange-500 text-black px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  {subject}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* SAVE BUTTON */}
        <div className="mt-6 flex justify-center">

          <button
            onClick={saveCourse}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-10 py-4 rounded-xl text-lg shadow-xl transition"
          >
            {saving ? 'Saving...' : 'Add Course'}
          </button>

        </div>

      </div>

    </div>
  )
}