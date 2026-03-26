"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Bold } from "lucide-react";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("marksheetStudent");

    if (data) {
      const parsed = JSON.parse(data);
      console.log("MARKSHEET DATA:", parsed);
      setStudent(parsed);

      // 🔥 FETCH MARKS FROM DB
      fetchMarks(parsed.studentId);
    }
  }, []);

  
  // ✅ FETCH FUNCTION
 const fetchMarks = async (studentId) => {
  try {

    // ===============================
    // 🔥 GET RESULT (SUBJECT LIST)
    // ===============================
    const resultRes = await databases.listDocuments(
      DATABASE_ID,
      "exam_results",
      [Query.equal("studentId", studentId)]
    );

    let subjectList = [];

    if (resultRes.documents.length > 0) {
      const resultDoc = resultRes.documents[0];

      subjectList = resultDoc.subjects
        ?.split(",")
        .map((s) => s.trim()) || [];
    }

    // ===============================
    // 🔥 GET MARKS
    // ===============================
    const marksRes = await databases.listDocuments(
      DATABASE_ID,
      "exam_subject_marks",
      [Query.equal("studentId", studentId)]
    );

    const marksDocs = marksRes.documents || [];

    // ===============================
    // 🔥 SAFE MERGE (NO BREAK)
    // ===============================
    const finalMarks = subjectList.map((sub, index) => {

      const mark = marksDocs[index];

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

    // fallback
    if (student?.marksArray) {
      setMarksArray(student.marksArray);
    }
  }
};
  if (!student) return <div className="p-10">Loading...</div>;

  const printPage = () => window.print();

  // ✅ TOTAL
  const total = marksArray.reduce((sum, m) => {
    return sum + Number(m.total || 0);
  }, 0);

  const franchiseSign = student.franchiseSignature || null;

  return (

    <div className="p-10 bg-white">

      <button
        onClick={printPage}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print Marksheet
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto">

        {/* TEMPLATE */}
        <img src="/beautymark.png" className="absolute w-full h-full" />

        {/* LEFT SIDE */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px]">{student.course}</div>
        <div className="absolute top-[450px] left-[330px]">{student.instituteName}</div>

        {/* RIGHT SIDE */}
        <div className="absolute top-[325px] left-[680px]">1 Year</div>
        <div className="absolute top-[348px] left-[680px]">{student.marksheetNo}</div>
        <div className="absolute top-[369px] left-[680px]">{student.dob}</div>
        <div className="absolute top-[390px] left-[680px]">{student.coursePeriod}</div>

        {/* SUBJECT TABLE */}
        {marksArray.slice(0, 1).map((m, index) => {

          const top = 550 + index * 40;

          return (
            <div key={index}>
<div style={{ top, left: 150, position: "absolute", width: 220 }}>
  {index === 0
    ? marksArray.map((s) => s.subject).join(", ")
    : ""}
</div>

              <div className="absolute top-[570px] left-[620px] font-bold">
                {m.objective}
              </div>

              <div className="absolute top-[570px] left-[690px] font-bold">
                {m.practical}
              </div>

              

            </div>
          );
        })}

        {/* GRAND TOTAL */}
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

      </div>

    </div>
  );
}