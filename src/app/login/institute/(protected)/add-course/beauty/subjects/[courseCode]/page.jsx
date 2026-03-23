'use client'

import { useEffect, useState } from 'react'
import { databases, account, ID } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { useParams, useRouter } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function TypingSubjectPage() {

    const params = useParams()
    const router = useRouter()

    const courseCode = params.courseCode

    const [subjects, setSubjects] = useState([])
    const [selectedSubjects, setSelectedSubjects] = useState([])
    const [courseFees, setCourseFees] = useState("")
    const [minimumFees, setMinimumFees] = useState("")

    useEffect(() => {

        if (!courseCode) return

        fetchSubjects()

    }, [courseCode])

    const fetchSubjects = async () => {

        const res = await databases.listDocuments(
            DATABASE_ID,
            "typing_subjects_master",
            [
                Query.equal("courseCode", courseCode)
            ]
        )

        setSubjects(res.documents)

    }

    const toggleSubject = (name) => {

        if (selectedSubjects.includes(name)) {

            setSelectedSubjects(selectedSubjects.filter(s => s !== name))

        } else {

            setSelectedSubjects([...selectedSubjects, name])

        }

    }

    const saveCourse = async () => {

        const user = await account.get()

        await databases.createDocument(
            DATABASE_ID,
            "franchise_typing_courses",
            ID.unique(),
            {
                courseCode: courseCode,
                subjects: selectedSubjects.join(", "),
                courseFees: Number(courseFees),
                minimumFees: Number(minimumFees),
                franchiseEmail: user.email,
                status: "Active"
            }
        )

        router.push("/login/institute/add-course/typing/list")

    }

    return (

        <div className="p-10 bg-black min-h-screen text-white">

            <h1 className="text-xl font-bold mb-6">
                Select Typing Subjects
            </h1>

            {subjects.map(sub => (
                <div key={sub.$id} className="mb-2 flex items-center">

                    <input
                        type="checkbox"
                        onChange={() => toggleSubject(sub.subjectName)}
                        className="accent-orange-500"
                    />

                    <span className="ml-2">{sub.subjectName}</span>

                </div>
            ))}

            <input
                placeholder="Course Fees"
                value={courseFees}
                onChange={(e) => setCourseFees(e.target.value)}
                className="border border-gray-700 bg-black text-white p-2 w-full mt-4 rounded"
            />

            <input
                placeholder="Minimum Fees"
                value={minimumFees}
                onChange={(e) => setMinimumFees(e.target.value)}
                className="border border-gray-700 bg-black text-white p-2 w-full mt-3 rounded"
            />

            <button
                onClick={saveCourse}
                className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 mt-4 rounded"
            >
                Save Course
            </button>

        </div>

    )

}