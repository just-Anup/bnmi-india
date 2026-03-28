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
      fetchMarks(parsed.studentId, parsed);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const fetchMarks = async (studentId, studentData) => {
    try {

      if (studentData?.courseType === "multiple") {

        const res = await databases.listDocuments(
          DATABASE_ID,
          "student_subject_results",
          [Query.equal("studentId", studentId)]
        );

        const docs = res.documents || [];

        // ✅ FIXED (safe sort)
        const sorted = [...docs].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        const finalMarks = sorted.map((m) => ({
          subject: m.subject,
          objective: Number(m.objective || 0),
          practical: Number(m.practical || 0),
          total: Number(m.total || 0),
        }));

        setMarksArray(finalMarks);

      } else {

        // ✅ SINGLE + BEAUTY (UNCHANGED)
        const resultRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [Query.equal("studentId", studentId)]
        );

        let subjectList = [];

        if (resultRes.documents.length > 0) {
          subjectList = resultRes.documents[0].subjects
            ?.split(",")
            .map((s) => s.trim()) || [];
        }

        const marksRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_subject_marks",
          [Query.equal("studentId", studentId)]
        );

        const marksDocs = marksRes.documents || [];

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
      }

    } catch (err) {
      console.log("MARK FETCH ERROR:", err);

      if (studentData?.marksArray) {
        setMarksArray(studentData.marksArray);
      }
    }
  };

  if (!student) return <div className="p-10">Loading...</div>;

  const total = marksArray.reduce((sum, m) => sum + Number(m.total || 0), 0);

  const getGrade = () => {
    if (!marksArray.length) return "";

    const maxMarks =
      student?.courseType === "single" || student?.courseType === "beauty"
        ? 100
        : marksArray.length * 100;

    const percentage = (total / maxMarks) * 100;

    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 55) return "B";
    if (percentage >= 40) return "C";

    return "F";
  };

  const franchiseSign = student.franchiseSignature || null;

  return (
    <div className="p-10 bg-white">

      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print / Download PDF
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto print-container">

        <img src="/beautymark.png" className="absolute w-full h-full" />

        {student?.logo && (
          <img
            src={student.logo}
            className="absolute top-[10px] left-[380px] w-[160px] h-[160px]"
          />
        )}

        {/* LEFT SIDE */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px]">{student.course}</div>

        {/* ✅ FIXED HERE */}
        <div className="absolute top-[450px] left-[330px]">{student.instituteName}</div>

        {/* RIGHT SIDE */}
        <div className="absolute top-[325px] left-[680px]">1 Year</div>
        <div className="absolute top-[348px] left-[680px]">{student.marksheetNo}</div>
        <div className="absolute top-[369px] left-[680px]">{student.dob}</div>
        <div className="absolute top-[390px] left-[680px]">{student.coursePeriod}</div>

        {/* MULTIPLE */}
        {student?.courseType?.toLowerCase() === "multiple" ? (

  // ✅ MULTIPLE
  marksArray.map((m, index) => {
    const topPosition = 570 + index * 30;

    return (
      <div key={index}>
        <div style={{ position: "absolute", top: topPosition, left: 150 }}>
          {index + 1}) {m.subject}
        </div>

        <div style={{ position: "absolute", top: topPosition, left: 620 }}>
          {m.objective}
        </div>

        <div style={{ position: "absolute", top: topPosition, left: 690 }}>
          {m.practical}
        </div>

        <div style={{ position: "absolute", top: topPosition, left: 760 }}>
          {m.total}
        </div>
      </div>
    );
  })

) : (

  // ✅ SINGLE + BEAUTY (UNCHANGED)
  marksArray.slice(0, 1).map((m, index) => (
    <div key={index}>
      <div style={{ top: 570, left: 150, position: "absolute", width: 420 }}>
        {marksArray.map((s) => s.subject).join(", ")}
      </div>

      <div className="absolute top-[570px] left-[620px] font-bold">
        {m.objective}
      </div>

      <div className="absolute top-[570px] left-[690px] font-bold">
        {m.practical}
      </div>
    </div>
  ))

)}

        {/* TOTAL */}
        <div className="absolute bottom-[290px] left-[775px] font-bold">
          {total}
        </div>

        {/* GRADE */}
        <div className="absolute top-[572px] left-[780px] font-bold">
          {getGrade()}
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