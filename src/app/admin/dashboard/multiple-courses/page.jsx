'use client'

import { useState } from 'react'
import { databases, ID } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CMS(){

const [courseCode,setCourseCode]=useState("")
const [courseName,setCourseName]=useState("")
const [duration,setDuration]=useState("")
const [examFees,setExamFees]=useState("")
const [subjects,setSubjects]=useState([""])

const addSubjectField=()=>{
setSubjects([...subjects,""])
}

const changeSubject=(index,value)=>{
const copy=[...subjects]
copy[index]=value
setSubjects(copy)
}

const saveCourse=async()=>{

try{

await databases.createDocument(
DATABASE_ID,
"courses_master_multiple",
ID.unique(),
{
courseCode:courseCode,
courseName:courseName,
duration:duration,
examFees:Number(examFees),
status:"Active"
}
)

for(const subject of subjects){

if(subject.trim()!==""){

await databases.createDocument(
DATABASE_ID,
"subjects_master",
ID.unique(),
{
courseCode:courseCode,
subjectName:subject
}
)

}

}

alert("Course Added")

setCourseCode("")
setCourseName("")
setDuration("")
setExamFees("")
setSubjects([""])

}catch(err){
console.log(err)
}

}

return(

<div className="min-h-screen bg-gray-50 flex justify-center items-start p-10">

<div className="bg-white p-8 rounded-xl shadow-lg w-[650px]">

<h1 className="text-3xl font-bold mb-6 text-gray-800">
Multiple Course CMS
</h1>

<input
placeholder="Course Code"
value={courseCode}
onChange={(e)=>setCourseCode(e.target.value)}
className="border rounded-lg p-3 w-full mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<input
placeholder="Course Name"
value={courseName}
onChange={(e)=>setCourseName(e.target.value)}
className="border rounded-lg p-3 w-full mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<input
placeholder="Duration"
value={duration}
onChange={(e)=>setDuration(e.target.value)}
className="border rounded-lg p-3 w-full mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<input
placeholder="Exam Fees"
type="number"
value={examFees}
onChange={(e)=>setExamFees(e.target.value)}
className="border rounded-lg p-3 w-full mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
/>

<h2 className="font-semibold text-lg mb-3 text-gray-700">
Subjects
</h2>

<div className="space-y-2">

{subjects.map((sub,index)=>(
<input
key={index}
placeholder="Subject Name"
value={sub}
onChange={(e)=>changeSubject(index,e.target.value)}
className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
/>
))}

</div>

<button
onClick={addSubjectField}
className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg mt-4 transition"
>
Add Subject
</button>

<div className="border-t mt-6 pt-6">

<button
onClick={saveCourse}
className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
>
Save Course
</button>

</div>

</div>

</div>

)

}