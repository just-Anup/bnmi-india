"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {

    const fetchData = async () => {
      try {

        // ✅ GET STUDENT ID FROM LOCALSTORAGE (ONLY CHANGE)
        const stored = localStorage.getItem("marksheetStudent");

        if (!stored) {
          setError("❌ No data found");
          return;
        }

        const parsed = JSON.parse(stored);
        const studentId = parsed.studentId;

        // 🔹 FETCH STUDENT (UNCHANGED LOGIC)
        const studentData = await databases.getDocument(
          DATABASE_ID,
          "student_admissions",
          studentId
        );

        setStudent(studentData);

        // 🔹 FETCH MARKS (UNCHANGED LOGIC)
        const res = await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [Query.equal("studentId", studentId)]
        );

        if (res.documents.length > 0) {
          const doc = res.documents[0];

          if (doc.marksArray) {
            setMarksArray(JSON.parse(doc.marksArray));
          }

          if (doc.qrCode) {
            setQrCode(doc.qrCode);
          } else {
            const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${studentData.$id}`;
            const qr = await QRCode.toDataURL(verifyUrl);
            setQrCode(qr);
          }

        } else {
          const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${studentData.$id}`;
          const qr = await QRCode.toDataURL(verifyUrl);
          setQrCode(qr);
        }

      } catch (err) {
        console.log("DB ERROR:", err);
        setError("❌ Invalid data");
      }
    };

    fetchData();

  }, []); // ✅ removed [id]

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, []);

  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!student) return <div className="p-10">Loading...</div>;

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

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
        <div className="absolute top-[348px] left-[680px]">{student.$id}</div>
        <div className="absolute top-[369px] left-[680px]">
          {student.dob
            ? new Date(student.dob).toLocaleDateString("en-GB")
            : ""}
        </div>
        <div className="absolute top-[390px] left-[680px]">{student.coursePeriod}</div>

        {/* SUBJECTS */}
        {marksArray.map((m, index) => (
          <div key={index}>
            <div style={{ top: 570 + index * 30, left: 150, position: "absolute" }}>
              {m.subject}
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

        {/* QR */}
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