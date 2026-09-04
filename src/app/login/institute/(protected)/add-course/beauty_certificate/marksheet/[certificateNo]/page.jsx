'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import * as htmlToImage from "html-to-image"

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  "participation_certificates"

export default function ViewMarksheet() {

  const params = useParams()

  const [certificate, setCertificate] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

    const downloadMarksheet = async () => {

  try {

    const node =
      document.getElementById(
        "marksheet"
      )

    const images =
      node.querySelectorAll("img")

    for (let img of images) {

      const src = img.src

      if (!src.startsWith("data:")) {

        try {

          const base64 =
            await toBase64(src)

          img.src = base64

        } catch (err) {

          console.log(err)

        }

      }

    }

    const dataUrl =
      await htmlToImage.toPng(
        node,
        {
          quality: 1,
          pixelRatio: 3,
          cacheBust: true,

          width:
            node.scrollWidth,

          height:
            node.scrollHeight,

          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
            overflow: "visible"
          }

        }
      )

    const link =
      document.createElement("a")

    link.download =
      `${certificate.certificateNo}-Marksheet.png`

    link.href = dataUrl

    link.click()

  }

  catch (err) {

    console.log(err)

    alert("Download Failed")

  }

}

useEffect(() => {

  fetchCertificate()

}, [])

const fetchCertificate = async () => {

  try {

    const res =
      await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal(
            "certificateNo",
            params.certificateNo
          )
        ]
      )

    if (res.documents.length === 0) {

      alert("Marksheet Not Found")

      return

    }

    const doc = res.documents[0]

    // =====================================
    // GET FRANCHISE LOGO
    // =====================================

    if (doc.franchiseEmail) {

      const franchiseRes =
        await databases.listDocuments(
          DATABASE_ID,
          "franchise_approved",
          [
            Query.equal(
              "email",
              doc.franchiseEmail
            )
          ]
        )

      if (franchiseRes.documents.length > 0) {

        doc.logo =
          franchiseRes.documents[0].logo || ""

      }

    }

    // =====================================
    // TOTAL MARKS
    // =====================================

    doc.totalMarks =
      Number(doc.objectiveMarks || 0) +
      Number(doc.practicalMarks || 0)

    setCertificate(doc)

  }

  catch (err) {

    console.log("MARKSHEET LOAD ERROR:", err)

    alert("Failed to Load")

  }

  finally {

    setLoading(false)

  }

}

if (loading) {

  return (

    <div className="h-screen flex items-center justify-center">

      Loading...

    </div>

  )

}

if (!certificate) {

  return (

    <div className="h-screen flex items-center justify-center">

      Marksheet Not Found

    </div>

  )

}

return (

  <div className="min-h-screen bg-gray-100 p-5">

    <div className="mb-5 flex gap-3">

      <button
        onClick={() => window.print()}
        className="bg-green-600 text-white px-5 py-2 rounded"
      >
        Print
      </button>

      <button
        onClick={downloadMarksheet}
        className="bg-blue-600 text-white px-5 py-2 rounded"
      >
        Download
      </button>

    </div>

    <div className="overflow-auto">

      <div
        className="scale-75 origin-top"
        style={{
          width: "1100px",
          margin: "0 auto"
        }}
      >

        <div
          id="marksheet"
          className="relative mx-auto"
          style={{
            width: "1470px",
            height: "1070px"
          }}
        >

          {/* BACKGROUND */}

          <img
            src="/beauty-marksheet.png"
            alt=""
            className="absolute inset-0 w-full h-full"
          />

{/* FRANCHISE LOGO */}
{certificate.logo && (
  <img
    src={certificate.logo}
    alt="Franchise Logo"
    className="absolute object-contain"
    style={{
      top: "70px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "180px",
      height: "100px",
      zIndex: 10
    }}
  />
)}

          {/* ========================= */}
          {/* STUDENT NAME */}
          {/* ========================= */}

          <div
            className="absolute text-[19px] font-semibold"
            style={{
              top: "350px",
              left: "220px",
              width: "520px"
              
            }}
          >
            {certificate.studentName}
          </div>

          {/* ========================= */}
          {/* INSTITUTE NAME */}
          {/* ========================= */}

          <div
            className="absolute text-[19px] font-semibold"
            style={{
              top: "384px",
              left: "220px",
              width: "520px"
            }}
          >
            {certificate.instituteName}
          </div>

          {/* ========================= */}
          {/* COURSE NAME */}
          {/* ========================= */}

          <div
            className="absolute text-[19px] font-semibold text-center"
            style={{
              top: "350px",
              left: "660px",
              width: "520px"
            }}
          >
            {certificate.courseName}
          </div>

          {/* ========================= */}
          {/* SUBJECT */}
          {/* ========================= */}

          <div
            className="absolute text-[19px] font-semibold"
            style={{
              top: "500px",
              left: "120px",
              width: "840px",
              lineHeight: "32px",
            
            }}
          >
            {certificate.subjects}
          </div>

          {/* ========================= */}
          {/* OBJECTIVE */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] font-semibold text-center"
            style={{
              top: "500px",
              left: "1000px",
              width: "115px"
            }}
          >
            {certificate.objectiveMarks}
          </div>

          {/* ========================= */}
          {/* PRACTICAL */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] font-semibold text-center"
            style={{
              top: "500px",
              left: "1115px",
              width: "110px"
            }}
          >
            {certificate.practicalMarks}
          </div>

          {/* ========================= */}
          {/* TOTAL */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] font-semibold text-center"
            style={{
              top: "500px",
              left: "1230px",
              width: "110px"
            }}
          >
            {certificate.totalMarks}
          </div>

          {/* ========================= */}
          {/* TOTAL ROW */}
          {/* ========================= */}

          <div
            className="absolute text-[22px] font-bold text-center"
            style={{
              top: "790px",
              left: "1225px",
              width: "110px"
            }}
          >
            {certificate.totalMarks}
          </div>

          {/* ========================= */}
          {/* DATE OF COMPLETION */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] text-center font-semibold"
            style={{
              bottom: "165px",
              left: "310px",
              width: "220px"
            }}
          >
            {certificate.dateOfCompletion}
          </div>

          {/* ========================= */}
          {/* COURSE DURATION */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] text-center"
            style={{
              bottom: "165px",
              left: "600px",
              width: "260px"
            }}
          >
            {certificate.courseDuration}
          </div>

          {/* ========================= */}
          {/* CERTIFICATE NUMBER */}
          {/* ========================= */}

          <div
            className="absolute text-[20px] text-center"
            style={{
              bottom: "165px",
              right: "275px",
              width: "270px"
            }}
          >
            {certificate.certificateNo}
          </div>

          {/* ========================= */}
          {/* FRANCHISE SIGNATURE */}
          {/* ========================= */}

          <img
            src={certificate.ownerSignature}
            alt=""
            className="absolute object-contain"
            style={{
              bottom: "78px",
              right: "140px",
              width: "180px",
              height: "60px"
            }}
          />

          {/* ========================= */}
          {/* FRANCHISE OWNER NAME */}
          {/* ========================= */}

          <div
            className="absolute text-[22px] font-semibold text-center"
            style={{
              bottom: "40px",
              right: "80px",
              width: "300px"
            }}
          >
            {certificate.ownerName}
          </div>

        </div>

      </div>

    </div>

  </div>

)
}