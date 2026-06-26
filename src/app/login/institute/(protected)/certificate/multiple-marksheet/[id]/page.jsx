"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";

import jsPDF from "jspdf";

import QRCode from "qrcode";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheetMultiple() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [courseData, setCourseData] = useState(null);
const printRef = useRef();

  
  // ===============================
  // ✅ FETCH MULTIPLE SUBJECT DATA
  // ===============================
  const fetchMarks = async (studentId) => {
    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [Query.equal("studentId", studentId)]
      );

      const docs = [...res.documents].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      const finalMarks = docs.map((m) => ({
        subject: m.subject,
        objective: Number(m.objective || 0),
        practical: Number(m.practical || 0),
        total: Number(m.total || 0),
      }));

      setMarksArray(finalMarks);

    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };


  useEffect(() => {
    const data = localStorage.getItem("marksheetStudent");

    if (data) {
      const parsed = JSON.parse(data);
      setStudent(parsed);
      fetchMarks(parsed.studentId);
    }
  }, []);

  

useEffect(() => {
  const fetchCourse = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_multiple_courses",
        [Query.equal("courseName", student?.course)]
      );

      if (res.documents.length > 0) {
        setCourseData(res.documents[0]);
      }

    } catch (err) {
      console.log("COURSE FETCH ERROR:", err);
    }
  };

  if (student?.course) fetchCourse();
}, [student]);
useEffect(() => {
  const generateQR = async () => {
    try {
      if (!student?.studentId) return;

      const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

      const qr = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
      });

      setQrCode(qr);

    } catch (err) {
      console.log("QR ERROR:", err);
    }
  };

  if (student) generateQR();
}, [student]);

 const handleDownload = async () => {
    try {
      const node = printRef.current;
const rect = node.getBoundingClientRect();

      const dataUrl = await htmlToImage.toPng(node, {
  quality: 1,
  pixelRatio: 3,
  cacheBust: true,

  // 🔥 THIS FIXES HALF IMAGE
  width: rect.width,
  height: rect.height,

  style: {
    width: rect.width + "px",
    height: rect.height + "px",
    transform: "scale(1)",
    transformOrigin: "top left",
    overflow: "visible"
  }
});

      const link = document.createElement("a");
      link.download = `${student.studentName}_marksheet.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.log("DOWNLOAD ERROR:", err);
    }
  };
  

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  const toBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};



  // ===============================
  // ✅ TOTAL + GRADE
  // ===============================
 
  const percentage = marksArray.length
  ? ((total / (marksArray.length * 100)) * 100).toFixed(2)
  : 0;


  useEffect(() => {
  const savePercentage = async () => {
    try {
      if (!student?.studentId || marksArray.length === 0) return;

      // 🔥 get all subject docs
      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [Query.equal("studentId", student.studentId)]
      );

      if (res.documents.length === 0) return;

      const percent = (
        marksArray.reduce((sum, m) => sum + m.total, 0) /
        (marksArray.length * 100)
      ).toFixed(2);

  // ✅ UPDATE ALL SUBJECTS
      await Promise.all(
        res.documents.map((doc) =>
          databases.updateDocument(
            DATABASE_ID,
            "student_subject_results",
            doc.$id,
            { percentage: percent }
          )
        )
      );

    } catch (err) {
      console.log("SAVE PERCENT ERROR:", err);
    }
  };

  savePercentage();
}, [marksArray]);
  

 const getGrade = () => {
  const percent = percentage;

  if (percent >= 85) return "A+";
  if (percent >= 70) return "A";
  if (percent >= 55) return "B";
  if (percent >= 40) return "C";
  if (percent >= 35) return "D";
  if (percent >= 33) return "F";

  return "F";
};

const getCoursePeriod = (durationText) => {
  if (!durationText) return "N/A";

  const today = new Date();

  const start = new Date(today);
  const end = new Date(today);

  const text = durationText.toLowerCase();

  if (text.includes("month")) {
    const months = parseInt(text) || 1;
    end.setMonth(end.getMonth() + months);
  }

  if (text.includes("year")) {
    const years = parseInt(text) || 1;
    end.setFullYear(end.getFullYear() + years);
  }

  const format = (d) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return `${format(start)} To ${format(end)}`;
};

if (!student) return <div className="p-10">Loading...</div>;


const objectiveTotal = marksArray.reduce(
  (sum, m) => sum + Number(m.objective || 0),
  0
);

const practicalTotal = marksArray.reduce(
  (sum, m) => sum + Number(m.practical || 0),
  0
);

const objectiveOutOf = marksArray.length * 50;
const practicalOutOf = marksArray.length * 50;
const totalOutOf = marksArray.length * 100;

  return (
    <div className="p-10 bg-white">

 <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download Image
      </button>

  <div
  ref={printRef}
  style={{
    width: "900px",
    minHeight: "1200px",
    height: "auto",
    position: "relative",
    overflow: "visible"
  }}
>
        {/* TEMPLATE */}
        <img src="/multiplemarksheet.png" className="absolute w-full h-full" />

        {/* LOGO */}
               {student.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={student.logo}
      className="w-full h-full object-cover rounded-full"
    />
  </div>

)}

  

        {/* ===============================
            LEFT SIDE
        =============================== */}
        <div className="absolute top-[310px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[330px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[352px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[374px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[395px] left-[330px] font-bold">{student.course}</div>
        <div className="absolute top-[417px] left-[330px] font-bold">{student.instituteName}</div>

        {/* ===============================
            RIGHT SIDE (FIXED)
        =============================== */}
    
{/* RIGHT */}
{/* <div className="absolute top-[315px] left-[680px] text-[13px]">
  {student.coursePeriod || student.duration || "1 Year"}
</div> */}

<div className="absolute top-[334px] left-[680px]">
  {student.marksheetNo}
</div>

<div className="absolute top-[355px] left-[680px]">
  {student.dob}
</div>

<div className="absolute top-[378px] left-[680px] ">
  {student.coursePeriod || student.duration || "1 Year"}
</div>


{qrCode && (
  <img
    src={qrCode}
    className="absolute  top-[240px] right-[80px] w-[90px] bg-white p-1"
  />
)}
      {/* ===============================
    SUBJECT TABLE
=============================== */}

<div
  style={{
    position: "absolute",
    top: 540,
    left: 150,
    width: "650px",
    display: "flex",
    flexDirection: "column",
   gap: "7px",
  }}
>
  {marksArray.map((m, index) => (
    <div
      key={index}
      style={{
        display: "grid",
      gridTemplateColumns: "280px 60px 60px 60px 60px 70px 70px",
        alignItems: "start",
      minHeight: "20px",
      }}
    >
      {/* SUBJECT */}
      <div
        style={{
        fontSize: "14px",
lineHeight: "15px",
          wordBreak: "break-word",
          whiteSpace: "normal",
          paddingRight: "10px",
        }}
      >
        {index + 1}) {m.subject}
      </div>

      {/* OBJECTIVE OUT OF */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        50
      </div>

      {/* OBJECTIVE SCORE */}
      <div
        style={{
          textAlign: "center",
        }}
      >
        {m.objective}
      </div>

      {/* PRACTICAL OUT OF */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        50
      </div>

      {/* PRACTICAL SCORE */}
      <div
        style={{
          textAlign: "center",
        }}
      >
        {m.practical}
      </div>

      {/* TOTAL OUT OF */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        100
      </div>

      {/* TOTAL SCORE */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {Number(m.objective) + Number(m.practical)}
      </div>
    </div>
  ))}
</div>
        {/* ===============================
            TOTAL
        =============================== */}
  <div
  style={{
    position: "absolute",
    top: 867, // Adjust to match your TOTAL box
    left: 150,
    width: "650px",
    display: "grid",
    gridTemplateColumns:
      "280px 60px 60px 60px 60px 70px 70px",
    fontWeight: "bold",
    fontSize: "18px",
  }}
>
  <div></div>

  <div style={{ textAlign: "center" }}>
    {objectiveOutOf}
  </div>

  <div style={{ textAlign: "center" }}>
    {objectiveTotal}
  </div>

  <div style={{ textAlign: "center" }}>
    {practicalOutOf}
  </div>

  <div style={{ textAlign: "center" }}>
    {practicalTotal}
  </div>

  <div style={{ textAlign: "center" }}>
    {totalOutOf}
  </div>

  <div style={{ textAlign: "center" }}>
    {total}
  </div>
</div> 



        {/* PERCENTAGE */}
<div className="absolute bottom-[260px] left-[350px] font-bold">
  Percentage: {percentage}%
</div>

{/* GRADE */}
<div className="absolute bottom-[260px] left-[250px] font-bold">
  Grade: {getGrade()}
</div>
<div className="absolute bottom-[260px] left-[600px] font-bold">
  Total:  {total}/{totalOutOf}
</div>
        {/* ===============================
            SIGNATURE
        =============================== */}
        {student?.franchiseSignature && (

<img
  id="sign-img"
  src={student.franchiseSignature + "&mode=admin"} 
  crossOrigin="anonymous"
  className="absolute bottom-[95px] left-[100px] w-[100px]"
/>
        )}

        {/* OWNER NAME */}
        {student?.ownerName && (
          <div className="absolute bottom-[60px] left-[100px] text-sm">
            <div className="font-semibold">{student.ownerName}</div>
            <div className="text-xs text-gray-600 font font-bold">
              Controller Of Examination
            </div>
          </div>
        )}

      </div>
    </div>
  );
}