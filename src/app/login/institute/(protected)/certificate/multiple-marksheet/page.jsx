"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheetMultiple() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);

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

  if (!student) return <div className="p-10">Loading...</div>;

  // ===============================
  // ✅ TOTAL + GRADE
  // ===============================
  const total = marksArray.reduce((sum, m) => sum + m.total, 0);
  const percentage = marksArray.length
  ? ((total / (marksArray.length * 100)) * 100).toFixed(2)
  : 0;

  

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

  return (
    <div className="p-10 bg-white">

      {/* PRINT BUTTON */}
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print / Download PDF
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto print-container">

        {/* TEMPLATE */}
        <img src="/beautymark.png" className="absolute w-full h-full" />

        {/* LOGO */}
        {student?.logo && (
          <img
            src={student.logo}
            className="absolute top-[10px] left-[380px] w-[160px] h-[160px] object-contain"
          />
        )}

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
  {student.coursePeriod || "N/A"}
</div>

        <div className="absolute top-[348px] left-[680px]">
          {student.marksheetNo || ""}
        </div>

        <div className="absolute top-[369px] left-[680px]">
          {student.dob || "N/A"}
        </div>

           <div className="absolute top-[325px] left-[680px]">
  {student.courseDuration || "N/A"}
</div>


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

              {/* OBJECTIVE */}
              <div style={{ position: "absolute", top: topPosition, left: 620 }}>
                {m.objective}
              </div>

              {/* PRACTICAL */}
              <div style={{ position: "absolute", top: topPosition, left: 690 }}>
                {m.practical}
              </div>

              {/* TOTAL */}
              <div style={{ position: "absolute", top: topPosition, left: 760 }}>
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
<div className="absolute bottom-[260px] left-[750px] font-bold">
  {percentage}%
</div>

{/* GRADE */}
<div className="absolute top-[572px] left-[780px] font-bold">
  {getGrade()}
</div>
        {/* ===============================
            SIGNATURE
        =============================== */}
        {student?.franchiseSignature && (
          <img
            src={student.franchiseSignature}
            className="absolute bottom-[60px] left-[130px] w-[100px]"
          />
        )}

        {/* OWNER NAME */}
        {student?.ownerName && (
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