"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { databases, ID } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintCertificate() {

  const [student, setStudent] = useState(null);
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
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      certNo = `BNMI-${year}-${random}`;
      localStorage.setItem("certificateNo", certNo);
    }

    setCertificateNo(certNo);

    // ✅ ISSUE DATE
    const today = new Date();
    setIssueDate(today.toISOString());

    // ✅ COURSE DURATION FUNCTION
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

    const saveCertificate = async () => {
      try {

        const verifyId = parsed.$id;

        const duration = getCourseDuration(parsed.duration || "1 year");

        // 🔥 SAVE TO APPWRITE
        await databases.createDocument(
          DATABASE_ID,
          "certificates",
          ID.unique(),
          {
            studentId: verifyId,
            certificateNo: certNo,
            duration: duration,
            issueDate: today.toISOString(),
            marks: parsed.marks,
            grade: parsed.grade
          }
        );

        // ✅ GENERATE QR
        const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/beauty-verification/${verifyId}`;

        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 300,
          margin: 1
        });

        setStudent(prev => ({
          ...prev,
          qrCode: qr
        }));

      } catch (err) {
        console.error("SAVE ERROR:", err);
      }
    };

    saveCertificate();

  }, []);

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

        <img src="/beautycerti.png" className="absolute w-full h-full" />

        {/* PHOTO */}
        {photoUrl && (
          <img src={photoUrl} className="absolute top-[360px] left-[380px] w-[160px] h-[160px]" />
        )}

        {/* NAME */}
        <div className="absolute top-[660px] left-[320px] text-3xl font-bold">
          {student.studentName}
        </div>

        {/* COURSE */}
        <div className="absolute top-[837px] left-[300px]">
          Course Name: {student.course}
        </div>

        {/* QR */}
        {student.qrCode && (
          <img
            src={student.qrCode}
            className="absolute top-[300px] right-[100px] w-[120px]"
          />
        )}

        {/* CERT INFO */}
        <div className="absolute bottom-[110px] left-[340px]">
          <div>Certificate No : {certificateNo}</div>
          <div>Date Of Issue : {new Date(issueDate).toLocaleDateString("en-GB")}</div>
        </div>

        {/* SIGN */}
        {signatureUrl && (
          <img src={signatureUrl} className="absolute top-[535px] left-[390px] w-[140px]" />
        )}

      </div>
    </div>
  );
}