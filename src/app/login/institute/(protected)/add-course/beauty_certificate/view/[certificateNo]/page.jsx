'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  'participation_certificates'

export default function ParticipationCertificate() {

  const params = useParams()

  const [certificate, setCertificate] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

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
              'certificateNo',
              params.certificateNo
            )
          ]
        )

      if (
        res.documents.length === 0
      ) {
        alert(
          'Certificate not found'
        )
        return
      }

      setCertificate(
        res.documents[0]
      )

    } catch (error) {

      console.log(error)

      alert(
        'Failed to load certificate'
      )

    } finally {

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
        Certificate Not Found
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-gray-100 p-5">

      <div className="mb-5 flex gap-3">

        <button
          onClick={() =>
            window.print()
          }
          className="bg-green-600 text-white px-5 py-2 rounded"
        >
          Print
        </button>

      </div>

      <div
        className="relative mx-auto"
        style={{
          width: '1470px',
          height: '1070px',
          backgroundImage:
            "url('/certificate-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >

        {/* =========================
            STUDENT NAME
        ========================== */}

        <div
          className="absolute"
          style={{
            top: '420px',
            left: '350px',
            width: '750px'
          }}
        >
          <h1 className="text-5xl text-center font-bold">
            {certificate.studentName}
          </h1>
        </div>

        {/* =========================
            COURSE NAME
        ========================== */}

        <div
          className="absolute"
          style={{
            top: '620px',
            left: '300px',
            width: '850px'
          }}
        >
          <h2 className="text-3xl text-center">
            {certificate.courseName}
          </h2>
        </div>

        {/* =========================
            INSTITUTE NAME
        ========================== */}

        <div
          className="absolute"
          style={{
            top: '700px',
            left: '300px',
            width: '850px'
          }}
        >
          <h2 className="text-2xl text-center">
            {certificate.instituteName}
          </h2>
        </div>

        {/* =========================
            STUDENT PHOTO
        ========================== */}

        <img
          src={certificate.studentPhoto}
          alt=""
          className="absolute object-cover border"
          style={{
            top: '130px',
            right: '120px',
            width: '160px',
            height: '200px'
          }}
        />

        {/* =========================
            STUDENT SIGNATURE
        ========================== */}

        <img
          src={certificate.studentSignature}
          alt=""
          className="absolute object-contain"
          style={{
            bottom: '270px',
            right: '140px',
            width: '180px',
            height: '70px'
          }}
        />

        {/* =========================
            OWNER SIGNATURE
        ========================== */}

        <img
          src={certificate.ownerSignature}
          alt=""
          className="absolute object-contain"
          style={{
            bottom: '270px',
            left: '120px',
            width: '180px',
            height: '70px'
          }}
        />

        {/* =========================
            OWNER PHOTO
        ========================== */}

        <img
          src={certificate.ownerPhoto}
          alt=""
          className="absolute object-cover border"
          style={{
            bottom: '120px',
            left: '80px',
            width: '120px',
            height: '120px'
          }}
        />

        {/* =========================
            DATE OF COMPLETION
        ========================== */}

        <div
          className="absolute text-center"
          style={{
            bottom: '170px',
            left: '380px',
            width: '180px'
          }}
        >
          {certificate.dateOfCompletion}
        </div>

        {/* =========================
            COURSE DURATION
        ========================== */}

        <div
          className="absolute text-center"
          style={{
            bottom: '170px',
            left: '640px',
            width: '180px'
          }}
        >
          {certificate.courseDuration}
        </div>

        {/* =========================
            CERTIFICATE NUMBER
        ========================== */}

        <div
          className="absolute text-center"
          style={{
            bottom: '170px',
            right: '330px',
            width: '220px'
          }}
        >
          {certificate.certificateNo}
        </div>

        {/* =========================
            QR CODE
        ========================== */}

        <img
          src={certificate.qrCode}
          alt=""
          className="absolute"
          style={{
            bottom: '80px',
            right: '80px',
            width: '120px',
            height: '120px'
          }}
        />

      </div>

    </div>
  )
}