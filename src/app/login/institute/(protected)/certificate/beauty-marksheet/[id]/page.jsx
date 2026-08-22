"use client";

import { useEffect, useState } from "react";
import { databases, ID, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";
import { useParams } from "next/navigation";


const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

    const { id } = useParams();

 const [student, setStudent] = useState(null);
const [marksArray, setMarksArray] = useState([]);
const [qrCode, setQrCode] = useState("");

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
  
useEffect(() => {

  if (!id) return;

  const loadData = async () => {

    try {

      // Certificate
     // Exam Result
// ✅ Load certificate first
const cert = await databases.getDocument(
  DATABASE_ID,
  "certificates",
  id
);

// ✅ Load student
const studentData = await databases.getDocument(
  DATABASE_ID,
  "student_admissions",
  cert.studentId
);

// ✅ Load exam result by studentId
const resultRes = await databases.listDocuments(
  DATABASE_ID,
  "exam_results",
  [
    Query.equal("studentId", cert.studentId)
  ]
);

if (resultRes.documents.length === 0) {
  alert("Exam result not found");
  return;
}

const result = resultRes.documents[0];
      // ✅ FETCH FRANCHISE
let franchiseData = null;

try {

  const franchiseRes = await databases.listDocuments(
    DATABASE_ID,
    "franchise_approved",
    [
      Query.equal(
        "email",
        studentData.franchiseEmail
      )
    ]
  );

  if (franchiseRes.documents.length > 0) {
    franchiseData = franchiseRes.documents[0];
  }

} catch (err) {
  console.log("FRANCHISE ERROR:", err);
}

const finalData = {
  ...(studentData || {}),
  ...(cert || {}),

  studentId: cert.studentId,

  studentName:
    cert.studentName ||
    studentData?.studentName ||
    "",

  fatherName:
    cert.fatherName ||
    studentData?.fatherName ||
    "",

  motherName:
    cert.motherName ||
    studentData?.motherName ||
    "",

  surname:
    cert.surname ||
    studentData?.surname ||
    "",

  dob:
    cert.dob ||
    studentData?.dob ||
    "",

  relationType:
    cert.relationType ||
    studentData?.relationType ||
    "S/O",

  course:
    cert.course ||
    studentData?.courseName ||
    "",

  instituteName:
    cert.instituteName ||
    studentData?.instituteName ||
    "",

  duration:
    cert.duration ||
    studentData?.duration ||
    "",

  coursePeriod:
    cert.coursePeriod ||
    studentData?.coursePeriod ||
    "",

  marks:
    cert.marks ??
    studentData?.marks ??
    "",

  grade:
    cert.grade ||
    "",

  marksheetNo:
    cert.marksheetNo ||
    cert.certificateNo ||
    "",

  issueDate:
    cert.issueDate ||
    "",

  logo:
    franchiseData?.logo ||
    cert.logo ||
    "",

  franchiseSignature:
    franchiseData?.signature ||
    cert.franchiseSignature ||
    "",

  ownerName:
    franchiseData?.ownerName ||
    cert.ownerName ||
    "",

  city:
    franchiseData?.city ||
    cert.city ||
    "",
};
      setStudent(finalData);

    fetchMarks(cert.studentId);

    } catch (err) {
      console.log(err);
    }

  };

  loadData();

}, [id]);


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

  useEffect(() => {
  const loadImages = async () => {
    if (!student) return;

    try {
      if (student.logo) {
        const logoBase64 = await toBase64(student.logo);
        setStudent(prev => ({ ...prev, logo: logoBase64 }));
      }

      if (student.franchiseSignature) {
        const signBase64 = await toBase64(student.franchiseSignature);
        setStudent(prev => ({ ...prev, franchiseSignature: signBase64 }));
      }

    } catch (err) {
      console.log("IMAGE LOAD ERROR:", err);
    }
  };

  loadImages();
}, [student?.studentId]);
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

  parsedMarks = JSON.parse(
    resultDoc.marksArray
  );

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


  // ==========================================
// UPDATE SUBJECT NAME IN UI
// ==========================================
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


// ==========================================
// SAVE SUBJECT CHANGES
// ==========================================
const saveSubjectChanges = async () => {

  // ADMIN ONLY
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
    // FIND EXAM RESULT
    // ==========================================

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


    if (resultRes.documents.length === 0) {

      alert("Exam result not found.");

      return;
    }


    const resultDoc =
      resultRes.documents[0];


    // ==========================================
    // PREPARE UPDATED MARKS
    // ==========================================

    const updatedMarksArray =
      marksArray.map((m) => ({

        subject:
          m.subject.trim(),

        objective:
          Number(m.objective || 0),

        practical:
          Number(m.practical || 0),

        total:
          Number(m.objective || 0) +
          Number(m.practical || 0),

      }));


    // ==========================================
    // UPDATE EXAM RESULTS
    // ==========================================

    await databases.updateDocument(

      DATABASE_ID,

      "exam_results",

      resultDoc.$id,

      {

        subjects:
          updatedMarksArray
            .map((m) => m.subject)
            .join(", "),

        marksArray:
          JSON.stringify(
            updatedMarksArray
          ),

      }

    );


    // ==========================================
    // UPDATE STUDENT SUBJECT RESULTS
    // ==========================================

    const subjectRes =
      await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [
          Query.equal(
            "studentId",
            student.studentId
          ),
          Query.limit(500),
        ]
      );


    // Update existing subject documents
    // according to their order

    for (
      let i = 0;
      i < updatedMarksArray.length;
      i++
    ) {

      const subjectDoc =
        subjectRes.documents[i];

      if (!subjectDoc) continue;


      await databases.updateDocument(

        DATABASE_ID,

        "student_subject_results",

        subjectDoc.$id,

        {

          subject:
            updatedMarksArray[i].subject,

        }

      );

    }


    // Update local state
    setMarksArray(updatedMarksArray);

    setEditingSubjects(false);

    alert(
      "Subjects updated successfully."
    );


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
  if (!student) return <div className="p-10">Loading...</div>;

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

  const franchiseSign = student.franchiseSignature || null;

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
        onClick={() =>
          setEditingSubjects(true)
        }
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Edit Subjects
      </button>

    ) : (

      <>

        <button
          onClick={() => {

            setEditingSubjects(false);

            fetchMarks(
              student.studentId
            );

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
    height: "1200px",
    position: "relative",
    overflow: "visible"
  }}
>
        <img src="/singlemark.png" className="absolute w-full h-full" />

        {/* LOGO */}
      {student.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={student.logo}
      className="w-full h-full object-cover rounded-full"
    />
  </div>

)}

        {/* LEFT */}
        <div className="absolute top-[325px] left-[330px]">{student.studentName}</div>
        <div className="absolute top-[346px] left-[330px]">{student.fatherName}</div>
        <div className="absolute top-[367px] left-[330px]">{student.surname}</div>
        <div className="absolute top-[388px] left-[330px]">{student.motherName}</div>
        <div className="absolute top-[410px] left-[330px] font-semibold">{student.course}</div>
        <div className="absolute top-[435px] left-[330px] font-semibold">
          {student.instituteName}
        </div>

        {/* RIGHT */}
       {/* RIGHT */}
{/* <div className="absolute top-[330px] left-[680px] text-[13px]">
  {student.coursePeriod || student.duration || "1 Year"}
</div> */}

