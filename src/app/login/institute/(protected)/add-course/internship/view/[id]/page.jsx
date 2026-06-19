'use client'

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import * as htmlToImage from 'html-to-image'

const DATABASE_ID =
process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InternshipCertificate() {

  const { id } = useParams()

  const [certificate, setCertificate] =
    useState(null)

  const printRef = useRef()

  useEffect(() => {

    if (!id) return

    const loadCertificate = async () => {

      try {

        const doc =
          await databases.getDocument(
            DATABASE_ID,
            "internship_certificates",
            id
          )

        setCertificate(doc)

      } catch (error) {

        console.log(error)

      }

    }

    loadCertificate()

  }, [id])

  const handleDownload = async () => {

    try {

      const node =
        printRef.current

      const dataUrl =
        await htmlToImage.toPng(
          node,
          {
            quality: 1,
            pixelRatio: 3,
            cacheBust: true
          }
        )

      const link =
        document.createElement('a')

      link.download =
        `${certificate.studentName}_internship_certificate.png`

      link.href =
        dataUrl

      link.click()

    } catch (error) {

      console.log(error)

    }
  }

  if (!certificate)
    return (
      <div className="p-10">
        Loading...
      </div>
    )

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-3 rounded mb-6"
      >
        Download Certificate
      </button>

   <div
  ref={printRef}
  style={{
    width: "1000px",
    position: "relative",
    margin: "auto"
  }}
>

  {/* TEMPLATE */}
  <img
    src="/internship.jpeg"
    className="w-full"
  />

  {/* LOGO */}
  {certificate.logo && (
    <img
      src={certificate.logo}
      className="absolute top-[40px] left-[430px] w-[120px] h-[120px] object-contain"
    />
  )}

  {/* STUDENT NAME */}
  <div
    className="absolute top-[545px] left-0 w-full text-center text-[30px] font-bold"
  >
    {certificate.studentName}
  </div>

  <div
    className="absolute top-[1010px] left-0 w-full text-center text-[30px] font-bold"
  >
    {certificate.studentName}
  </div>

  <div
    className="absolute top-[850px] left-0 w-full text-center text-[30px] font-bold"
  >
    {certificate.studentName}
  </div>

  {/* INTERNSHIP TITLE */}
  <div
    className="absolute top-[651px] left-[455px] text-[22px] font-semibold"
  >
    {certificate.internshipTitle}
  </div>

  {/* DURATION */}
  <div
    className="absolute top-[720px] left-[455px] text-[22px] font-semibold"
  >
    {certificate.duration}
  </div>

  {/* SHIFT */}
  <div
    className="absolute top-[681px] left-[250px] text-[24px]"
  >
    {certificate.shift}
  </div>

  {/* INSTITUTE NAME */}
  <div
    className="absolute top-[190px] left-0 w-full text-center text-[27px] font-bold"
  >
    {certificate.instituteName}
  </div>
  <div
    className="absolute top-[620px] left-0 w-full text-center text-[24px] font-bold"
  >
    {certificate.instituteName}
  </div>
  <div
    className="absolute top-[790px] left-0 w-full text-center text-[24px] font-bold"
  >
    {certificate.instituteName}
  </div>

  {/* DATE RANGE */}
  <div
    className="absolute top-[720px] left-0 w-full text-center text-[20px]"
  >
    {certificate.fromDate} To {certificate.toDate}
  </div>

  {/* STUDENT PHOTO */}
  <img
    src={certificate.studentPhoto}
    className="absolute top-[440px] right-[90px] w-[100px] h-[130px] object-cover border border-gray-400"
  />

  {/* ISSUE DATE */}
  <div
    className="absolute bottom-[200px] left-[590px] text-[22px] font-semibold"
  >
    {certificate.issueDate}
  </div>

  {/* SIGNATURE */}
  {certificate.signature && (
    <img
      src={certificate.signature}
      className="absolute bottom-[85px] left-[110px] w-[140px]"
    />
  )}

  {/* QR */}
  {certificate.qrCode && (
    <img
      src={certificate.qrCode}
      className="absolute bottom-[60px] right-[90px] w-[90px]"
    />
  )}

  {/* CERTIFICATE NUMBER */}
  <div
    className="absolute bottom-[35px] left-[330px] text-[15px] font-semibold"
  >
    Certificate No: {certificate.certificateNo}
  </div>

</div>
</div>
) }