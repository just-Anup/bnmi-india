'use client'

import { useState } from 'react'
import { databases, ID } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CMS() {

    const awardList = [
        "CERTIFICATE",
        "DIPLOMA",
        "ADVANCE CERTIFICATE",
        "ADVANCE DIPLOMA",
        "MASTER DIPLOMA",
        "CERTIFICATE IN POST GRADUATE DIPLOMA",
        "PROFESSIONAL DIPLOMA",
        "ALL INDIA CERTIFICATE",
        "MASTER CERTIFICATE",
        "CERTIFICATE BASIC DIPLOMA",
        "ADVANCE",
        "CERTIFICATE IN PROFESSIONAL DIPLOMA",
        "POST GRADUATE",
        "POST GRADUATE DIPLOMA",
        "BASIC",
        "CERTIFICATE COURSE",
        "CERTIFICATION",
        "PRE-VOCATIONAL COURSE",
        "PERSONAL"
    ]

    const [courseCode, setCourseCode] = useState("")
    const [courseTitle, setCourseTitle] = useState("")
    const [award, setAward] = useState("")
    const [customAward, setCustomAward] = useState("")
    const [duration, setDuration] = useState("")
    const [examFees, setExamFees] = useState("")
    const [subjects, setSubjects] = useState([""])

    const addSubjectField = () => {
        setSubjects([...subjects, ""])
    }

    const changeSubject = (index, value) => {
        const copy = [...subjects]
        copy[index] = value
        setSubjects(copy)
    }

    const saveCourse = async () => {

        try {

            const finalAward = award === "OTHER" ? customAward : award

            if (!courseCode || !courseTitle || !finalAward || !duration) {
                alert("Please fill all fields")
                return
            }

            const courseName = `${finalAward} IN ${courseTitle}`

            await databases.createDocument(
                DATABASE_ID,
                "courses_master_multiple",
                ID.unique(),
                {
                    courseCode: courseCode,
                    courseName: courseName,
                    duration: duration,
                    award: finalAward,
                    examFees: Number(examFees),
                    status: "Active"
                }
            )

            for (const subject of subjects) {

                if (subject.trim() !== "") {

                    await databases.createDocument(
                        DATABASE_ID,
                        "subjects_master",
                        ID.unique(),
                        {
                            courseCode: courseCode,
                            subjectName: subject
                        }
                    )

                }

            }

            alert("Course Added")

            setCourseCode("")
            setCourseTitle("")
            setAward("")
            setCustomAward("")
            setDuration("")
            setExamFees("")
            setSubjects([""])

        } catch (err) {
            console.log(err)
        }

    }
return (

<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-start p-10">

<div className="w-full max-w-2xl">

{/* CARD */}
<div className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl rounded-2xl p-8">

<h1 className="text-3xl font-bold text-gray-800 mb-2">
📚 Multiple Course CMS
</h1>

<p className="text-gray-500 mb-6">
Create courses with subjects and certification details
</p>

{/* FORM */}
<div className="space-y-4">

<input
placeholder="Course Code"
value={courseCode}
onChange={(e)=>setCourseCode(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
/>

<select
value={award}
onChange={(e)=>setAward(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
>
<option value="">-- Select Award --</option>
{awardList.map((a,i)=>(
<option key={i} value={a}>{a}</option>
))}
<option value="OTHER">Other</option>
</select>

{award === "OTHER" && (
<input
placeholder="Enter New Award"
value={customAward}
onChange={(e)=>setCustomAward(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
/>
)}

<input
placeholder="Course Name"
value={courseTitle}
onChange={(e)=>setCourseTitle(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<input
placeholder="Duration (Example: 6 Months)"
value={duration}
onChange={(e)=>setDuration(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<input
placeholder="Exam Fees"
type="number"
value={examFees}
onChange={(e)=>setExamFees(e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
/>

</div>

{/* SUBJECT SECTION */}
<div className="mt-6">

<h2 className="text-lg font-semibold text-gray-700 mb-3">
📖 Subjects
</h2>

<div className="space-y-2">

{subjects.map((sub,index)=>(
<input
key={index}
placeholder={`Subject ${index + 1}`}
value={sub}
onChange={(e)=>changeSubject(index,e.target.value)}
className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
/>
))}

</div>

<button
onClick={addSubjectField}
className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg hover:scale-[1.02] transition shadow-md"
>
+ Add Subject
</button>

</div>

{/* SAVE BUTTON */}
<div className="mt-8">

<button
onClick={saveCourse}
className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl text-lg font-semibold hover:scale-[1.02] transition shadow-lg"
>
🚀 Save Course
</button>

</div>

</div>

</div>

</div>

)

}