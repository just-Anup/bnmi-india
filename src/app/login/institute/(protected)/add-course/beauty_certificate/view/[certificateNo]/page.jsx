'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import * as htmlToImage from "html-to-image"

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
const toBase64 = async (url) => {

  const res = await fetch(url);

  const blob = await res.blob();

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onloadend = () =>
      resolve(reader.result);

    reader.readAsDataURL(blob);

  });

};

const downloadCertificate = async () => {

  try {

    const node =
      document.getElementById(
        "certificate"
      );

    const images =
      node.querySelectorAll("img");

    for (let img of images) {

      const src = img.src;

      if (!src.startsWith("data:")) {

        try {

          const base64 =
            await toBase64(src);

          img.src = base64;

        } catch (err) {

          console.log(
            "IMAGE ERROR:",
            err
          );

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
            transform:
              "scale(1)",
            transformOrigin:
              "top left",
            overflow:
              "visible"
          }
        }
      );

    const link =
      document.createElement(
        "a"
      );

    link.download =
      `${certificate.certificateNo}.png`;

    link.href = dataUrl;

    link.click();

  } catch (err) {

    console.log(
      "DOWNLOAD ERROR:",
      err
    );

    alert(
      "Failed to download certificate"
    );

  }

};
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

      alert("Certificate not found")

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

    setCertificate(doc)

  } catch (error) {

    console.log(
      "CERTIFICATE LOAD ERROR:",
      error
    )

    alert(
      "Failed to load certificate"
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
          onClick={() => window.print()}
          className="bg-green-600 text-white px-5 py-2 rounded"
        >
          Print
        </button>

        <button
          onClick={downloadCertificate}
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
            id="certificate"
            className="relative mx-auto"
            style={{
              width: "1470px",
              height: "1070px"
            }}
          >
            <img
              src="/beauty-certificate.jpeg"
              alt=""
              className="absolute inset-0 w-full h-full"
            />

{/* FRANCHISE LOGO */}
{certificate.logo && (
  <img
    src={certificate.logo}
    alt="Franchise Logo"
    className="absolute object-contain rounded-full"
    style={{
      top: "45px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "210px",
      height: "130px",
      zIndex: 10,
      
    }}
  />
)}
            {/* STUDENT NAME */}
            <div
              className="absolute"
              style={{
                top: '530px',
                left: '350px',
                width: '750px'
              }}
            >
              <h1 className="text-5xl text-center font-bold">
                {certificate.studentName}
              </h1>
            </div>

            {/* COURSE NAME */}
            <div
              className="absolute"
              style={{
                top: '635px',
                left: '300px',
                width: '850px'
              }}
            >
              <h2 className="text-2xl text-center font-bold">
                {certificate.courseName}
              </h2>
            </div>

            {/* INSTITUTE NAME */}
            <div
              className="absolute"
              style={{
                top: '697px',
                left: '300px',
                width: '850px',
                
              }}
            >
              <h2 className="text-3xl text-center text-red-600 font-bold">
                {certificate.instituteName}
              </h2>
            </div>

            {/* STUDENT PHOTO */}
            <img
              src={certificate.studentPhoto}
              alt=""
              className="absolute object-cover border"
              style={{
                top: '350px',
                right: '70px',
                width: '250px',
                height: '300px'
              }}
            />

            {/* STUDENT SIGNATURE */}
            <img
              src={certificate.studentSignature}
              alt=""
              className="absolute object-contain"
              style={{
                bottom: '310px',
                right: '127px',
                width: '150px',
                height: '50px'
              }}
            />

            {/* OWNER SIGNATURE */}
            <img
              src={certificate.ownerSignature}
              alt=""
              className="absolute object-contain"
              style={{
                bottom: '310px',
                left: '127px',
                width: '150px',
                height: '50px'
              }}
            />

            {/* OWNER PHOTO */}
            <img
              src={certificate.ownerPhoto}
              alt=""
              className="absolute object-cover border"
              style={{
                top: '350px',
                left: '70px',
                width: '250px',
                height: '300px'
              }}
            />

            {/* DATE OF COMPLETION */}
            <div
              className="absolute text-center"
              style={{
                bottom: '150px',
                left: '380px',
                width: '180px'
              }}
            >
              {certificate.dateOfCompletion}
            </div>

            {/* COURSE DURATION */}
            <div
              className="absolute text-center"
              style={{
                bottom: '150px',
                left: '640px',
                width: '180px'
              }}
            >
              {certificate.courseDuration}
            </div>

            {/* CERTIFICATE NUMBER */}
            <div
              className="absolute text-center"
              style={{
                bottom: '150px',
                right: '375px',
                width: '220px'
              }}
            >
              {certificate.certificateNo}
            </div>

            {/* QR CODE */}
            <img
              src={certificate.qrCode}
              alt=""
              className="absolute"
              style={{
                bottom: '80px',
                right: '130px',
                width: '120px',
                height: '120px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
