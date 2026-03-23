'use client'

import { useState, useEffect } from 'react'
import { databases, ID } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = "typing_courses_master"

export default function BeautyCMS() {

// ================= STATES =================
const [courses, setCourses] = useState([])
const [awards, setAwards] = useState([])

const [form, setForm] = useState({
courseCode: '',
award: '',
courseTitle: '',
duration: '',
examFees: ''
})

const [newAward, setNewAward] = useState("")
const [showAddAward, setShowAddAward] = useState(false)

// ================= DEFAULT AWARDS =================
const defaultAwards = [
"CERTIFICATE","DIPLOMA","ADVANCE CERTIFICATE","ADVANCE DIPLOMA",
"MASTER DIPLOMA","CERTIFICATE IN POST GRADUATE DIPLOMA",
"PROFESSIONAL DIPLOMA","ALL INDIA CERTIFICATE","MASTER CERTIFICATE",
"CERTIFICATE BASIC DIPLOMA","ADVANCE","CERTIFICATE IN PROFESSIONAL DIPLOMA",
"POST GRADUATE","POST GRADUATE DIPLOMA","BASIC","CERTIFICATE COURSE",
"CERTIFICATION","PRE-VOCATIONAL COURSE","PERSONAL"
]

// ================= MERGE =================
const allAwards = [...defaultAwards, ...awards.map(a => a.name)]
const uniqueAwards = [...new Set(allAwards)]

// ================= FETCH =================
const fetchCourses = async () => {
try {
const res = await databases.listDocuments(
DATABASE_ID,
COLLECTION_ID
)

// ✅ SAFE DATA
const clean = (res.documents || []).filter(c => c && c.$id)

setCourses(clean)

} catch (err) {
console.log(err)
setCourses([])
}
}

const fetchAwards = async () => {
try {
const res = await databases.listDocuments(
DATABASE_ID,
"awards_master"
)
setAwards(res.documents || [])
} catch (err) {
console.log(err)
}
}

useEffect(() => {
fetchCourses()
fetchAwards()
}, [])

// ================= HANDLER =================
const handleChange = (e) => {
setForm({
...form,
[e.target.name]: e.target.value
})
}

// ================= ADD AWARD =================
const addNewAward = async () => {

if (!newAward) return alert("Enter award")

try {

await databases.createDocument(
DATABASE_ID,
"awards_master",
ID.unique(),
{ name: newAward }
)

setNewAward("")
setShowAddAward(false)
fetchAwards()

} catch (err) {
console.log(err)
alert(err.message)
}

}

// ================= ADD COURSE =================
const addCourse = async () => {

try {

if (!form.courseCode || !form.courseTitle || !form.award || !form.duration) {
alert("Fill all fields")
return
}

const courseName = `${form.award} IN ${form.courseTitle}`

await databases.createDocument(
DATABASE_ID,
COLLECTION_ID,
ID.unique(),
{
courseCode: form.courseCode,
courseName,
duration: form.duration,
award: form.award,
examFees: Number(form.examFees),
status: "Active"
}
)

alert("Course Added")

setForm({
courseCode: '',
award: '',
courseTitle: '',
duration: '',
examFees: ''
})

fetchCourses()

} catch (err) {
console.log(err)
alert(err.message)
}

}

// ================= DELETE =================
const deleteCourse = async (id) => {

if (!id) return

await databases.deleteDocument(
DATABASE_ID,
COLLECTION_ID,
id
)

fetchCourses()
}

// ================= UI =================
return (

<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-10">

<div className="max-w-4xl mx-auto">

<h2 className="text-3xl font-bold mb-6 text-gray-800">
Beauty Course CMS
</h2>

{/* FORM */}
<div className="bg-white shadow-xl rounded-xl p-6 mb-8">

<div className="grid grid-cols-2 gap-4">

<input
name="courseCode"
placeholder="Course Code"
value={form.courseCode}
onChange={handleChange}
className="border p-3 rounded"
/>

<select
name="award"
value={form.award}
onChange={(e)=>{
if(e.target.value==="ADD_NEW"){
setShowAddAward(true)
}else{
handleChange(e)
}
}}
className="border p-3 rounded"
>
<option value="">--select award--</option>

{uniqueAwards.map((a,i)=>(
<option key={i} value={a}>{a}</option>
))}

<option value="ADD_NEW">+ Add New Award</option>

</select>

<input
name="courseTitle"
placeholder="Course Name"
value={form.courseTitle}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
name="duration"
placeholder="Duration"
value={form.duration}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
type="number"
name="examFees"
placeholder="Exam Fees"
value={form.examFees}
onChange={handleChange}
className="border p-3 rounded col-span-2"
/>

</div>

{/* ADD AWARD */}
{showAddAward && (
<div className="mt-4 flex gap-2">

<input
placeholder="New Award"
value={newAward}
onChange={(e)=>setNewAward(e.target.value)}
className="border p-2 rounded w-full"
/>

<button
onClick={addNewAward}
className="bg-green-600 text-white px-4 rounded"
>
Save
</button>

</div>
)}

<button
onClick={addCourse}
className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg"
>
Add Course
</button>

</div>

{/* LIST */}
<div className="bg-white shadow-xl rounded-xl p-6">

<h3 className="font-semibold mb-4">
All Courses
</h3>

<table className="w-full border">

<thead className="bg-gray-100">
<tr>
<th className="p-2 border">Code</th>
<th className="p-2 border">Name</th>
<th className="p-2 border">Duration</th>
<th className="p-2 border">Action</th>
</tr>
</thead>

<tbody>

{courses.length > 0 ? (

courses.map((c)=>(
<tr key={c.$id}>
<td className="p-2 border">{c.courseCode}</td>
<td className="p-2 border">{c.courseName}</td>
<td className="p-2 border">{c.duration}</td>

<td className="p-2 border">
<button
onClick={()=>deleteCourse(c.$id)}
className="bg-red-500 text-white px-3 py-1 rounded"
>
Delete
</button>
</td>
</tr>
))

) : (
<tr>
<td colSpan="4" className="text-center p-4">
No courses
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