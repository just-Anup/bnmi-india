"use client";

import { useEffect, useState, useRef } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheetSemester() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
const [courseData, setCourseData] = useState(null);
  const printRef = useRef();

  // ===============================
  // ✅ LOAD STUDENT
  // ===============================
  useEffect(() => {
    const data = localStorage.getItem("marksheetStudent");

    if (data) {
      const parsed = JSON.parse(data);
      setStudent(parsed);
      fetchMarks(parsed.studentId, parsed.semesterNumber);
    }
  }, []);

  useEffect(() => {
  const generateQR = async () => {
    if (!student?.studentId) return;

    const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${student.studentId}?sem=${student.semesterNumber || 0}`;

    const qr = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 1
    });

    setQrCode(qr);
  };

  if (student) generateQR();
}, [student]);
  useEffect(() => {
  const fetchCourse = async () => {
    try {
      if (!student?.courseCode) return;

      const res = await databases.listDocuments(
        DATABASE_ID,
        "semester_courses",
        [Query.equal("courseCode", student.courseCode)]
      );

      if (res.documents.length > 0) {
        setCourseData(res.documents[0]);
      }

    } catch (err) {
      console.log("COURSE ERROR:", err);
    }
  };

  if (student) fetchCourse();
}, [student]);

  // ===============================
  // ✅ FETCH SEMESTER RESULTS
  // ===============================
  const fetchMarks = async (studentId, semesterNumber) => {
    try {

    const res = await databases.listDocuments(
  DATABASE_ID,
  "exam_results",
  [
    Query.equal("studentId", studentId),
    Query.equal("semesterNumber", Number(semesterNumber))
  ]
);

     

   if (!res.documents.length) return;

const doc = res.documents[0];

const subjects = JSON.parse(doc.marksArray || "[]");

const finalMarks = subjects.map((s) => ({
  subject: s.subject,
  objective: Number(s.objective || 0),
  practical: Number(s.practical || 0),
  total: Number(s.total || 0),
  semester: doc.semesterNumber
}));

setMarksArray(finalMarks);

      setMarksArray(finalMarks);

    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };

  // ===============================
  // ✅ QR
  // ===============================
 
  // ===============================
  // ✅ AUTO PRINT
  // ===============================
  useEffect(() => {
    setTimeout(() => window.print(), 500);
  }, []);

  // ===============================
  // ✅ DOWNLOAD
  // ===============================
  const handleDownload = async () => {
    try {
      const node = printRef.current;
      const rect = node.getBoundingClientRect();

      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: 3,
        width: rect.width,
        height: rect.height
      });

      const link = document.createElement("a");
      link.download = `${student.studentName}_marksheet.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.log(err);
    }
  };

  if (!student) return <div>Loading...</div>;

  // ===============================
  // ✅ CALCULATIONS
  // ===============================
  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  const percentage = marksArray.length
    ? ((total / (marksArray.length * 100)) * 100).toFixed(2)
    : 0;

  const getGrade = () => {
    if (percentage >= 85) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 55) return "B";
    if (percentage >= 40) return "C";
    return "F";
  };

  return (
    <div className="p-10 bg-white">

      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download Image
      </button>

      <div ref={printRef} style={{
        width: "900px",
        height: "1200px",
        position: "relative"
      }}>

        {/* TEMPLATE */}
        <img src="/semimark.png" className="absolute w-full h-full" />
        {student?.logo && (
  <img
    src={student.logo}
    className="absolute top-[20px] left-[380px] w-[120px]"
  />
)}

        {/* LEFT SIDE */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px]">{student.course}</div>
        <div className="absolute top-[450px] left-[330px]">{student.instituteName}</div>

        {/* RIGHT SIDE */}
        <div className="absolute top-[325px] left-[680px]">{courseData?.duration || "N/A"}</div>
        <div className="absolute top-[348px] left-[680px]">{student.marksheetNo}</div>
        <div className="absolute top-[369px] left-[680px]">{student.dob}</div>

        {/* SUBJECT TABLE */}
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

              <div style={{
                position: "absolute",
                top: topPosition,
                left: 150,
                width: "420px"
              }}>
                {index + 1}) {m.subject} (Sem {m.semester})
              </div>

              <div style={{ position: "absolute", top: topPosition, left: 580 }}>
                100
              </div>

              <div style={{ position: "absolute", top: topPosition, left: 650 }}>
                {m.objective}
              </div>

              <div style={{ position: "absolute", top: topPosition, left: 710 }}>
                {m.practical}
              </div>

              <div style={{ position: "absolute", top: topPosition, left: 780 }}>
                {m.total}
              </div>

            </div>
          );
        })}

        {/* TOTAL */}
        <div className="absolute bottom-[290px] left-[775px] font-bold">
          {total}
        </div>

        {/* PERCENTAGE */}
        <div className="absolute bottom-[289px] left-[350px] font-bold">
          Percentage: {percentage}%
        </div>

        {/* GRADE */}
        <div className="absolute bottom-[289px] left-[250px] font-bold">
          Grade: {getGrade()}
        </div>

        {/* QR */}
        {qrCode && (
          <img
            src={qrCode}
            className="absolute top-[240px] right-[50px] w-[110px]"
          />
        )}

      </div>
    </div>
  );
}