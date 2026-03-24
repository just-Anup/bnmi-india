'use client'

import { useState, useEffect } from 'react'
import { databases, ID } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CMS() {

    // ================= STATES =================
    const [courseCode, setCourseCode] = useState("")
    const [courseTitle, setCourseTitle] = useState("")
    const [award, setAward] = useState("")
    const [customAward, setCustomAward] = useState("")
    const [duration, setDuration] = useState("")
    const [examFees, setExamFees] = useState("")
    const [subjects, setSubjects] = useState([""])
    const [courses, setCourses] = useState([])

    // ================= AWARD LIST =================
    const awardList = [
        "CERTIFICATE", "DIPLOMA", "ADVANCE CERTIFICATE", "ADVANCE DIPLOMA",
        "MASTER DIPLOMA", "CERTIFICATE IN POST GRADUATE DIPLOMA",
        "PROFESSIONAL DIPLOMA", "ALL INDIA CERTIFICATE", "MASTER CERTIFICATE",
        "CERTIFICATE BASIC DIPLOMA", "ADVANCE", "CERTIFICATE IN PROFESSIONAL DIPLOMA",
        "POST GRADUATE", "POST GRADUATE DIPLOMA", "BASIC", "CERTIFICATE COURSE",
        "CERTIFICATION", "PRE-VOCATIONAL COURSE", "PERSONAL"
    ]

    // ================= SUBJECT HANDLING =================
    const addSubjectField = () => {
        setSubjects([...subjects, ""])
    }

    const changeSubject = (index, value) => {
        const copy = [...subjects]
        copy[index] = value
        setSubjects(copy)
    }

    // ================= FETCH COURSES =================
    const fetchCourses = async () => {
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                "courses_master_multiple"
            )
            setCourses(res.documents)
        } catch (err) {
            console.log("Fetch Error:", err)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [])

    // ================= SAVE COURSE =================
    const saveCourse = async () => {

        try {

            const finalAward = award === "OTHER" ? customAward : award

            if (!courseCode || !courseTitle || !finalAward || !duration) {
                alert("Please fill all fields")
                return
            }

            const courseName = `${finalAward} IN ${courseTitle}`

            // SAVE COURSE
            await databases.createDocument(
                DATABASE_ID,
                "courses_master_multiple",
                ID.unique(),
                {
                    courseCode,
                    courseName,
                    duration,
                    award: finalAward,
                    examFees: Number(examFees),
                    status: "Active"
                }
            )

            // SAVE SUBJECTS
            for (const subject of subjects) {
                if (subject.trim() !== "") {
                    await databases.createDocument(
                        DATABASE_ID,
                        "subjects_master",
                        ID.unique(),
                        {
                            courseCode,
                            subjectName: subject
                        }
                    )
                }
            }

            alert("Course Added Successfully")

            // RESET
            setCourseCode("")
            setCourseTitle("")
            setAward("")
            setCustomAward("")
            setDuration("")
            setExamFees("")
            setSubjects([""])

            // REFRESH LIST
            fetchCourses()

        } catch (err) {
            console.log(err)
            alert(err.message)
        }

    }

    // ================= DELETE =================
    const deleteCourse = async (id) => {
        await databases.deleteDocument(
            DATABASE_ID,
            "courses_master_multiple",
            id
        )
        fetchCourses()
    }

    // ================= UI =================
    return (

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-10">

            <div className="max-w-3xl mx-auto">

                {/* FORM CARD */}
                <div className="bg-white shadow-2xl rounded-2xl p-8">

                    <h1 className="text-3xl font-bold mb-2 text-gray-800">
                        📚 Multiple Course CMS
                    </h1>
                    <p className="text-gray-500 mb-6">
                        Create courses with subjects and certification
                    </p>

                    <div className="space-y-4">

                        <input
                            placeholder="Course Code"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={award}
                            onChange={(e) => setAward(e.target.value)}
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Select Award --</option>
                            {awardList.map((a, i) => (
                                <option key={i} value={a}>{a}</option>
                            ))}
                            <option value="OTHER">Other</option>
                        </select>

                        {award === "OTHER" && (
                            <input
                                placeholder="Enter New Award"
                                value={customAward}
                                onChange={(e) => setCustomAward(e.target.value)}
                                className="w-full border p-3 rounded-lg"
                            />
                        )}

                        <input
                            placeholder="Course Name"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                        />

                        <input
                            placeholder="Duration (Example: 6 Months)"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                        />

                        <input
                            placeholder="Exam Fees"
                            type="number"
                            value={examFees}
                            onChange={(e) => setExamFees(e.target.value)}
                            className="w-full border p-3 rounded-lg"
                        />

                    </div>

                    {/* SUBJECTS */}
                    <div className="mt-6">

                        <h2 className="font-semibold text-lg mb-3">📖 Subjects</h2>

                        <div className="space-y-2">
                            {subjects.map((sub, index) => (
                                <input
                                    key={index}
                                    placeholder={`Subject ${index + 1}`}
                                    value={sub}
                                    onChange={(e) => changeSubject(index, e.target.value)}
                                    className="w-full border p-3 rounded-lg"
                                />
                            ))}
                        </div>

                        <button
                            onClick={addSubjectField}
                            className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                            + Add Subject
                        </button>

                    </div>

                    <button
                        onClick={saveCourse}
                        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg text-lg"
                    >
                        🚀 Save Course
                    </button>

                </div>

                {/* COURSE LIST */}
                <div className="mt-10 bg-white shadow-xl rounded-2xl p-6">

                    <h2 className="text-xl font-semibold mb-4">
                        📋 All Courses
                    </h2>

                    <table className="w-full border">

                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border">Code</th>
                                <th className="p-2 border">Course Name</th>
                                <th className="p-2 border">Duration</th>
                                <th className="p-2 border">Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {courses.map((course) => (
                                <tr key={course.$id}>

                                    <td className="p-2 border">{course.courseCode}</td>
                                    <td className="p-2 border">{course.courseName}</td>
                                    <td className="p-2 border">{course.duration}</td>

                                    <td className="p-2 border">
                                        <button
                                            onClick={() => deleteCourse(course.$id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    )

}