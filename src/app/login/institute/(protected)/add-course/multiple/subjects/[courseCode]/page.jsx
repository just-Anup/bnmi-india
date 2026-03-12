'use client'

import { useEffect, useState } from 'react'
import { databases, account, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { useParams, useRouter } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function SubjectPage() {

    const params = useParams()
    const router = useRouter()

    const courseCode = params.courseCode

    const [subjects, setSubjects] = useState([])
    const [selectedSubjects, setSelectedSubjects] = useState([])
    const [courseFees, setCourseFees] = useState("")
    const [minimumFees, setMinimumFees] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        if (!courseCode) return

        fetchSubjects()

    }, [courseCode])

    const fetchSubjects = async () => {

        try {

            const res = await databases.listDocuments(
                DATABASE_ID,
                "subjects_master",
                [
                    Query.equal("courseCode", courseCode)
                ]
            )

            setSubjects(res.documents)
            setLoading(false)

        } catch (error) {

            console.log("Error loading subjects:", error)
            setLoading(false)

        }

    }

    const toggleSubject = (subjectName) => {

        if (selectedSubjects.includes(subjectName)) {

            setSelectedSubjects(
                selectedSubjects.filter(sub => sub !== subjectName)
            )

        } else {

            setSelectedSubjects([
                ...selectedSubjects,
                subjectName
            ])

        }

    }

    const saveCourse = async () => {

        try {

            if (selectedSubjects.length === 0) {
                alert("Select at least one subject")
                return
            }

            const user = await account.get()

            await databases.createDocument(
                DATABASE_ID,
                "franchise_multiple_courses",
                ID.unique(),
                {
                    courseCode: courseCode,
                    subjects: selectedSubjects.join(", "),
                    courseFees: Number(courseFees),
                    minimumFees: Number(minimumFees),

                    franchiseEmail: user.email,
                    createdById: user.$id,

                    status: "Active"
                }
            )

            alert("Course saved successfully")

            router.push("/login/institute/add-course/multiple/list")

        } catch (error) {

            console.log(error)
            alert(error.message)

        }

    }

    if (loading) {
        return <div className="p-10 bg-black text-white min-h-screen">Loading subjects...</div>
    }

    return (

        <div className="p-10 bg-black min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6">
                Select Subjects for {courseCode}
            </h1>

            <div className="bg-[#121212] border border-gray-800 p-6 rounded shadow w-[500px]">

                <h2 className="font-semibold mb-4">Available Subjects</h2>

                {subjects.length === 0 ? (

                    <p className="text-gray-400">No subjects found for this course</p>

                ) : (

                    subjects.map(subject => (

                        <div key={subject.$id} className="mb-2 flex items-center">

                            <input
                                type="checkbox"
                                onChange={() => toggleSubject(subject.subjectName)}
                                className="mr-2 accent-orange-500"
                            />

                            <span>{subject.subjectName}</span>

                        </div>

                    ))

                )}

                <div className="mt-6">

                    <input
                        type="number"
                        placeholder="Course Fees"
                        value={courseFees}
                        onChange={(e) => setCourseFees(e.target.value)}
                        className="border border-gray-700 bg-black text-white p-2 w-full mb-3 rounded"
                    />

                    <input
                        type="number"
                        placeholder="Minimum Fees"
                        value={minimumFees}
                        onChange={(e) => setMinimumFees(e.target.value)}
                        className="border border-gray-700 bg-black text-white p-2 w-full rounded"
                    />

                </div>

                <button
                    onClick={saveCourse}
                    className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 mt-6 rounded"
                >
                    Save Course
                </button>

            </div>

        </div>

    )

}