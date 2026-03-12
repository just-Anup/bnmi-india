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

<div className="p-10">

<h1 className="text-2xl font-bold mb-6">
Multiple Course CMS
</h1>

<div className="bg-white p-6 rounded shadow w-[600px]">

<input
placeholder="Course Code"
value={courseCode}
onChange={(e)=>setCourseCode(e.target.value)}
className="border p-2 w-full mb-3"
/>

<input
placeholder="Course Name"
value={courseName}
onChange={(e)=>setCourseName(e.target.value)}
className="border p-2 w-full mb-3"
/>

<input
placeholder="Duration"
value={duration}
onChange={(e)=>setDuration(e.target.value)}
className="border p-2 w-full mb-3"
/>

<input
placeholder="Exam Fees"
type="number"
value={examFees}
onChange={(e)=>setExamFees(e.target.value)}
className="border p-2 w-full mb-4"
/>

<h2 className="font-bold mb-2">Subjects</h2>

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
className="bg-green-600 text-white px-4 py-2 rounded mb-4"
>
Add Subject
</button>

<br/>

<button
onClick={saveCourse}
className="bg-blue-600 text-white px-6 py-2 rounded"
>
Save Course
</button>

</div>

</div>

)

}