<div className="absolute top-[348px] left-[680px]">
  {student.marksheetNo || student.certificateNo}
</div>

<div className="absolute top-[369px] left-[680px]">
  {student.dob
    ? new Date(student.dob)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
    : ""}
</div>

<div className="absolute top-[392px] left-[680px] text-[13px]">
  {student.coursePeriod || student.duration}
</div>

        {/* SUBJECTS */}
        {marksArray.map((m, index) => (
          <div key={index}>
          <div
  style={{
    top: 550 + index * 120,
    left: 135,
    width: "465px",
    position: "absolute",
    fontSize: "15px",
    lineHeight: "1.5",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
  }}
>
{editingSubjects ? (

  <textarea
    value={m.subject || ""}
    onChange={(e) =>
      updateSubjectName(
        index,
        e.target.value
      )
    }
    className="border border-gray-400 px-2 py-1 w-full bg-white text-black rounded"
    rows={3}
  />

) : (

  m.subject
    ?.split("\n")
    .filter(
      (line) =>
        line.trim() !== ""
    )
    .map((line, i) => (

      <div
        key={i}
        style={{
          marginBottom: "6px"
        }}
      >
        {i + 1}. {line.trim()}
      </div>

    ))

)}
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
         <div className="absolute top-[572px] left-[780px] font-bold">
          {total}
        </div>

        {/* GRADE */}
        {/* <div className="absolute top-[572px] left-[780px] font-bold">
          {student.grade}
        </div> */}

        {/* ✅ QR */}
        {qrCode && (
          <img
            src={qrCode}
            className="absolute top-[240px] right-[50px] w-[90px] bg-white p-1"
          />
        )}

      </div>
    </div>
  );
}