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

  // =========================
  // CERTIFICATE DETAILS
  // =========================

  const [studentName, setStudentName] =
    useState('')

  const [fatherName, setFatherName] =
    useState('')

  const [motherName, setMotherName] =
    useState('')

  const [dateOfBirth, setDateOfBirth] =
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


  // =========================
  // SUBJECTS
  // =========================

  const [subjects, setSubjects] = useState([
    {
      name: '',
      objective: '',
      practical: ''
    }
  ])


  // =========================
  // ADD SUBJECT
  // =========================

  const addSubject = () => {

    setSubjects([
      ...subjects,
      {
        name: '',
        objective: '',
        practical: ''
      }
    ])

  }


  // =========================
  // REMOVE SUBJECT
  // =========================

  const removeSubject = (index) => {

    if (subjects.length === 1) {
      return
    }

    setSubjects(
      subjects.filter((_, i) => i !== index)
    )

  }


  // =========================
  // UPDATE SUBJECT
  // =========================

  const updateSubject = (
    index,
    field,
    value
  ) => {

    const updated = [...subjects]

    updated[index][field] = value

    setSubjects(updated)

  }


  // =========================
  // GENERATE
  // =========================

  const generateCertificate = async () => {

    try {

      // =========================
      // BASIC VALIDATION
      // =========================

      if (!studentName.trim()) {
        alert("Enter Student Name")
        return
      }

      if (!photoFile) {
        alert("Upload Student Photo")
        return
      }

      if (!internshipTitle.trim()) {
        alert("Enter Internship Title")
        return
      }

      if (!days.trim()) {
        alert("Enter Internship Duration")
        return
      }

      if (!fromDate) {
        alert("Select From Date")
        return
      }

      if (!toDate) {
        alert("Select To Date")
        return
      }

      if (!issueDate) {
        alert("Select Issue Date")
        return
      }


      // =========================
      // SUBJECT VALIDATION
      // =========================

      for (let i = 0; i < subjects.length; i++) {

        const subject = subjects[i]

        if (!subject.name.trim()) {
          alert(`Enter Subject Name for Subject ${i + 1}`)
          return
        }

        if (
          subject.objective === '' ||
          subject.practical === ''
        ) {
          alert(
            `Enter Objective and Practical Marks for Subject ${i + 1}`
          )
          return
        }

        const objective =
          Number(subject.objective)

        const practical =
          Number(subject.practical)

        if (
          Number.isNaN(objective) ||
          Number.isNaN(practical)
        ) {
          alert(
            `Marks must be numbers for Subject ${i + 1}`
          )
          return
        }

        if (objective < 0 || objective > 50) {
          alert(
            `Objective marks must be between 0 and 50 for Subject ${i + 1}`
          )
          return
        }

        if (practical < 0 || practical > 50) {
          alert(
            `Practical marks must be between 0 and 50 for Subject ${i + 1}`
          )
          return
        }

      }


      setLoading(true)


      // =========================
      // ACCOUNT
      // =========================

      const user =
        await account.get()


      // =========================
      // FRANCHISE
      // =========================

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

        setLoading(false)

        return
      }


      const franchise =
        franchiseRes.documents[0]


      // =========================
      // CERTIFICATE FEE
      // =========================

      const CERTIFICATE_FEE = 450

      const currentWallet =
        Number(franchise.wallet || 0)


      if (
        currentWallet <
        CERTIFICATE_FEE
      ) {

        alert(
          `Insufficient Wallet Balance.

Required: ₹450
Available: ₹${currentWallet}`
        )

        setLoading(false)

        return
      }


      // =========================
      // PHOTO UPLOAD
      // =========================

      const upload =
        await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photoFile
        )


      const photoUrl =
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${upload.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`


      // =========================
      // CERTIFICATE NUMBER
      // =========================

      const certificateNo =
        `INT-${Date.now()}`


      // =========================
      // VERIFY URL
      // =========================

      const verifyUrl =
        `${window.location.origin}/internship-verify/${certificateNo}`


      // =========================
      // QR CODE
      // =========================

      const qrCode =
        await QRCode.toDataURL(
          verifyUrl
        )


      // =========================
      // CLEAN SUBJECT DATA
      // =========================

      const cleanSubjects =
        subjects.map((subject) => ({
          name:
            subject.name.trim(),

          objective:
            Number(subject.objective),

          practical:
            Number(subject.practical)
        }))


      // =========================
      // CREATE DATABASE DOCUMENT
      // =========================

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {

          // =========================
          // EXISTING CERTIFICATE DATA
          // =========================

          studentName:
            studentName.trim().toUpperCase(),

          studentPhoto:
            photoUrl,

          internshipTitle:
            internshipTitle.trim(),

          shift,

          days:
            days.trim(),

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

          verifyUrl,


          // =========================
          // MARKSHEET DATA
          // =========================

          fatherName:
            fatherName.trim().toUpperCase(),

          motherName:
            motherName.trim().toUpperCase(),

          dateOfBirth,

          subjects:
            JSON.stringify(cleanSubjects)

        }
      )


      // =========================
      // UPDATE WALLET
      // =========================

      const updatedWallet =
        currentWallet -
        CERTIFICATE_FEE


      await databases.updateDocument(
        DATABASE_ID,
        "franchise_approved",
        franchise.$id,
        {
          wallet:
            String(updatedWallet)
        }
      )


      // =========================
      // SAVE TRANSACTION
      // =========================

      await databases.createDocument(
        DATABASE_ID,
        "wallet_transactions",
        ID.unique(),
        {
          franchiseId:
            franchise.$id,

          franchiseEmail:
            user.email,

          type:
            "Debit",

          amount:
            450,

          reason:
            "Internship Certificate",

          courseName:
            internshipTitle,

          studentName:
            studentName,

          certificateNo:
            certificateNo,

          remainingBalance:
            String(updatedWallet),

          date:
            new Date()
              .toLocaleDateString("en-GB")
        }
      )


      // =========================
      // SUCCESS
      // =========================

      alert(
        "Certificate & Marksheet Generated Successfully"
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


  // =========================
  // UI
  // =========================

  return (

    <div className="min-h-screen bg-black text-white p-5 lg:p-10">

      <div className="max-w-6xl mx-auto">

        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-6 lg:p-8">

          {/* =========================
              HEADER
          ========================= */}

          <div className="mb-8">

            <h2 className="text-2xl lg:text-3xl font-bold">
              ADD INTERNSHIP CERTIFICATE
            </h2>

            <p className="text-gray-400 mt-2">
              Add certificate and marksheet details
            </p>

          </div>


          {/* =========================
              STUDENT DETAILS
          ========================= */}

          <div className="mb-8">

            <h3 className="text-xl font-semibold mb-5 text-orange-400">
              Student Details
            </h3>


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
                  placeholder="Enter student name"
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* PHOTO */}

              <div>

                <label className="block mb-2">
                  Student Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPhotoFile(
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* FATHER */}

              <div>

                <label className="block mb-2">
                  Father Name
                </label>

                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) =>
                    setFatherName(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Enter father name"
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* MOTHER */}

              <div>

                <label className="block mb-2">
                  Mother Name
                </label>

                <input
                  type="text"
                  value={motherName}
                  onChange={(e) =>
                    setMotherName(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Enter mother name"
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* DOB */}

              <div>

                <label className="block mb-2">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(
                      e.target.value
                    )
                  }
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>

            </div>

          </div>


          {/* =========================
              INTERNSHIP DETAILS
          ========================= */}

          <div className="mb-8">

            <h3 className="text-xl font-semibold mb-5 text-orange-400">
              Internship Details
            </h3>


            <div className="grid md:grid-cols-2 gap-5">

              {/* TITLE */}

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
                  placeholder="Example: Web Development"
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* SHIFT */}

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
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
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


              {/* DURATION */}

              <div>

                <label className="block mb-2">
                  Internship Duration
                </label>

                <input
                  type="text"
                  placeholder="Example: 30 Days or 240 Hours"
                  value={days}
                  onChange={(e) =>
                    setDays(
                      e.target.value
                    )
                  }
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* ISSUE DATE */}

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
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* FROM DATE */}

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
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>


              {/* TO DATE */}

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
                  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                />

              </div>

            </div>

          </div>


          {/* =========================
              MARKSHEET
          ========================= */}

          <div className="border-t border-gray-800 pt-8">

            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5">

              <div>

                <h3 className="text-xl font-semibold text-orange-400">
                  Marksheet Subjects
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Objective: 50 marks | Practical: 50 marks
                </p>

              </div>


              <button
                type="button"
                onClick={addSubject}
                className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-5 py-2 rounded-lg"
              >
                + Add Subject
              </button>

            </div>


            {/* SUBJECT HEADERS */}

            <div className="hidden md:grid grid-cols-[1fr_180px_180px_80px] gap-3 mb-2 px-2">

              <div className="text-gray-400 text-sm">
                Subject Name
              </div>

              <div className="text-gray-400 text-sm">
                Objective / 50
              </div>

              <div className="text-gray-400 text-sm">
                Practical / 50
              </div>

              <div></div>

            </div>


            {/* SUBJECT ROWS */}

            <div className="space-y-4">

              {subjects.map(
                (subject, index) => (

                  <div
                    key={index}
                    className="grid md:grid-cols-[1fr_180px_180px_80px] gap-3 bg-black border border-gray-800 rounded-xl p-4"
                  >

                    {/* SUBJECT NAME */}

                    <div>

                      <label className="md:hidden block text-sm text-gray-400 mb-2">
                        Subject Name
                      </label>

                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) =>
                          updateSubject(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder={`Subject ${index + 1}`}
                        className="w-full p-3 bg-[#121212] border border-gray-700 rounded-lg"
                      />

                    </div>


                    {/* OBJECTIVE */}

                    <div>

                      <label className="md:hidden block text-sm text-gray-400 mb-2">
                        Objective / 50
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={subject.objective}
                        onChange={(e) =>
                          updateSubject(
                            index,
                            "objective",
                            e.target.value
                          )
                        }
                        placeholder="0 - 50"
                        className="w-full p-3 bg-[#121212] border border-gray-700 rounded-lg"
                      />

                    </div>


                    {/* PRACTICAL */}

                    <div>

                      <label className="md:hidden block text-sm text-gray-400 mb-2">
                        Practical / 50
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={subject.practical}
                        onChange={(e) =>
                          updateSubject(
                            index,
                            "practical",
                            e.target.value
                          )
                        }
                        placeholder="0 - 50"
                        className="w-full p-3 bg-[#121212] border border-gray-700 rounded-lg"
                      />

                    </div>


                    {/* REMOVE */}

                    <div className="flex items-center">

                      <button
                        type="button"
                        onClick={() =>
                          removeSubject(index)
                        }
                        disabled={
                          subjects.length === 1
                        }
                        className="w-full md:w-auto bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>


          {/* =========================
              GENERATE BUTTON
          ========================= */}

          <div className="mt-10 flex flex-col sm:flex-row gap-4">

            <button
              onClick={generateCertificate}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold px-8 py-3 rounded-lg"
            >

              {loading
                ? "Generating..."
                : "Generate Certificate & Marksheet"
              }

            </button>

          </div>

        </div>

      </div>

    </div>

  )

}