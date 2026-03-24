"use client";



export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintCertificate() {

  const [student, setStudent] = useState(null);
  const [franchiseName, setFranchiseName] = useState("");

  useEffect(() => {

    const data = localStorage.getItem("certificateStudent");

    if (!data) return;

    const parsed = JSON.parse(data);
    setStudent(parsed);

    if (parsed.createdById) {
      loadFranchise(parsed.createdById);
    } else if (parsed.franchiseName) {
      setFranchiseName(parsed.franchiseName);
    }

  }, []);

  const loadFranchise = async (userId) => {

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("userId", userId)]
      );

      if (res.documents.length > 0) {
        setFranchiseName(res.documents[0].instituteName);
      }

    } catch (err) {
      console.log("Franchise error:", err);
    }
  };

  if (!student) {
    return <p className="p-10">Loading certificate...</p>;
  }

  // ✅ PHOTO URL
  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

 const signatureUrl = student.signatureId
  ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
  : null;

// ✅ FRANCHISE SIGNATURE (already full URL)
const franchiseSign = student.franchiseSignature || null;

  const printPage = () => window.print();

  return (

    <div className="p-10">

      <button
        onClick={printPage}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print Certificate
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto">

        {/* TEMPLATE */}
        <img
          src="/beautycerti.png"
          className="absolute w-full h-full"
          alt="certificate"
        />

        {/* PHOTO */}
        {photoUrl && (
          <img
            src={photoUrl}
            className="absolute top-[410px] left-[410px] w-[120px] h-[120px] object-cover"
          />
        )}

        {/* NAME */}
        <div className="absolute top-[660px] left-[400px] text-3xl font-bold">
          {student.studentName}
        </div>

        {/* GRADE */}
        <div className="absolute top-[770px] left-[550px] text-xl font-bold">
          {student.grade}
        </div>

        {/* MARKS */}
        <div className="absolute top-[770px] left-[680px] text-xl font-bold">
          {student.marks}
        </div>

        {/* INSTITUTE */}
        <div className="absolute bottom-[455px] left-[380px] text-3xl font-bold text-red-700 ">
          {franchiseName || student.instituteName}
        </div>

       {signatureUrl && (
  <img
    src={signatureUrl}
    className="absolute top-[535px] left-[410px] w-[120px] object-contain"
  />
)}

{franchiseSign && (
  <img
    src={franchiseSign}
    className="absolute bottom-[100px] left-[100px] w-[100px] object-contain"
  />
)}

      </div>

    </div>

  );
}