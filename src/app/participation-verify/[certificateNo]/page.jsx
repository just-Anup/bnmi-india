'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import {
  FaCheckCircle,
  FaUserGraduate,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  'participation_certificates'

export default function VerifyCertificate() {

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
        res.documents.length > 0
      ) {
        setCertificate(
          res.documents[0]
        )
      }

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)

    }

  }

  if (loading) {

    return (

      <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl">

        Loading Verification...

      </div>

    )

  }

  if (!certificate) {

    return (

      <div className="min-h-screen bg-black flex items-center justify-center">

        <div className="bg-red-600 text-white px-10 py-6 rounded-xl text-2xl font-bold">

          INVALID CERTIFICATE

        </div>

      </div>

    )

  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 p-6">

      <div className="max-w-6xl mx-auto">

        <div className="bg-green-600 text-white rounded-2xl p-6 flex items-center justify-center gap-4 mb-8">

          <FaCheckCircle size={50} />

          <div>

            <h1 className="text-3xl font-bold">

              Certificate Verified

            </h1>

            <p>

              This certificate is valid and issued by BNMI

            </p>

          </div>

        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Student */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-white">

            <h2 className="text-2xl font-bold mb-5">

              Student Details

            </h2>

            <img
              src={certificate.studentPhoto}
              alt=""
              className="w-40 h-40 rounded-xl mx-auto object-cover border-4 border-green-500"
            />

            <div className="mt-6 space-y-3">

              <p>
                <FaUserGraduate className="inline mr-2" />
                <b>Name:</b>{' '}
                {certificate.studentName}
              </p>

              <p>
                <b>Certificate No:</b>{' '}
                {certificate.certificateNo}
              </p>

              <p>
                <b>Course:</b>{' '}
                {certificate.courseName}
              </p>

              <p>
                <b>Duration:</b>{' '}
                {certificate.courseDuration}
              </p>

              <p>
                <b>Completion:</b>{' '}
                {certificate.dateOfCompletion}
              </p>

            </div>

          </div>

          {/* Institute */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-white">

            <h2 className="text-2xl font-bold mb-5">

              Institute Details

            </h2>

            {certificate.logo && (

              <img
                src={certificate.logo}
                alt=""
                className="h-24 mx-auto mb-4"
              />

            )}

            <div className="space-y-3">

              <p>
                <FaBuilding className="inline mr-2" />
                <b>Institute:</b>{' '}
                {certificate.instituteName}
              </p>

              <p>
                <b>Owner:</b>{' '}
                {certificate.ownerName}
              </p>

              <p>
                <b>Designation:</b>{' '}
                {certificate.designation}
              </p>

              <p>
                <FaEnvelope className="inline mr-2" />
                {certificate.email}
              </p>

              <p>
                <FaPhone className="inline mr-2" />
                {certificate.mobile}
              </p>

            </div>

          </div>

          {/* Verification */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-white">

            <h2 className="text-2xl font-bold mb-5">

              Verification

            </h2>

            <img
              src={certificate.qrCode}
              alt=""
              className="w-52 mx-auto"
            />

            <div className="mt-5 space-y-3">

              <p className="text-green-400 font-bold text-xl">

                VERIFIED

              </p>

              <p>
                <FaMapMarkerAlt className="inline mr-2" />
                {certificate.address}
              </p>

              <p>
                {certificate.city},{' '}
                {certificate.state}
              </p>

              <p>
                PIN : {certificate.pincode}
              </p>

              <p className="text-xs break-all text-gray-300">

                {certificate.verifyUrl}

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}