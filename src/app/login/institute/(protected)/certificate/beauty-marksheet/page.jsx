"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {
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

  // ✅ AUTO PRINT
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // ✅ FETCH MARKS (FIXED)
  const fetchMarks = async (studentId) => {
    try {
      const resultRes = await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [Query.equal("studentId", studentId)]
      );

      let subjectList = [];

      if (resultRes.documents.length > 0) {
        subjectList =
          resultRes.documents[0].subjects
            ?.split(",")
            .map((s) => s.trim()) || [];
      }

      const marksRes = await databases.listDocuments(
        DATABASE_ID,
        "exam_subject_marks",
        [Query.equal("studentId", studentId)]
      );

      const marksDocs = marksRes.documents || [];

      // ✅ FIXED MAPPING (NO INDEX ISSUE)
      const finalMarks = subjectList.map((sub) => {
        const mark = marksDocs.find(
          (m) => m.subject?.trim() === sub
        );

        return {
          subject: sub,
          objective: Number(mark?.theory || 0),
          practical: Number(mark?.practical || 0),
          total:
            Number(mark?.theory || 0) +
            Number(mark?.practical || 0),
        };
      });

      setMarksArray(finalMarks);
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
      {/* PRINT STYLE */}
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            button {
              display: none !important;
            }

            .print-container {
              position: relative !important;
              width: 100% !important;
              height: auto !important;
              transform: scale(1);
              transform-origin: top left;
            }

            img {
              display: block !important;
            }
          }
        `}
      </style>

      {/* BUTTON */}
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print / Download PDF
      </button>

      {/* MARKSHEET */}
      <div className="relative w-[900px] h-[1200px] mx-auto print-container">
        {/* TEMPLATE */}
        <img
          src="/beautymark.png"
          className="absolute w-full h-full"
        />

        {/* LOGO */}
        {student?.logo && (
          <img
            src={student.logo}
            className="absolute top-[10px] left-[380px] w-[160px] h-[160px] object-contain"
          />
        )}

        {/* LEFT SIDE */}
        <div className="absolute top-[325px] left-[330px]">
          {student.studentName}
        </div>
        <div className="absolute top-[346px] left-[330px]">
          {student.fatherName}
        </div>
        <div className="absolute top-[367px] left-[330px]">
          {student.surname}
        </div>
        <div className="absolute top-[388px] left-[330px]">
          {student.motherName}
        </div>
        <div className="absolute top-[410px] left-[330px]">
          {student.course}
        </div>
        <div className="absolute top-[450px] left-[330px]">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}
        <div className="absolute top-[325px] left-[680px]">
          1 Year
        </div>
        <div className="absolute top-[348px] left-[680px]">
          {student.marksheetNo}
        </div>
        <div className="absolute top-[369px] left-[680px]">
          {student.dob}
        </div>
        <div className="absolute top-[390px] left-[680px]">
          {student.coursePeriod}
        </div>

        {/* SUBJECT + MARKS (FIXED) */}
        {marksArray.map((m, index) => (
          <div key={index}>
            <div
              style={{
                top: 570 + index * 30,
                left: 150,
                position: "absolute",
                width: 420,
              }}
            >
              {m.subject}
            </div>

            <div
              className="absolute font-bold"
              style={{
                top: 570 + index * 30,
                left: 620,
              }}
            >
              {m.objective}
            </div>

            <div
              className="absolute font-bold"
              style={{
                top: 570 + index * 30,
                left: 690,
              }}
            >
              {m.practical}
            </div>
          </div>
        ))}

        {/* TOTAL */}
        <div className="absolute bottom-[290px] left-[775px] font-bold">
          {total}
        </div>

        {/* GRADE */}
        <div className="absolute top-[572px] left-[780px] font-bold">
          {student.grade}
        </div>

        {/* SIGNATURE */}
        {franchiseSign && (
          <img
            src={franchiseSign}
            className="absolute bottom-[60px] left-[130px] w-[100px]"
          />
        )}

        {/* OWNER */}
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