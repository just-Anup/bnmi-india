'use client'

import { useState } from 'react'
import { databases, account, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'
import QRCode from 'qrcode'
import { useRouter } from 'next/navigation'
import imageCompression from "browser-image-compression"

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const BUCKET_ID =
  "6986e8a4001925504f6b"

const COLLECTION_ID =
  "participation_certificates"

export default function AddParticipation() {

  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const [studentName, setStudentName] =
    useState('')

    const [courseName, setCourseName] = useState('')
const [courseDuration, setCourseDuration] = useState('')
const [dateOfCompletion, setDateOfCompletion] = useState('')

const [studentPhoto, setStudentPhoto] = useState(null)
const [studentSignature, setStudentSignature] = useState(null)
const [subjects, setSubjects] = useState("")

const [objectiveMarks, setObjectiveMarks] = useState("")

const [practicalMarks, setPracticalMarks] = useState("")

  
const generateCertificate = async () => {

  try {

    if (!studentName) {
      alert("Enter Student Name")
      return
    }

    if (!courseName) {
      alert("Enter Course Name")
      return
    }

    if (!courseDuration) {
      alert("Enter Course Duration")
      return
    }

    if (!dateOfCompletion) {
      alert("Select Date Of Completion")
      return
    }

    if (!subjects) {
  alert("Enter Subjects")
  return
}

if (!objectiveMarks) {
  alert("Enter Objective Marks")
  return
}

if (!practicalMarks) {
  alert("Enter Practical Marks")
  return
}

    if (!studentPhoto) {
      alert("Upload Student Photo")
      return
    }

    if (!studentSignature) {
      alert("Upload Student Signature")
      return
    }

    if (
  studentPhoto.size >
  2 * 1024 * 1024
) {
  alert(
    "Student Photo must be less than 2MB"
  )
  return
}

if (
  studentSignature.size >
  1 * 1024 * 1024
) {
  alert(
    "Student Signature must be less than 1MB"
  )
  return
}
    setLoading(true)

    const user =
      await account.get()

    const franchiseRes =
      await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [
          Query.equal(
            "email",
            user.email
          )
        ]
      )

  if (
  franchiseRes.documents.length === 0
) {
  setLoading(false)

  alert("Franchise not found")

  return
}

    const franchise =
      franchiseRes.documents[0]

    const CERTIFICATE_FEE = 499

    const currentWallet =
      Number(franchise.wallet || 0)

    if (currentWallet < CERTIFICATE_FEE) {

      alert(
        `Insufficient Wallet Balance.

Required: ₹499
Available: ₹${currentWallet}`
      )

      setLoading(false)

      return
    }

const compressedBlob =
  await imageCompression(
    studentPhoto,
    {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 600
    }
  )

const compressedPhoto =
  new File(
    [compressedBlob],
    studentPhoto.name,
    {
      type: compressedBlob.type
    }
  )

const photoUpload =
  await storage.createFile(
    BUCKET_ID,
    ID.unique(),
    compressedPhoto
  )

    const photoUrl =
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoUpload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

    // STUDENT SIGNATURE

    const signUpload =
      await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        studentSignature
      )

    const signUrl =
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${signUpload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

const certificateNo =
  `PART-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`

    const verifyUrl =
      `${window.location.origin}/participation-verify/${certificateNo}`

    const qrCode =
      await QRCode.toDataURL(
        verifyUrl
      )

    // CREATE CERTIFICATE

const totalMarks =
  Number(objectiveMarks || 0) +
  Number(practicalMarks || 0)

await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  {
    studentName,
    courseName,
    courseDuration,
    dateOfCompletion,

    subjects,
    objectiveMarks,
    practicalMarks,
    totalMarks,

    studentPhoto: photoUrl,
    studentPhotoId: photoUpload.$id,

    studentSignature: signUrl,
    studentSignatureId: signUpload.$id,

    ownerPhoto: franchise.ownerPhoto || "",
    ownerSignature: franchise.signature || "",

    instituteName: franchise.instituteName || "",
    ownerName: franchise.name || "",

    designation: franchise.designation || "",

    mobile: franchise.mobile || "",

    address: franchise.address || "",

    state: franchise.state || "",

    city: franchise.city || "",

    pincode: franchise.pincode || "",

    logo: franchise.logo || "",

    email: franchise.email || "",

    franchiseEmail: user.email,

    certificateNo,

    certificateFee: 499,

    qrCode,

    verifyUrl,

    createdAt: new Date().toISOString()
  }
)
    // DEDUCT WALLET

await databases.updateDocument(
  DATABASE_ID,
  "franchise_approved",
  franchise.$id,
  {
    wallet: String(
      currentWallet - CERTIFICATE_FEE
    )
  }
)

    // TRANSACTION

    await databases.createDocument(
      DATABASE_ID,
      "wallet_transactions",
      ID.unique(),
      {
        franchiseId:
          franchise.$id,

        franchiseEmail:
          user.email,
        

        type: "Debit",

        amount: 499,

        reason:
          "Participation Certificate",

        courseName,

        studentName,

        certificateNo,

        remainingBalance:
          String(
            currentWallet - CERTIFICATE_FEE
          ),

        date:
          new Date()
            .toLocaleDateString("en-GB")
      }
    )

  

    
    alert(
      "Participation Certificate Generated Successfully"
    )

    router.push(
      "/login/institute/add-course/beauty_certificate/list"
    )

  } catch (error) {

    console.log(error)

    alert(
      error.message ||
      "Something went wrong"
    )

  } finally {

    setLoading(false)

  }
}

  return (

    <div className="min-h-screen bg-black text-white p-5 lg:p-10">

      <div className="max-w-4xl mx-auto bg-[#121212] border border-gray-800 rounded-xl p-6">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            ADD PARTICIPATION CERTIFICATE
          </h2>

        </div>

        <div className="grid md:grid-cols-2 gap-5">

          {/* STUDENT NAME */}
<div>
  <label className="block mb-2">
    Student Name
  </label>

  <input
    type="text"
    value={studentName}
    onChange={(e) =>
      setStudentName(
        e.target.value.toUpperCase()
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

{/* COURSE NAME */}
<div>
  <label className="block mb-2">
    Course Name
  </label>

  <input
    type="text"
    value={courseName}
    onChange={(e) =>
      setCourseName(
        e.target.value
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

{/* COURSE DURATION */}
<div>
  <label className="block mb-2">
    Course Duration
  </label>

  <input
    type="text"
    value={courseDuration}
    onChange={(e) =>
      setCourseDuration(
        e.target.value
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

{/* DATE OF COMPLETION */}
<div>
  <label className="block mb-2">
    Date Of Completion
  </label>

  <input
    type="date"
    value={dateOfCompletion}
    onChange={(e) =>
      setDateOfCompletion(
        e.target.value
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

<div>
  <label className="block mb-2">
    Subjects
  </label>

  <input
    type="text"
    placeholder="Hindi, English, Maths, Science"
    value={subjects}
    onChange={(e)=>
      setSubjects(e.target.value)
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

<div>
  <label className="block mb-2">
    Objective Marks
  </label>

  <input
    type="number"
    value={objectiveMarks}
    onChange={(e)=>
      setObjectiveMarks(e.target.value)
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

<div>
  <label className="block mb-2">
    Practical Marks
  </label>

  <input
    type="number"
    value={practicalMarks}
    onChange={(e)=>
      setPracticalMarks(e.target.value)
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
</div>

<div>
  <label className="block mb-2">
    Total Marks
  </label>

  <input
    type="text"
    readOnly
    value={
      Number(objectiveMarks || 0) +
      Number(practicalMarks || 0)
    }
    className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
  />
</div>

{/* STUDENT PHOTO */}
<div>
  <label className="block mb-2">
    Student Photo
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setStudentPhoto(
        e.target.files[0]
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
  {
  studentPhoto && (
    <img
      src={URL.createObjectURL(studentPhoto)}
      alt=""
      className="h-24 w-24 object-cover rounded border border-gray-700 mt-2"
    />
  )
}
</div>

{/* STUDENT SIGNATURE */}
<div>
  <label className="block mb-2">
    Student Signature
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setStudentSignature(
        e.target.files[0]
      )
    }
    className="w-full p-3 bg-black border border-gray-700 rounded"
  />
  {
  studentSignature && (
    <img
      src={URL.createObjectURL(studentSignature)}
      alt=""
      className="h-16 object-contain border border-gray-700 mt-2"
    />
  )
}
</div>

{/* PREVIEW ONLY */}
<div>
  <label className="block mb-2">
    Certificate No
  </label>

  <input
    type="text"
    value={`PART-${Date.now()}`}
    readOnly
    className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
  />
</div>

<div>
  <label className="block mb-2">
    Certificate Fee
  </label>

  <input
    type="text"
    value="₹499"
    readOnly
    className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
  />
</div>
          

        </div>

<button
  onClick={generateCertificate}
  disabled={loading}
  className={`mt-8 px-8 py-3 rounded-lg font-bold ${
    loading
      ? "bg-gray-700 cursor-not-allowed"
      : "bg-orange-500 hover:bg-orange-600 text-black"
  }`}
>
  {loading
    ? "Generating..."
    : "Generate Certificate"}

   
</button>

      </div>

    </div>
  )
}