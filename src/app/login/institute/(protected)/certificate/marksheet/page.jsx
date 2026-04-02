"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";
import QRCode from "qrcode";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
    const [qrCode, setQrCode] = useState("");

  const printRef = useRef();
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

  const fixColors = () => {
  const all = document.querySelectorAll("*");

  all.forEach((el) => {
    const style = window.getComputedStyle(el);

    if (
      style.color.includes("lab") ||
      style.backgroundColor.includes("lab")
    ) {
      el.style.color = "#000";
      el.style.backgroundColor = "#fff";
    }
  });
};

useEffect(() => {
  const generateQR = async () => {
    try {
      console.log("STUDENT:", student);

      if (!student?.studentId) {
        console.log("❌ studentId missing");
        return;
      }

      const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;
      console.log("QR URL:", verifyUrl);

      const qr = await QRCode.toDataURL(verifyUrl);

      console.log("QR GENERATED ✅");

      setQrCode(qr);

    } catch (err) {
      console.log("QR ERROR:", err);
    }
  };

  if (student) generateQR();
}, [student]);
 

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
          "student_subject_results",
          [Query.equal("studentId", studentId)]
        );

        let subjectList = [];

        if (resultRes.documents.length > 0) {
          subjectList = resultRes.documents[0].subjects
            ?.split(",")
            .map((s) => s.trim()) || [];
        }

        // 🔹 FIRST: try exam_subject_marks
const marksRes = await databases.listDocuments(
  DATABASE_ID,
  "exam_subject_marks",
  [Query.equal("studentId", studentId)]
);

let marksDocs = marksRes.documents || [];

// 🔥 FALLBACK: if empty → use student_subject_results
if (marksDocs.length === 0) {
  const fallbackRes = await databases.listDocuments(
    DATABASE_ID,
    "student_subject_results",
    [Query.equal("studentId", studentId)]
  );

  const fallbackDocs = fallbackRes.documents || [];

  const finalMarks = fallbackDocs.map((m) => ({
    subject: m.subject,
    objective: Number(m.objective || 0),
    practical: Number(m.practical || 0),
    total: Number(m.total || 0),
  }));

  setMarksArray(finalMarks);

} else {
  // ✅ NORMAL FLOW
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
    


    const toBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};


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

        <img src="/beautymark.png" className="absolute w-full h-full" />

        {student?.logo && (
  <img
    src={student.logo + "&mode=admin"}
    crossOrigin="anonymous"
    className="absolute top-[10px] left-[380px] w-[130px] h-[130px]"
  />
)}
{qrCode ? (
  <img
    src={qrCode}
    alt="QR Code"
    className="absolute top-[240px] right-[50px] w-[110px] bg-white p-1"
  />
) : (
  <div className="absolute top-[240px] right-[50px] text-xs">
    Generating QR...
  </div>
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
  src={franchiseSign + "&mode=admin"}
  crossOrigin="anonymous"
  className="absolute bottom-[90px] left-[130px] w-[100px]"
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