"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintCertificate() {
  const [student, setStudent] = useState(null);
  const [franchiseName, setFranchiseName] = useState("");

  useEffect(() => {
    // ✅ Fixed: localStorage is only accessed inside useEffect (client-side only)
    if (typeof window === "undefined") return;

    const data = localStorage.getItem("certificateStudent");
    if (!data) return;

    const parsed = JSON.parse(data);
    setStudent(parsed);

    // ✅ Fixed: only call loadFranchise if createdById exists
    if (parsed.createdById) {
      loadFranchise(parsed.createdById);
    } else if (parsed.franchiseName) {
      // fallback to stored franchiseName if no createdById
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

  if (!student) return <p className="p-10">Loading certificate...</p>;

  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  const signatureUrl = student.signatureId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

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
        {/* Template */}
        <img src="/certi.png" className="absolute w-full h-full" alt="certificate template" />

        {/* Student Photo */}
        {photoUrl && (
          <img
            src={photoUrl}
            className="absolute top-[440px] left-[410px] w-[120px] h-[120px] object-cover"
            alt="student photo"
          />
        )}

        {/* Student Name */}
        <div className="absolute top-[660px] left-[400px] text-3xl font-bold">
          {student.studentName}
        </div>

        {/* Grade */}
        <div className="absolute top-[770px] left-[560px] text-xl">
          {student.grade}
        </div>

        {/* Marks */}
        <div className="absolute top-[770px] left-[680px] text-xl">
          {student.marks}
        </div>

        {/* ✅ Fixed: use franchiseName state instead of student.instituteName */}
        <div className="absolute bottom-[200px] left-[120px] text-lg font-semibold">
          {franchiseName || student.instituteName || student.franchiseName}
        </div>

        {/* Signature */}
        {signatureUrl && (
          <img
            src={signatureUrl}
            className="absolute bottom-[180px] right-[180px] w-[120px]"
            alt="signature"
          />
        )}
      </div>
    </div>
  );
}