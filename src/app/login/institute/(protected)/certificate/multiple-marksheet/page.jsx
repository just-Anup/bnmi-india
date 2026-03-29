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
    setTimeout(() => window.print(), 500);
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

      // ✅ UPDATE ONLY FIRST DOCUMENT (IMPORTANT)
      await databases.updateDocument(
        DATABASE_ID,
        "student_subject_results",
        res.documents[0].$id,
        {
          percentage: percent
        }
      );

    } catch (err) {
      console.log("SAVE PERCENT ERROR:", err);
    }
  };

  savePercentage();
}, [marksArray]);
  

 const getGrade = () => {
  const percent = percentage;

  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B+";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";

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

  return (
    <div className="p-10 bg-white">

 <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download Image
      </button>

    <div ref={printRef}  style={{
    width: "900px",
    height: "1200px",
    position: "relative",
    overflow: "visible"
  }}
>

        {/* TEMPLATE */}
        <img src="/marksheet.png" className="absolute w-full h-full" />

        {/* LOGO */}
        {/* {student?.logo && (
          <img
  id="logo-img"
  src={student.logo + "&mode=admin"}  // 🔥 ADD THIS
  crossOrigin="anonymous"
  className="absolute top-[10px] left-[400px] w-[102px] h-[120px]"
/>

        )} */}

        {/* ===============================
            LEFT SIDE
        =============================== */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px]">{student.course}</div>
        <div className="absolute top-[450px] left-[330px]">{student.instituteName}</div>

        {/* ===============================
            RIGHT SIDE (FIXED)
        =============================== */}
    
<div className="absolute top-[390px] left-[680px]">
  {getCoursePeriod(courseData?.duration)}
</div>
        <div className="absolute top-[348px] left-[680px]">
          {student.marksheetNo || ""}
        </div>

        <div className="absolute top-[369px] left-[680px]">
          {student.dob || "N/A"}
        </div>

  <div className="absolute top-[325px] left-[680px]">
  {courseData?.duration || "N/A"}
</div>

{qrCode && (
  <img
    src={qrCode}
    className="absolute top-[240px] right-[50px] w-[110px] bg-white p-1"
  />
)}
        {/* ===============================
            SUBJECT TABLE (NO OVERFLOW FIXED)
        =============================== */}
        {marksArray.map((m, index) => {

          const baseTop = 560;

          const topPosition =
            baseTop +
            marksArray
              .slice(0, index)
              .reduce((acc, item) => {
                const lines = Math.ceil(item.subject.length / 40);
                return acc + lines * 10 + 15;
              }, 0);

          return (
            <div key={index}>

              {/* SUBJECT */}
              <div
                style={{
                  position: "absolute",
                  top: topPosition,
                  left: 150,
                  width: "420px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  lineHeight: "18px",
                }}
              >
                {index + 1}) {m.subject}
              </div>
              {/* MAX MARKS */}
<div style={{ position: "absolute", top: topPosition, left: 525, textAlign: "center" }}>
  100
</div>

              {/* OBJECTIVE */}
              <div style={{ position: "absolute", top: topPosition, left: 590, textAlign: "center" }}>
                {m.objective}
              </div>

              {/* PRACTICAL */}
              <div style={{ position: "absolute", top: topPosition, left: 660, textAlign: "center" }}>
                {m.practical}
              </div>

              {/* TOTAL */}
              <div style={{ position: "absolute", top: topPosition, left: 720, textAlign: "center" }}>
                {m.total}
              </div>

            </div>
          );
        })}

        {/* ===============================
            TOTAL
        =============================== */}
        <div className="absolute bottom-[290px] left-[775px] font-bold">
          {total}
        </div>



        {/* PERCENTAGE */}
<div className="absolute bottom-[289px] left-[350px] font-bold">
  Percentage: {percentage}%
</div>

{/* GRADE */}
<div className="absolute top-[560px] left-[780px] font-bold">
  {getGrade()}
</div>
        {/* ===============================
            SIGNATURE
        =============================== */}
        {student?.franchiseSignature && (

<img
  id="sign-img"
  src={student.franchiseSignature + "&mode=admin"} // 🔥 ADD THIS
  crossOrigin="anonymous"
  className="absolute bottom-[90px] left-[130px] w-[100px]"
/>
        )}

        {/* OWNER NAME */}
        {student?.ownerName && (
          <div className="absolute bottom-[60px] left-[100px] text-sm text-center">
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