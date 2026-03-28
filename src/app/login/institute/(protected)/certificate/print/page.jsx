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
  const [certificateNo, setCertificateNo] = useState("");
  const [issueDate, setIssueDate] = useState("");

  useEffect(() => {

    const data = localStorage.getItem("certificateStudent");
    if (!data) return;

    const parsed = JSON.parse(data);
    setStudent(parsed);

    // ✅ CERTIFICATE NUMBER
    let certNo = localStorage.getItem("certificateNo");

    if (!certNo) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const numbers = Math.floor(10000 + Math.random() * 90000);
      certNo = `${random}${numbers}`;
      localStorage.setItem("certificateNo", certNo);
    }

    setCertificateNo(certNo);

    // ✅ ISSUE DATE
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    setIssueDate(today);

    // ✅ LOAD FRANCHISE NAME
    if (parsed.createdById) {
      loadFranchise(parsed.createdById);
    } else if (parsed.instituteName) {
      setFranchiseName(parsed.instituteName);
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
      console.log(err);
    }
  };

  const getCourseDuration = (durationText) => {

  if (!durationText) return "N/A";

  const today = new Date();

  const start = new Date(today);
  start.setDate(start.getDate() + 1);

  const end = new Date(start);

  const text = durationText.toLowerCase();

  if (text.includes("year")) {
    const years = parseInt(text) || 1;
    end.setFullYear(end.getFullYear() + years);
  }

  if (text.includes("month")) {
    const months = parseInt(text) || 1;
    end.setMonth(end.getMonth() + months);
  }

  end.setDate(end.getDate() - 1);

  const format = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return `${format(start)} To ${format(end)}`;
};

  if (!student) return <p className="p-10">Loading certificate...</p>;

  // ✅ IMAGE URLS
  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  const signatureUrl = student.signatureId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

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
          src="/certi.png"
          className="absolute w-full h-full"
        />

        {/* LOGO */}
        {student.logo && (
          <img
            src={student.logo}
            className="absolute top-[40px] left-[370px] w-[180px]"
          />
        )}

        {/* PHOTO */}
        {photoUrl && (
          <img
            src={photoUrl}
            className="absolute top-[440px] left-[410px] w-[120px] h-[120px] object-cover"
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
        <div className="absolute bottom-[455px] left-0 w-full text-center text-red-700">
          <span className="text-3xl font-bold px-4">
         ATC: {franchiseName} | {[ student.city].filter(Boolean).join(", ")}
           </span>
        </div>
       
  
  

<div className="absolute top-[837px] left-[300px] font-semibold">
  Course: {student.course}
</div>

<div className="absolute top-[857px] left-[300px]  font-semibold">
  Duration: {getCourseDuration(
    student.duration || student.courseDuration || "1 year"
  )}
</div>
        {/* QR CODE */}
        {student.qrCode && (
          <img
            src={student.qrCode}
            className="absolute top-[300px] right-[100px] w-[120px]"
          />
        )}

        {/* CERTIFICATE NO + DATE */}
        <div className="absolute bottom-[110px] left-[300px] font-semibold">
          <div>Certificate No : {certificateNo}</div>
          <div>Date Of Issue : {issueDate}</div>
        </div>

        {/* STUDENT SIGNATURE */}
        {signatureUrl && (
          <img
            src={signatureUrl}
            className="absolute top-[535px] left-[410px] w-[120px]"
          />
        )}

        {/* FRANCHISE SIGNATURE */}
        {franchiseSign && (
          <img
            src={franchiseSign}
            className="absolute bottom-[100px] left-[100px] w-[100px]"
          />
        )}

        {/* OWNER NAME */}
        {student.ownerName && (
          <div className="absolute bottom-[60px] left-[100px] text-sm text-center">
            <div className="font-semibold">{student.ownerName}</div>
            <div className="text-xs text-gray-600">
              Controller Of Examination
            </div>
          </div>
        )}

      </div>

    </div>
  );
}