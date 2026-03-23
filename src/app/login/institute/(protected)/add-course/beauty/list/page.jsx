'use client'

import { useEffect, useState } from 'react'
import { databases, account } from '@/lib/appwrite'
import { Query } from 'appwrite'
import Link from 'next/link'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function BeautyListPage() {

const [courses, setCourses] = useState([])
const [editCourse, setEditCourse] = useState(null)

const [courseFees, setCourseFees] = useState('')
const [minimumFees, setMinimumFees] = useState('')

// ================= FETCH =================
const fetchCourses = async () => {

try {

const user = await account.get()

const res = await databases.listDocuments(
DATABASE_ID,
"franchise_typing_courses",
[
Query.equal("franchiseEmail", user.email)
]
)

// ✅ FILTER BAD DATA (fix crash)
const cleanData = (res.documents || []).filter(
(c) => c && c.$id
)

setCourses(cleanData)

} catch (error) {
console.log("Fetch Error:", error)
setCourses([])
}

}

useEffect(() => {
fetchCourses()
}, [])

// ================= DELETE =================
const deleteCourse = async (id) => {

if (!id) return

try {

await databases.deleteDocument(
DATABASE_ID,
"franchise_typing_courses",
id
)

fetchCourses()

} catch (error) {
console.log("Delete Error:", error)
}

}

// ================= EDIT =================
const openEdit = (course) => {

if (!course || !course.$id) return

setEditCourse(course)
setCourseFees(course.courseFees || '')
setMinimumFees(course.minimumFees || '')

}

const updateFees = async () => {

if (!editCourse?.$id) return

try {

await databases.updateDocument(
DATABASE_ID,
"franchise_typing_courses",
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

// ================= UI =================
return (

<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-10">

<div className="max-w-6xl mx-auto">

{/* HEADER */}
<div className="flex justify-between items-center mb-8">

<h1 className="text-3xl font-bold">
📋 Beauty Course List
</h1>

</div>

{/* TABLE */}
<div className="bg-[#121212] border border-gray-800 rounded-xl shadow-xl overflow-hidden">

<table className="w-full text-sm">

<thead className="bg-orange-500 text-black">
<tr>
<th className="p-3">#</th>
<th className="p-3">Course Name</th>
<th className="p-3">Exam Fees</th>
<th className="p-3">Course Fees</th>
<th className="p-3">Minimum Fees</th>
<th className="p-3">Duration</th>
<th className="p-3">Status</th>
<th className="p-3">Action</th>
</tr>
</thead>

<tbody>

{courses.length > 0 ? (

courses.map((course, index) => {

if (!course || !course.$id) return null

return (

<tr
key={course.$id}
className="border-t border-gray-800 hover:bg-[#1a1a1a] transition"
>

<td className="p-3">{index + 1}</td>

<td className="p-3">{course.courseName || '-'}</td>

<td className="p-3 text-orange-400 font-semibold">
₹{course.examFees || 0}
</td>

<td className="p-3">{course.courseFees || 0}</td>

<td className="p-3">{course.minimumFees || 0}</td>

<td className="p-3">{course.duration || '-'}</td>

<td className="p-3 text-green-400">
{course.status || 'Active'}
</td>

<td className="p-3 space-x-2">

{/* EDIT */}
<button
onClick={() => openEdit(course)}
className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-black"
>
Edit
</button>

{/* ADD SUBJECT */}
<Link
href={`/login/institute/add-course/beauty/subjects/${course.$id}`}
className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
>
Add Subject
</Link>

{/* DELETE */}
<button
onClick={() => deleteCourse(course.$id)}
className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
>
Delete
</button>

</td>

</tr>

)

})

) : (

<tr>
<td colSpan="8" className="text-center p-6 text-gray-400">
No Courses Found
</td>
</tr>

)}

</tbody>

</table>

</div>

</div>

{/* ================= EDIT MODAL ================= */}
{editCourse && editCourse.$id && (

<div className="fixed inset-0 flex items-center justify-center bg-black/70">

<div className="bg-[#121212] border border-gray-700 p-6 rounded-xl w-[400px] shadow-xl">

<h3 className="text-lg font-bold mb-4">
✏️ Edit Course Fees
</h3>

<input
type="number"
value={courseFees}
onChange={(e)=>setCourseFees(e.target.value)}
placeholder="Course Fee"
className="border border-gray-700 bg-black p-3 w-full mb-4 rounded focus:ring-2 focus:ring-orange-500"
/>

<input
type="number"
value={minimumFees}
onChange={(e)=>setMinimumFees(e.target.value)}
placeholder="Minimum Fee"
className="border border-gray-700 bg-black p-3 w-full mb-4 rounded focus:ring-2 focus:ring-orange-500"
/>

<div className="flex justify-end gap-2">

<button
onClick={()=>setEditCourse(null)}
className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
>
Close
</button>

<button
onClick={updateFees}
className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded text-black"
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