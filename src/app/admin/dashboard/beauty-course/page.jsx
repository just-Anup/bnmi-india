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

const [subjects, setSubjects] = useState([""])

// ================= DEFAULT AWARDS =================
const defaultAwards = [
"CERTIFICATE","DIPLOMA","ADVANCE CERTIFICATE","ADVANCE DIPLOMA",
"MASTER DIPLOMA","CERTIFICATE IN POST GRADUATE DIPLOMA",
"PROFESSIONAL DIPLOMA","ALL INDIA CERTIFICATE","MASTER CERTIFICATE",
"CERTIFICATE BASIC DIPLOMA","ADVANCE","CERTIFICATE IN PROFESSIONAL DIPLOMA",
"POST GRADUATE","POST GRADUATE DIPLOMA","BASIC","CERTIFICATE COURSE",
"CERTIFICATION","PRE-VOCATIONAL COURSE","PERSONAL"
]

// ================= MERGE AWARDS =================
const allAwards = [
...defaultAwards,
...awards.map(a => a.name)
]

const uniqueAwards = [...new Set(allAwards)]

// ================= FETCH =================
const fetchCourses = async () => {
try {
const res = await databases.listDocuments(
DATABASE_ID,
COLLECTION_ID
)
setCourses(res.documents)
} catch (err) {
console.log(err)
}
}

const fetchAwards = async () => {
try {
const res = await databases.listDocuments(
DATABASE_ID,
"awards_master"
)
setAwards(res.documents)
} catch (err) {
console.log(err)
}
}

useEffect(() => {
fetchCourses()
fetchAwards()
}, [])

// ================= HANDLERS =================
const handleChange = (e) => {
setForm({
...form,
[e.target.name]: e.target.value
})
}

// ================= ADD AWARD =================
const addNewAward = async () => {

if (!newAward) {
alert("Enter award name")
return
}

try {

await databases.createDocument(
DATABASE_ID,
"awards_master",
ID.unique(),
{
name: newAward
}
)

alert("Award Added")

setNewAward("")
setShowAddAward(false)
fetchAwards()

} catch (err) {
console.log(err)
alert(err.message)
}

}

// ================= SUBJECT =================
const addSubjectField = () => {
setSubjects([...subjects, ""])
}

const changeSubject = (index, value) => {
const copy = [...subjects]
copy[index] = value
setSubjects(copy)
}

// ================= ADD COURSE =================
const addCourse = async () => {

try {

if (!form.courseCode || !form.courseTitle || !form.award || !form.duration) {
alert("Please fill all fields")
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

// SAVE SUBJECTS
for (const subject of subjects) {
if (subject.trim() !== "") {
await databases.createDocument(
DATABASE_ID,
"typing_subjects_master",
ID.unique(),
{
courseCode: form.courseCode,
subjectName: subject
}
)
}
}

alert("Course Added Successfully")

setForm({
courseCode: '',
award: '',
courseTitle: '',
duration: '',
examFees: ''
})

setSubjects([""])

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
COLLECTION_ID,
id
)
fetchCourses()
}

// ================= UI =================
return (

<div className="p-10">

<h2 className="text-2xl font-bold mb-6">
Typing Course Management
</h2>

{/* ADD COURSE */}
<div className="bg-white shadow p-6 rounded-lg mb-8">

<h3 className="text-lg font-semibold mb-4">
Add New Course
</h3>

<div className="grid grid-cols-2 gap-4">

<input
name="courseCode"
placeholder="Course Code"
value={form.courseCode}
onChange={handleChange}
className="border p-2 rounded"
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
className="border p-2 rounded"
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
className="border p-2 rounded"
/>

<input
name="duration"
placeholder="Duration"
value={form.duration}
onChange={handleChange}
className="border p-2 rounded"
/>

<input
type="number"
name="examFees"
placeholder="Exam Fees"
value={form.examFees}
onChange={handleChange}
className="border p-2 rounded col-span-2"
/>

</div>

{/* ADD AWARD INPUT */}
{showAddAward && (
<div className="mt-4 flex gap-2">

<input
placeholder="Enter new award"
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

{/* SUBJECTS */}
<div className="mt-4">

<h3 className="font-semibold mb-2">Subjects</h3>

{subjects.map((sub,index)=>(
<input
key={index}
placeholder="Subject Name"
value={sub}
onChange={(e)=>changeSubject(index,e.target.value)}
className="border p-2 w-full mb-2"
/>
))}

<button
onClick={addSubjectField}
className="bg-green-600 text-white px-4 py-2 rounded"
>
Add Subject
</button>

</div>

<button
onClick={addCourse}
className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
>
Add Course
</button>

</div>

{/* COURSE LIST */}
<div className="bg-white shadow p-6 rounded-lg">

<h3 className="text-lg font-semibold mb-4">
All Courses
</h3>

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

{courses.map((course)=>(
<tr key={course.$id}>
<td className="p-2 border">{course.courseCode}</td>
<td className="p-2 border">{course.courseName}</td>
<td className="p-2 border">{course.duration}</td>

<td className="p-2 border">
<button
onClick={()=>deleteCourse(course.$id)}
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

)

}