'use client'

import { useState } from 'react'
import { databases, account, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'
import QRCode from 'qrcode'
import { useRouter } from 'next/navigation'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const BUCKET_ID =
  "6986e8a4001925504f6b"

const COLLECTION_ID =
  "internship_certificates"

export default function AddInternship() {

  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const [studentName, setStudentName] =
    useState('')

  const [internshipTitle, setInternshipTitle] =
    useState('')

  const [shift, setShift] =
    useState('Morning')

  const [days, setDays] =
    useState('')

  const [fromDate, setFromDate] =
    useState('')

  const [toDate, setToDate] =
    useState('')

  const [issueDate, setIssueDate] =
    useState('')

  const [photoFile, setPhotoFile] =
    useState(null)

  const generateCertificate = async () => {

    try {

      if (!studentName) {
        alert("Enter Student Name")
        return
      }

      if (!photoFile) {
        alert("Upload Student Photo")
        return
      }

      setLoading(true)

      const user =
        await account.get()

      // FRANCHISE

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
        alert("Franchise not found")
        return
      }

      const franchise =
        franchiseRes.documents[0]

        const CERTIFICATE_FEE = 450

const currentWallet =
  Number(franchise.wallet || 0)

if (currentWallet < CERTIFICATE_FEE) {

  alert(
    `Insufficient Wallet Balance.

Required: ₹450
Available: ₹${currentWallet}`
  )

  setLoading(false)

  return
}

      // PHOTO UPLOAD

      const upload =
        await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photoFile
        )

      const photoUrl =
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

      const certificateNo =
        `INT-${Date.now()}`

      const verifyUrl =
        `${window.location.origin}/internship-verify/${certificateNo}`

      const qrCode =
        await QRCode.toDataURL(
          verifyUrl
        )

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          
          studentName,
          studentPhoto: photoUrl,

          internshipTitle,
          shift,
          days,

          fromDate,
          toDate,
          issueDate,

          certificateNo,

          franchiseEmail:
            user.email,

          instituteName:
            franchise.instituteName || '',

          logo:
            franchise.certificateLogo ||
            franchise.logo ||
            '',

          signature:
            franchise.signature || '',

          qrCode,
          verifyUrl
        }
      )

     
 const updatedWallet =
  currentWallet - CERTIFICATE_FEE

await databases.updateDocument(
  DATABASE_ID,
  "franchise_approved",
  franchise.$id,
  {
    wallet: String(updatedWallet)
  }
)

// SAVE TRANSACTION

await databases.createDocument(
  DATABASE_ID,
  "wallet_transactions",
  ID.unique(),
  {
    franchiseId: franchise.$id,
    franchiseEmail: user.email,
    type: "Debit",
    amount: 450,
    reason: "Internship Certificate",
    courseName: internshipTitle,
    studentName: studentName,
    certificateNo: certificateNo,
    remainingBalance: String(updatedWallet),
    date: new Date().toLocaleDateString("en-GB")
  }
)

      alert(
        "Internship Certificate Generated Successfully"
      )

      router.push(
        "/login/institute/add-course/internship/list"
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
            ADD INTERNSHIP CERTIFICATE
          </h2>

        </div>

        <div className="grid md:grid-cols-2 gap-5">

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

          <div>

            <label className="block mb-2">
              Student Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPhotoFile(
                  e.target.files[0]
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

          <div>

            <label className="block mb-2">
              Internship Title
            </label>

            <input
              type="text"
              value={internshipTitle}
              onChange={(e) =>
                setInternshipTitle(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

          <div>

            <label className="block mb-2">
              Shift
            </label>

            <select
              value={shift}
              onChange={(e) =>
                setShift(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            >
              <option>
                Morning
              </option>

              <option>
                Evening
              </option>

              <option>
                Night
              </option>

            </select>

          </div>

          <div>

            <label className="block mb-2">
              Internship Days
            </label>

            <input
              type="number"
              value={days}
              onChange={(e) =>
                setDays(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

          <div>

            <label className="block mb-2">
              Issue Date
            </label>

            <input
              type="date"
              value={issueDate}
              onChange={(e) =>
                setIssueDate(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

          <div>

            <label className="block mb-2">
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

          <div>

            <label className="block mb-2">
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              className="w-full p-3 bg-black border border-gray-700 rounded"
            />

          </div>

        </div>

        <button
          onClick={generateCertificate}
          disabled={loading}
          className="mt-8 bg-orange-500 hover:bg-orange-600 text-black font-bold px-8 py-3 rounded-lg"
        >
          {
            loading
              ? "Generating..."
              : "Generate Certificate"
          }
        </button>

      </div>

    </div>
  )
}