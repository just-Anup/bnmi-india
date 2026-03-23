'use client'

import { useState } from 'react'
import { databases, ID, account } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function AddSubject({ params }) {

const courseId = params.id

const [subject, setSubject] = useState('')
const [loading, setLoading] = useState(false)

const saveSubject = async () => {

if (!subject.trim()) {
alert("Enter subject name")
return
}

try {

setLoading(true)

const user = await account.get()

await databases.createDocument(
DATABASE_ID,
"course_subjects", // ✅ SAME AS SINGLE SYSTEM
ID.unique(),
{
courseId: String(courseId),
subjectName: subject,
franchiseEmail: user.email
}
)

alert("Subject Added Successfully")

setSubject("")

} catch (err) {
console.log(err)
alert(err.message)
} finally {
setLoading(false)
}

}

// ================= UI =================
return (

<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">

<div className="bg-[#121212] border border-gray-800 p-8 rounded-xl shadow-xl w-[400px]">

<h2 className="text-xl font-bold mb-6 text-center">
📚 Add Subject
</h2>

<input
type="text"
value={subject}
onChange={(e)=>setSubject(e.target.value)}
placeholder="Enter Subject Name"
className="w-full border border-gray-700 bg-black p-3 rounded mb-4 focus:ring-2 focus:ring-orange-500"
/>

<button
onClick={saveSubject}
disabled={loading}
className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded font-semibold text-black"
>
{loading ? "Saving..." : "Save Subject"}
</button>

</div>

</div>

)

}