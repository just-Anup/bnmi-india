'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  'internship_certificates'

export default function InternshipVerification() {

  const { certificateNo } =
    useParams()

  const [certificate, setCertificate] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    if (!certificateNo) return

    const loadCertificate = async () => {

      try {

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal('certificateNo', certificateNo),
          ]
        )

        if (res.documents.length > 0) {
          setCertificate(res.documents[0])
        }

      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }

    }

    loadCertificate()

  }, [certificateNo])

  if (loading) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center">

        <div className="text-center">

          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

          <h2 className="text-white text-2xl font-bold">
            Verifying Certificate...
          </h2>

        </div>

      </div>

    )

  }

  if (!certificate) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center p-5">

        <div className="max-w-xl w-full bg-[#121212] border border-red-600 rounded-3xl p-10 text-center shadow-2xl">

          <div className="text-7xl mb-5">
            ❌
          </div>

          <h1 className="text-4xl font-bold text-red-500 mb-4">
            Invalid Certificate
          </h1>

          <p className="text-gray-300 text-lg">

            This internship certificate could not be verified.

          </p>

          <p className="text-gray-500 mt-3">

            Please contact your institute if you believe this is an error.

          </p>

        </div>

      </div>

    )

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-black via-[#090909] to-black py-12 px-4">

      <div className="max-w-5xl mx-auto bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(249,115,22,.15)]">

        {/* Header */}

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-center">

          <div className="text-6xl mb-4">
            ✅
          </div>

          <h1 className="text-4xl font-bold text-black">

            Certificate Verified

          </h1>

          <p className="text-black font-medium mt-2">

            This Internship Certificate is Authentic

          </p>

        </div>

        <div className="p-8">
            {/* DETAILS CARD */}

<div className="grid lg:grid-cols-3 gap-8">

  {/* LEFT */}

  <div className="flex flex-col items-center">

    <img
      src={certificate.studentPhoto}
      alt={certificate.studentName}
      className="w-52 h-60 rounded-2xl border-4 border-orange-500 object-cover shadow-xl"
    />

    <h2 className="text-3xl font-bold text-white mt-6 text-center">
      {certificate.studentName}
    </h2>

    <p className="text-orange-400 text-lg mt-2">
      Internship Student
    </p>

  </div>

  {/* RIGHT */}

  <div className="lg:col-span-2">

    <div className="grid md:grid-cols-2 gap-5">

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Certificate Number
        </p>

        <h3 className="text-white text-xl font-semibold mt-2 break-all">
          {certificate.certificateNo}
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Institute Name
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.instituteName}
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Internship Title
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.internshipTitle}
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Shift
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.shift}
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Internship Duration
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.days} Days
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5">

        <p className="text-gray-400 text-sm">
          Issue Date
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.issueDate}
        </h3>

      </div>

      <div className="bg-black border border-gray-800 rounded-xl p-5 md:col-span-2">

        <p className="text-gray-400 text-sm">
          Internship Period
        </p>

        <h3 className="text-white text-xl font-semibold mt-2">
          {certificate.fromDate} To {certificate.toDate}
        </h3>

      </div>

    </div>

  </div>

</div>
        {/* VERIFIED BADGE */}

        <div className="mt-10">

          <div className="bg-green-500/10 border border-green-500 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">

            <div>

              <h2 className="text-3xl font-bold text-green-400">
                ✅ VERIFIED CERTIFICATE
              </h2>

              <p className="text-gray-300 mt-2">
                This internship certificate has been successfully verified from
                our official database.
              </p>

            </div>

            {certificate.qrCode && (

              <img
                src={certificate.qrCode}
                alt="QR Code"
                className="w-32 h-32 bg-white p-2 rounded-xl"
              />

            )}

          </div>

        </div>

        {/* INSTITUTE INFO */}

        <div className="mt-10 grid md:grid-cols-2 gap-8">

          <div className="bg-black border border-gray-800 rounded-2xl p-6">

            <h3 className="text-orange-400 text-xl font-bold mb-5">
              Institute Information
            </h3>

            <div className="space-y-4">

              {certificate.logo && (

                <div className="flex justify-center">

                  <img
                    src={certificate.logo}
                    alt="Institute Logo"
                    className="w-28 h-28 object-contain"
                  />

                </div>

              )}

              <div>

                <p className="text-gray-400">
                  Institute Name
                </p>

                <p className="text-white text-xl font-semibold mt-1">
                  {certificate.instituteName}
                </p>

              </div>

            </div>

          </div>

          <div className="bg-black border border-gray-800 rounded-2xl p-6">

            <h3 className="text-orange-400 text-xl font-bold mb-5">
              Authorized Signature
            </h3>

            <div className="flex justify-center items-center h-full">

              {certificate.signature ? (

                <img
                  src={certificate.signature}
                  alt="Signature"
                  className="h-24 object-contain"
                />

              ) : (

                <p className="text-gray-500">
                  Signature Not Available
                </p>

              )}

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="mt-12 border-t border-gray-800 pt-6 text-center">

          <p className="text-green-400 text-lg font-bold">
            ✔ This certificate is digitally verified and authentic.
          </p>

          <p className="text-gray-500 mt-3">
            Generated & Verified by BNMI Internship Certificate Verification System
          </p>

        </div>

      </div>

    </div>
</div>
  )

}