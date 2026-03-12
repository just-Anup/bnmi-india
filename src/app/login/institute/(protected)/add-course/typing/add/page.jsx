'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import Link from 'next/link'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function TypingAddPage() {

    const [courses, setCourses] = useState([])

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {

        const res = await databases.listDocuments(
            DATABASE_ID,
            "typing_courses_master"
        )

        setCourses(res.documents)

    }

    return (

        <div className="p-10 bg-black min-h-screen text-white">

            <h1 className="text-2xl font-bold mb-6">
                ADD TYPING COURSE
            </h1>

            <table className="w-full bg-[#121212] border border-gray-800 shadow rounded">

                <thead className="bg-orange-500 text-black">

                    <tr>
                        <th className="p-3 border border-gray-800">Code</th>
                        <th className="p-3 border border-gray-800">Name</th>
                        <th className="p-3 border border-gray-800">Duration</th>
                        <th className="p-3 border border-gray-800">Exam Fees</th>
                        <th className="p-3 border border-gray-800">Action</th>
                    </tr>

                </thead>

                <tbody>

                    {courses.map(course => (
                        <tr key={course.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                            <td className="p-3 border border-gray-800">{course.courseCode}</td>
                            <td className="p-3 border border-gray-800">{course.courseName}</td>
                            <td className="p-3 border border-gray-800">{course.duration}</td>
                            <td className="p-3 border border-gray-800">{course.examFees}</td>

                            <td className="p-3 border border-gray-800">

                                <Link
                                    href={`/login/institute/add-course/typing/subjects/${course.courseCode}`}
                                    className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded font-semibold"
                                >
                                    Add Subjects
                                </Link>

                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>

    )

}