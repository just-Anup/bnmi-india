"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";
import { useParams } from "next/navigation";

import jsPDF from "jspdf";

import QRCode from "qrcode";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheetMultiple() {

  const { id } = useParams();

const [student, setStudent] = useState(null);
const [marksArray, setMarksArray] = useState([]);
const [qrCode, setQrCode] = useState("");
const [courseData, setCourseData] = useState(null);

// ===============================
// SUBJECT EDIT
// ===============================
const [editingSubjects, setEditingSubjects] = useState(false);
const [savingSubjects, setSavingSubjects] = useState(false);

// ===============================
// ADMIN CHECK
// ===============================
const [isAdmin, setIsAdmin] = useState(false);
const [loadingUser, setLoadingUser] = useState(true);

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
  (a, b) => new Date(a.$createdAt) - new Date(b.$createdAt)
);

    const finalMarks = docs.map((m) => ({
  $id: m.$id,
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

// ===============================
// ADMIN CHECK
// ===============================
useEffect(() => {

  const checkAdmin = async () => {

    try {

      const user = await account.get();

      if (user.email === "bnmiindia123@gmail.com") {
        setIsAdmin(true);
      }

    } catch (err) {

      console.log("ADMIN CHECK ERROR:", err);

    } finally {

      setLoadingUser(false);

    }

  };

  checkAdmin();

}, []);


  // ===============================
// UPDATE SUBJECT NAME IN UI
// ===============================
const updateSubjectName = (index, value) => {

  setMarksArray((prev) => {

    const updated = [...prev];

    updated[index] = {
      ...updated[index],
      subject: value,
    };

    return updated;
  });

};


// ===============================
// SAVE SUBJECT CHANGES
// ===============================
const saveSubjectChanges = async () => {

  // ==========================================
  // ADMIN ONLY
  // ==========================================
  if (!isAdmin) {
    alert("Only admin can edit subjects.");
    return;
  }

  if (savingSubjects) return;

  try {
    setSavingSubjects(true);

    if (!marksArray.length) {
      alert("No subjects found.");
      return;
    }

    // Check empty subjects
    const hasEmptySubject = marksArray.some(
      (m) => !m.subject?.trim()
    );

    if (hasEmptySubject) {
      alert("Subject name cannot be empty.");
      return;
    }


    // ==========================================
    // UPDATE student_subject_results
    // ==========================================

    for (const mark of marksArray) {

      if (!mark.$id) {
        console.log(
          "Missing document ID for:",
          mark.subject
        );
        continue;
      }

      await databases.updateDocument(
        DATABASE_ID,
        "student_subject_results",
        mark.$id,
        {
          subject: mark.subject.trim(),
        }
      );

    }


    // ==========================================
    // ALSO UPDATE exam_results
    // ==========================================

    if (student?.studentId) {

      const resultRes =
        await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [
            Query.equal(
              "studentId",
              student.studentId
            ),
            Query.limit(1),
          ]
        );


      if (resultRes.documents.length > 0) {

        const result =
          resultRes.documents[0];


        const updatedMarksArray =
          marksArray.map((m) => ({
            subject: m.subject.trim(),

            objective:
              Number(m.objective || 0),

            practical:
              Number(m.practical || 0),

            total:
              Number(m.objective || 0) +
              Number(m.practical || 0),
          }));


        await databases.updateDocument(
          DATABASE_ID,
          "exam_results",
          result.$id,
          {
            subjects: marksArray
              .map((m) => m.subject.trim())
              .join(", "),

            marksArray:
              JSON.stringify(
                updatedMarksArray
              ),
          }
        );

      }

    }


    setEditingSubjects(false);

    alert("Subjects updated successfully.");

  } catch (err) {

    console.error(
      "SUBJECT UPDATE ERROR:",
      err
    );

    alert(
      err?.message ||
      "Failed to update subjects."
    );

  } finally {

    setSavingSubjects(false);

  }

};

useEffect(() => {

  if (!id) return;

  const fetchStudent = async () => {

    try {

      // Load exam result
     // ✅ Load certificate first
const certificate = await databases.getDocument(
  DATABASE_ID,
  "certificates",
  id
);

// ✅ Load student
let studentDoc = null;

const needStudentData =
  !certificate.studentName ||
  !certificate.fatherName ||
  !certificate.motherName ||
  !certificate.surname ||
  !certificate.dob;

if (needStudentData) {
  studentDoc = await databases.getDocument(
    DATABASE_ID,
    "student_admissions",
    certificate.studentId
  );
}
// ✅ Load exam result using studentId
const resultRes = await databases.listDocuments(
  DATABASE_ID,
  "exam_results",
  [
    Query.equal("studentId", certificate.studentId)
  ]
);

if (resultRes.documents.length === 0) {
  alert("Exam result not found");
  return;
}

const result = resultRes.documents[0];

      // Load franchise
      let franchise = null;

      try {

     

const needFranchiseData =
  !certificate.logo ||
  !certificate.ownerName ||
  !certificate.franchiseSignature ||
  !certificate.city;

if (needFranchiseData) {

  const franchiseEmail =
    certificate.franchiseEmail ||
    studentDoc?.franchiseEmail;

  if (franchiseEmail) {

    const franchiseRes =
      await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [
          Query.equal("email", franchiseEmail)
        ]
      );

    if (franchiseRes.documents.length > 0) {
      franchise = franchiseRes.documents[0];
    }

  }

}

        if (franchiseRes.documents.length > 0) {
          franchise = franchiseRes.documents[0];
        }

      } catch (err) {
        console.log(err);
      }

  setStudent({

  ...(studentDoc || {}),
  ...(certificate || {}),

  studentId: certificate.studentId,

  studentName:
    certificate.studentName ||
    studentDoc?.studentName ||
    "",

  fatherName:
    certificate.fatherName ||
    studentDoc?.fatherName ||
    "",

  motherName:
    certificate.motherName ||
    studentDoc?.motherName ||
    "",

  surname:
    certificate.surname ||
    studentDoc?.surname ||
    "",

  dob:
    certificate.dob ||
    studentDoc?.dob ||
    "",

  course:
    certificate.course ||
    studentDoc?.courseName ||
    "",

  instituteName:
    certificate.instituteName ||
    studentDoc?.instituteName ||
    "",

  duration:
    certificate.duration ||
    studentDoc?.duration ||
    "",

  coursePeriod:
    certificate.coursePeriod ||
    studentDoc?.coursePeriod ||
    "",

  certificateNo:
    certificate.certificateNo ||
    "",

  logo:
    certificate.logo ||
    franchise?.logo ||
    "",

  franchiseSignature:
    certificate.franchiseSignature ||
    franchise?.signature ||
    "",

  ownerName:
    certificate.ownerName ||
    franchise?.ownerName ||
    franchise?.owner ||
    franchise?.name ||
    "",

  city:
    certificate.city ||
    franchise?.city ||
    "",

});

      fetchMarks(result.studentId);

    } catch (err) {

      console.log(err);

    }

  };

  fetchStudent();

}, [id]);

  

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

  // ✅ UPDATE ALL SUBJECTS
      await Promise.all(
        res.documents.map((doc) =>
          databases.updateDocument(
            DATABASE_ID,
            "student_subject_results",
            doc.$id,
            { percentage: percent }
          )
        )
      );

    } catch (err) {
      console.log("SAVE PERCENT ERROR:", err);
    }
  };

  savePercentage();
}, [marksArray]);
  

 const getGrade = () => {
  const percent = percentage;

  if (percent >= 85) return "A+";
  if (percent >= 70) return "A";
  if (percent >= 55) return "B";
  if (percent >= 40) return "C";
  if (percent >= 35) return "D";
  if (percent >= 33) return "F";

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


const objectiveTotal = marksArray.reduce(
  (sum, m) => sum + Number(m.objective || 0),
  0
);

const practicalTotal = marksArray.reduce(
  (sum, m) => sum + Number(m.practical || 0),
  0
);

const objectiveOutOf = marksArray.length * 50;
const practicalOutOf = marksArray.length * 50;
const totalOutOf = marksArray.length * 100;

  return (
    <div className="p-10 bg-white">

 <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download Image
      </button>

{/* ========================================== */}
{/* ADMIN ONLY SUBJECT EDIT */}
{/* ========================================== */}

{isAdmin && !loadingUser && (

  <div className="mb-6 flex gap-3">

    {!editingSubjects ? (

      <button
        onClick={() => setEditingSubjects(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Edit Subjects
      </button>

    ) : (

      <>
        <button
          onClick={() => {
            setEditingSubjects(false);

            // Reload original subjects
            fetchMarks(student.studentId);
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
        >
          Cancel
        </button>

        <button
          onClick={saveSubjectChanges}
          disabled={savingSubjects}
          className={`px-6 py-2 rounded text-white ${
            savingSubjects
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {savingSubjects
            ? "Saving..."
            : "Save Subject Changes"}
        </button>
      </>

    )}

  </div>

)}

  <div
  ref={printRef}
  style={{
    width: "900px",
    minHeight: "1200px",
    height: "auto",
    position: "relative",
    overflow: "visible"
  }}
>
        {/* TEMPLATE */}
        <img src="/multiplemarksheet.png" className="absolute w-full h-full" />

        {/* LOGO */}
               {student.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={student.logo}
      className="w-full h-full object-cover rounded-full"
    />
  </div>

)}

  

        {/* ===============================
            LEFT SIDE
        =============================== */}
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


{qrCode && (
  <img
    src={qrCode}
    className="absolute  top-[240px] right-[80px] w-[90px] bg-white p-1"
  />
)}
      {/* ===============================
    SUBJECT TABLE
=============================== */}

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
  {marksArray.map((m, index) => (
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

  {editingSubjects ? (

    <input
      type="text"
      value={m.subject || ""}
      onChange={(e) =>
        updateSubjectName(
          index,
          e.target.value
        )
      }
      className="border border-gray-400 px-2 py-1 w-full bg-white text-black rounded"
    />

  ) : (

    <>
      {index + 1}) {m.subject}
    </>

  )}

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
  Grade: {getGrade()}
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
  src={student.franchiseSignature + "&mode=admin"} 
  crossOrigin="anonymous"
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

      </div>
    </div>
  );
}