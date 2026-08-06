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
      setStudent({
    ...parsed,

    coursePeriod: parsed.coursePeriod || parsed.duration,
    logo: parsed.logo,
    franchiseSignature: parsed.franchiseSignature,
    ownerName: parsed.ownerName,
    city: parsed.city,
    certificateNo: parsed.certificateNo,
    marksheetNo: parsed.marksheetNo || parsed.certificateNo,
});
      fetchMarks(
parsed.studentId,
parsed.semesterNumber,
parsed.marksheetNo
)
    }
  }, []);

  useEffect(() => {
  const generateQR = async () => {
    if (!student?.studentId) return;

    const verifyUrl =
  `https://www.bnmiindia.org/beauty-verification/${student.studentId}?semester=${student.semesterNumber}`;

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
  const fetchMarks = async (

studentId,

semesterNumber,

marksheetNo

) => {
    try {

    const res = await databases.listDocuments(
  DATABASE_ID,
  "exam_results",
  [
    Query.equal(
"studentId",
studentId
),

Query.equal(
"semesterNumber",
Number(semesterNumber)
),
Query.equal(
"resultStatus",
"Approved"
)
  ]
);

     

   if (!res.documents.length) return;

const doc = res.documents[0];

setStudent(prev => ({
  ...prev,
  percentage: doc.percentage,
  grade: doc.grade,
  marksheetNo: doc.marksheetNo || prev.certificateNo,
  semesterNumber: doc.semesterNumber,
}));
  
const subjects =
typeof doc.marksArray === "string"
    ? JSON.parse(doc.marksArray || "[]")
    : (doc.marksArray || []);

    console.log("Semester Marks:", subjects);

const finalMarks = subjects.map((s) => ({
  subject: s.subject,
  objective: Number(s.objective || 0),
  practical: Number(s.practical || 0),
  total: Number(s.total || 0),
  semester: doc.semesterNumber
}));



      setMarksArray(finalMarks);

    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };

  // ===============================
  // ✅ QR
  // ===============================
 

  // ===============================
  // ✅ DOWNLOAD
  // ===============================
 const handleDownload = async () => {
  try {
    const node = printRef.current;
    if (!node) return;

    // Wait until all images are loaded
    const images = node.querySelectorAll("img");

    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    const dataUrl = await htmlToImage.toPng(node, {
      cacheBust: true,
      pixelRatio: 4,
      backgroundColor: "#ffffff",
      skipFonts: false,
      imagePlaceholder:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WvJr3QAAAAASUVORK5CYII=",
    });

    const link = document.createElement("a");
    link.download = `${student.studentName}_Semester_Marksheet.png`;
    link.href = dataUrl;
    link.click();

  } catch (err) {
    console.error("Download Error:", err);
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

  const percentage =
student.percentage ||
0;


const objectiveTotal = marksArray.reduce(
  (sum,m)=>sum+Number(m.objective||0),
0);

const practicalTotal = marksArray.reduce(
  (sum,m)=>sum+Number(m.practical||0),
0);

const objectiveOutOf = marksArray.length*50;
const practicalOutOf = marksArray.length*50;
const totalOutOf = marksArray.length*100;

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
    position: "relative",
    background: "#fff",
    overflow: "hidden"
  }}
>

        {/* TEMPLATE */}
        <img src="/multiplemarksheet.png" className="absolute w-full h-full" />

        {student?.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
        src={student.logo}
        className="w-full h-full object-cover rounded-full"
    />
</div>
)}

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
  {student.marksheetNo || student.certificateNo}
</div>
<div className="absolute top-[355px] left-[680px]">
  {
student.dob
? new Date(student.dob) 
    .toLocaleDateString("en-GB")
    .replace(/\//g,"-")
: ""
}
</div>

<div className="absolute top-[378px] left-[680px] text-[13px]">
  {student.coursePeriod || student.duration}
</div>

        {/* SUBJECT TABLE */}


          

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
  {marksArray.map((m,index)=>(
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
          Grade: {student.grade}
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
  src={student.franchiseSignature}
  crossOrigin="anonymous"
  loading="eager"
  decoding="sync"
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

        {/* QR */}
      {qrCode && (
  <img
    src={qrCode}
    className="absolute  top-[240px] right-[80px] w-[90px] bg-white p-1"
  />
)}

      </div>
    </div>
  );
}