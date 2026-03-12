'use client'

import { useEffect, useState } from 'react'
import { databases, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function ListPage() {

    const [courses, setCourses] = useState([])

    useEffect(() => {
        fetchCourses()
    }, [])

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

            <table className="w-full bg-[#121212] border border-gray-800 shadow rounded">

                <thead className="bg-orange-500 text-black">

                    <tr>
                        <th className="p-3 border border-gray-800">Course Code</th>
                        <th className="p-3 border border-gray-800">Subjects</th>
                        <th className="p-3 border border-gray-800">Course Fees</th>
                        <th className="p-3 border border-gray-800">Minimum Fees</th>
                        <th className="p-3 border border-gray-800">Status</th>
                    </tr>

                </thead>

                <tbody>

                    {courses.map(course => (
                        <tr key={course.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                            <td className="p-3 border border-gray-800">{course.courseCode}</td>

                            <td className="p-3 border border-gray-800">
                                {course.subjects || "No Subjects"}
                            </td>

                            <td className="p-3 border border-gray-800">{course.courseFees}</td>
                            <td className="p-3 border border-gray-800">{course.minimumFees}</td>
                            <td className="p-3 border border-gray-800 text-green-400">{course.status}</td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>

    )

}