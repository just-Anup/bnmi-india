"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");

  // ✅ LOAD STUDENT
  useEffect(() => {
    const data = localStorage.getItem("marksheetStudent");

    if (data) {
      const parsed = JSON.parse(data);
      setStudent(parsed);
      fetchMarks(parsed.studentId);
    }
  }, []);

  // ✅ QR GENERATION
// ✅ QR GENERATION (FIXED)
useEffect(() => {
  const generateQR = async () => {
    try {

      if (!student?.studentId) return;

      // ✅ USE STUDENT ID (CORRECT)
      const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

      console.log("MARKSHEET QR URL:", verifyUrl);

      const qr = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1
      });

      setQrCode(qr);

    } catch (err) {
      console.log("QR ERROR:", err);
    }
  };

  if (student) generateQR();

}, [student]);
  // ✅ AUTO PRINT
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ FETCH MARKS
  const fetchMarks = async (studentId) => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [Query.equal("studentId", studentId)]
      );

      if (res.documents.length > 0) {
        const resultDoc = res.documents[0];

        let parsedMarks = [];

        if (resultDoc.marksArray) {
          parsedMarks = JSON.parse(resultDoc.marksArray);
        }

        setMarksArray(parsedMarks);
      }
    } catch (err) {
      console.log("MARK FETCH ERROR:", err);

      if (student?.marksArray) {
        setMarksArray(student.marksArray);
      }
    }
  };

  if (!student) return <div className="p-10">Loading...</div>;

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  const franchiseSign = student.franchiseSignature || null;

  return (
    <div className="p-10 bg-white">

      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print / Download PDF
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto">

        <img src="/beautymark.png" className="absolute w-full h-full" />

        {/* LOGO */}
        {student?.logo && (
          <img
            src={student.logo}
            className="absolute top-[10px] left-[380px] w-[160px]"
          />
        )}

        {/* LEFT */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px]">{student.course}</div>
        <div className="absolute top-[450px] left-[330px]">{student.instituteName}</div>

        {/* RIGHT */}
        <div className="absolute top-[325px] left-[680px]">1 Year</div>
        <div className="absolute top-[348px] left-[680px]">{student.marksheetNo}</div>
        <div className="absolute top-[369px] left-[680px]">{student.dob}</div>
        <div className="absolute top-[390px] left-[680px]">{student.coursePeriod}</div>

        {/* SUBJECTS */}
        {marksArray.map((m, index) => (
          <div key={index}>
            <div style={{ top: 570 + index * 30, left: 150, position: "absolute" }}>
             {m.subject
  ?.split(/\d+\.\s/) // split by "1. 2. 3."
  .filter(Boolean)
  .map((sub, i) => (
    <div key={i}>{i + 1}. {sub.trim()}</div>
  ))
}
            </div>
            <div style={{ top: 570 + index * 30, left: 620, position: "absolute" }}>
              {m.objective}
            </div>
            <div style={{ top: 570 + index * 30, left: 690, position: "absolute" }}>
              {m.practical}
            </div>
          </div>
        ))}

        {/* TOTAL */}
        <div className="absolute bottom-[290px] left-[755px] font-bold">
          {total}.00%
        </div>

        {/* GRADE */}
        <div className="absolute top-[572px] left-[780px] font-bold">
          {student.grade}
        </div>

        {/* ✅ QR */}
        {qrCode && (
          <img
            src={qrCode}
            className="absolute top-[240px] right-[50px] w-[110px] bg-white p-1"
          />
        )}

      </div>
    </div>
  );
}