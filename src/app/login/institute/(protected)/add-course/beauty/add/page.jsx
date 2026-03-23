'use client'

import { useEffect, useState } from 'react'
import { databases, ID, account } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const institutePlans = {
  "HOJAI": 400,
  "BIHAR": 499,
  "ARUNACHAL PRADESH": 499,
  "BEAUTY": 500
}

export default function AddBeautyCourse() {

const [courses, setCourses] = useState([])
const [examFee, setExamFee] = useState(0)
const [selectedCourses, setSelectedCourses] = useState({})

// ================= FETCH =================
useEffect(() => {
fetchCourses()
fetchPlan()
}, [])

const fetchCourses = async () => {
try {
const res = await databases.listDocuments(
DATABASE_ID,
"typing_courses_master"
)
setCourses(res.documents || [])
} catch (err) {
console.log(err)
setCourses([])
}
}

const fetchPlan = async () => {
try {
const user = await account.get()

const res = await databases.listDocuments(
DATABASE_ID,
"franchise_approved",
[Query.equal("email", user.email)]
)

const plan = res.documents[0]?.plan
setExamFee(institutePlans[plan] || 0)

} catch (err) {
console.log(err)
}
}

// ================= SELECT =================
const handleCheck = (course) => {

if (!course || !course.$id) return

setSelectedCourses(prev => {

if (prev[course.$id]) {
const updated = { ...prev }
delete updated[course.$id]
return updated
}

return {
...prev,
[course.$id]: {
...course,
courseFees: '',
minimumFees: ''
}
}

})
}

// ================= INPUT =================
const handleInput = (id, field, value) => {

if (!id) return

setSelectedCourses(prev => ({
...prev,
[id]: {
...prev[id],
[field]: value
}
}))
}

// ================= ADD =================
const addCourse = async () => {

const selected = Object.values(selectedCourses)

if (selected.length === 0) {
alert("Please select at least one course")
return
}

try {

const user = await account.get()

for (const course of selected) {

if (!course.courseFees || !course.minimumFees) {
alert("Enter Course Fee & Minimum Fee")
return
}

await databases.createDocument(
DATABASE_ID,
"franchise_typing_courses",
ID.unique(),
{
courseId: course.$id,
courseCode: course.courseCode,
courseName: course.courseName,
duration: course.duration,
examFees: examFee,
courseFees: Number(course.courseFees),
minimumFees: Number(course.minimumFees),
status: "Active",
franchiseEmail: user.email
}
)

}

alert("Course Added Successfully")
setSelectedCourses({})

} catch (err) {
console.log(err)
alert(err.message)
}

}

// ================= UI =================
return (

<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-10">

<div className="max-w-6xl mx-auto">

{/* HEADER */}
<div className="flex justify-between items-center mb-8">

<h1 className="text-3xl font-bold tracking-wide">
✨ Add Beauty Courses
</h1>

<button
onClick={addCourse}
className="bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition px-6 py-2 rounded-lg font-semibold shadow-lg"
>
+ Add Selected
</button>

</div>

{/* TABLE CARD */}
<div className="bg-[#121212] border border-gray-800 rounded-xl shadow-xl overflow-hidden">

<table className="w-full text-sm">

<thead className="bg-orange-500 text-black">

<tr>
<th className="p-3">Select</th>
<th className="p-3">Code</th>
<th className="p-3">Course Name</th>
<th className="p-3">Duration</th>
<th className="p-3">Exam Fee</th>
<th className="p-3">Course Fee</th>
<th className="p-3">Minimum Fee</th>
</tr>

</thead>

<tbody>

{courses.length > 0 ? (

courses.map((course) => {

if (!course || !course.$id) return null

return (

<tr key={course.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a] transition">

<td className="text-center">
<input
type="checkbox"
checked={!!selectedCourses[course.$id]}
onChange={() => handleCheck(course)}
className="accent-orange-500 scale-110"
/>
</td>

<td className="p-3">{course.courseCode}</td>
<td className="p-3">{course.courseName}</td>
<td className="p-3">{course.duration}</td>

<td className="p-3 text-orange-400 font-semibold">
₹{examFee}
</td>

<td className="p-3">
<input
type="number"
placeholder="Course Fee"
disabled={!selectedCourses[course.$id]}
onChange={(e)=>handleInput(course.$id,'courseFees',e.target.value)}
className="bg-black border border-gray-700 p-2 w-28 rounded focus:ring-2 focus:ring-orange-500"
/>
</td>

<td className="p-3">
<input
type="number"
placeholder="Min Fee"
disabled={!selectedCourses[course.$id]}
onChange={(e)=>handleInput(course.$id,'minimumFees',e.target.value)}
className="bg-black border border-gray-700 p-2 w-28 rounded focus:ring-2 focus:ring-orange-500"
/>
</td>

</tr>

)

})

) : (

<tr>
<td colSpan="7" className="text-center p-6 text-gray-400">
No Courses Found
</td>
</tr>

)}

</tbody>

</table>

</div>

</div>

</div>

)

}