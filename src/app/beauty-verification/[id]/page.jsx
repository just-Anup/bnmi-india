"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = "6986e8a4001925504f6b";

export default function VerifyCertificate() {

  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!id) return;

    const fetchAll = async () => {
      try {

        const student = await databases.getDocument(
          DATABASE_ID,
          "student_admissions",
          id
        );

        const certRes = await databases.listDocuments(
          DATABASE_ID,
          "certificates",
          [Query.equal("studentId", id)]
        );

        const certificate = certRes.documents[0];

        let franchise = null;

        if (student.franchiseEmail) {
          const res = await databases.listDocuments(
            DATABASE_ID,
            "franchise_approved",
            [Query.equal("email", student.franchiseEmail)]
          );

          franchise = res.documents[0];
        }

        setData({ student, certificate, franchise });

      } catch (err) {
        console.error(err);
        setData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

  }, [id]);

  if (loading) return <p className="p-10 text-center">Loading...</p>;

  if (data === false)
    return <p className="p-10 text-center text-red-600">Invalid Certificate</p>;

  const { student, certificate, franchise } = data;

  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  // ===============================
  // ✅ ADDED: GET CERT DATA FROM LOCALSTORAGE
  // ===============================
  let localCert = null;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("certificateStudent");
    if (stored) {
      localCert = JSON.parse(stored);
    }
  }

  // ===============================
  // ✅ UPDATED: LOGO WITH FALLBACK
  // ===============================
  const logoUrl = franchise?.logo || localCert?.logo || null;

  // ✅ GET CERT META FROM CERTIFICATE PAGE
let certMeta = null;

if (typeof window !== "undefined") {
  const storedMeta = localStorage.getItem("certificateMeta");
  if (storedMeta) {
    certMeta = JSON.parse(storedMeta);
  }
}

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5">

        {/* 🔥 TEXT FIX WRAPPER */}
        <div style={{ color: "#000", opacity: 1, WebkitTextFillColor: "#000" }}>

          <h1 className="text-lg font-bold text-center mb-4">
            ✅ Certificate Verified
          </h1>

          {logoUrl && (
            <img src={logoUrl} className="w-24 mx-auto mb-3" />
          )}

          {photoUrl && (
            <img src={photoUrl} className="w-28 h-28 mx-auto rounded-lg" />
          )}

          <h2 className="text-center font-bold mt-2">
            {student.studentName}
          </h2>

          <div className="mt-4">

            <p>
              Course : {student.courseName || student.course || "N/A"}
            </p>
<p>
  Certificate No : {certificate?.certificateNo || certMeta?.certificateNo || "N/A"}
</p>

            {/* ===============================
               ✅ UPDATED: DURATION FIX
            =============================== */}
           <p>
  Duration : {certificate?.duration || student.duration || certMeta?.duration || "N/A"}
</p>
            {/* ===============================
               ✅ UPDATED: ISSUE DATE FIX
            =============================== */}
        <p>
  Issue Date :{" "}
  {certificate?.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString("en-GB")
    : certMeta?.issueDate || "N/A"}
</p>

            <p>
              Marks : {certificate?.marks ? `${certificate.marks}%` : "N/A"}
            </p>

            <p>
              Grade : {certificate?.grade || "N/A"}
            </p>

          </div>

          <div className="mt-4 border-t pt-3">

            <p>Institute : {student.instituteName || "N/A"}</p>

            <p>Email : {franchise?.email || "N/A"}</p>

            <p>Contact : {franchise?.mobile || "N/A"}</p>

            <p>Address : {franchise?.address || "N/A"}</p>

          </div>

        </div>

      </div>

    </div>
  );
}