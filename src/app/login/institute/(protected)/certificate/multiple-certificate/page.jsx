"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import QRCode from "qrcode"; // ✅ ADDED
import { databases, ID } from "@/lib/appwrite";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";

const BUCKET_ID = "6986e8a4001925504f6b";



export default function PrintCertificate() {

  const [student, setStudent] = useState(null);
  const [certificateNo, setCertificateNo] = useState("");
  const [issueDate, setIssueDate] = useState("");
const [percentage, setPercentage] = useState(0);

  const printRef = useRef();
  useEffect(() => {

    const data = localStorage.getItem("certificateStudent");
    if (!data) return;

    const parsed = JSON.parse(data);

    console.log("STUDENT DATA:", parsed);
    console.log("DURATION VALUE:", parsed.duration);

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

    // ✅ DATE OF ISSUE
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    setIssueDate(today);

    // ✅🔥 GENERATE QR WITH LIVE VERIFY URL
    // ✅ SAVE FINAL CERT DATA FOR VERIFICATION
    localStorage.setItem(
      "certificateMeta",
      JSON.stringify({
        certificateNo: certNo,
        issueDate: today,
        duration: parsed.duration || parsed.courseDuration || ""
      })
    );

    console.log("FULL STUDENT DATA:", parsed);
    console.log("ID USED IN QR:", parsed.$id);

  }, []);

  useEffect(() => {
  const fetchMarks = async () => {
    try {
      const res = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "student_subject_results",
        [Query.equal("studentId", student?.studentId)]
      );

      if (res.documents.length > 0) {
        const total = res.documents.reduce(
          (sum, m) => sum + Number(m.total || 0),
          0
        );

        const percent = (
          total / (res.documents.length * 100)
        ).toFixed(2);

        setPercentage(percent);
      }

    } catch (err) {
      console.log("PERCENT ERROR:", err);
    }
  };

  if (student?.studentId) fetchMarks();
}, [student]);



  if (!student) return <p className="p-10">Loading certificate...</p>;

  // ✅ PHOTO
  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  // ✅ SIGNATURE
  const signatureUrl = student.signatureId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  const franchiseSign = student.franchiseSignature || null;

  // ✅ COURSE DURATION FUNCTION (UNCHANGED)
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


  const toBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const handleDownload = async () => {
    try {
      const node = printRef.current;


      // ✅ convert images before capture
      const images = node.querySelectorAll("img");

      for (let img of images) {
        const src = img.src;

        if (!src.startsWith("data:")) {
          try {
            const base64 = await toBase64(src);
            img.src = base64;
          } catch (err) {
            console.log("IMAGE CONVERT ERROR:", err);
          }
        }
      }

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,

        // 🔥 FIX CUT ISSUE
        width: node.scrollWidth,
        height: node.scrollHeight,

        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          overflow: "visible"
        }
      });
      const link = document.createElement("a");
      link.download = `${student.studentName}_certificate.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.log("DOWNLOAD ERROR:", err);
    }
  };


  const printPage = () => window.print();

  const formatCourseName = (text) => {
    if (!text) return "";

    const words = text.split(" ");
    const lines = [];

    for (let i = 0; i < words.length; i += 7) {
      lines.push(words.slice(i, i + 7).join(" "));
    }

    return lines;
  };
  const courseLines = formatCourseName(student.course);

  return (

    <div className="p-10">

      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6 ml-4"
      >
        Download Certificate
      </button>


      <div
        ref={printRef}
        style={{
          width: "900px",
          height: "1200px",
          position: "relative",
          overflow: "visible"
        }}
      >

        {/* TEMPLATE */}
        <img src="/beautycerti.png" className="absolute w-full h-full" />

        {/* LOGO */}
         <div className="absolute top-[20px] left-[410px] w-[120px] h-[120px] overflow-hidden bg-white">
        {student.logo && (
          <img
            src={student.logo} 
             className="w-full h-full object-cover"
          />
        )}
</div>
        {/* PHOTO */}
        <div className="absolute top-[360px] left-[380px] w-[160px] h-[160px] overflow-hidden bg-white">
          {photoUrl && (
            <img src={photoUrl} className="w-full h-full object-cover" />
          )}
        </div>

        {/* NAME */}
        <div className="absolute top-[660px] left-[10px] w-full text-center text-3xl font-bold">
          {student.studentName}
        </div>

       {/* COURSE */}
        <div
          className="absolute top-[827px] left-[270px] font-semibold w-[500px] leading-tight"
        >
          <div className="flex gap-2">
            <span className="whitespace-nowrap">Course Name:</span>
            <span>{courseLines[0]}</span>
          </div>

          {courseLines.slice(1).map((line, index) => (
            <div key={index} className="ml-[120px]">
              {line}
            </div>
          ))}
        </div>

        {/* COURSE DURATION */}
        <div
          className="absolute left-[270px] font-semibold"
          style={{
            top: 827 + (courseLines.length * 20) + 20
          }}
        >
          Course Duration: {getCourseDuration(
            student.duration || student.courseDuration || "1 year"
          )}
        </div>

        {/* GRADE */}
        <div className="absolute top-[770px] left-[535px] font-bold text-2xl">
          {student.grade}
        </div>

        {/* MARKS */}
        <div className="absolute top-[770px] left-[660px] font-bold text-2xl">
          {percentage}%
        </div>

        {/* ✅ QR (NOW WORKING WITH WEBSITE) */}
        {student.qrCode && (
          <img
            src={student.qrCode}
            className="absolute top-[300px] right-[100px] w-[120px]"
          />
        )}

        {/* CERT NO + DATE */}
        <div className="absolute bottom-[110px] left-[340px] font-semibold">

          <div>Certificate No : {certificateNo}</div>

          <div className="mt-1">
            Date Of Issue : {issueDate}
          </div>

        </div>

        {/* INSTITUTE */}
        <div className="absolute bottom-[440px] left-[20px] w-full text-center text-3xl font-bold text-red-700">

          ATC: {student.instituteName} | {[student.city].filter(Boolean).join(", ")}
        </div>

        {/* SIGNATURE */}
        <div className="absolute top-[535px] left-[390px] w-[140px] h-[60px] bg-white flex items-center justify-center overflow-hidden">
          {signatureUrl && (
            <img
              src={signatureUrl}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* FRANCHISE SIGN */}
        {franchiseSign && (
          <img
            src={franchiseSign}
            className="absolute bottom-[100px] left-[100px] w-[100px]"
          />
        )}

        {/* OWNER NAME */}
        {student.ownerName && (
          <div className="absolute bottom-[60px] left-[80px] text-sm text-center">

            <div className="font-semibold">
              {student.ownerName}
            </div>

            <div className="text-xs text-gray-600">
              Controller Of Examination
            </div>

          </div>
        )}

      </div>

    </div>
  );
}