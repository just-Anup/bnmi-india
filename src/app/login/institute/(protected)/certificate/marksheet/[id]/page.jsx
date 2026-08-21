"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

const { id } = useParams();

const [student, setStudent] = useState(null);
const [marksArray, setMarksArray] = useState([]);
const [qrCode, setQrCode] = useState("");

// ==========================================
// SUBJECT EDIT
// ==========================================
const [editingSubjects, setEditingSubjects] = useState(false);
const [savingSubjects, setSavingSubjects] = useState(false);

// ==========================================
// ADMIN CHECK
// ==========================================
const [isAdmin, setIsAdmin] = useState(false);
const [loadingUser, setLoadingUser] = useState(true);

const printRef = useRef();

useEffect(() => {

  const loadStudent = async () => {

    try {

      // Load exam result using URL id
   // ✅ Load certificate
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

// ✅ Load exam result
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

// ✅ Merge all required data
const finalData = {
  ...result,
  ...studentData,
  ...cert,

  studentName:
    cert.studentName ||
    studentData.studentName,

  fatherName:
    cert.fatherName ||
    studentData.fatherName,

  motherName:
    cert.motherName ||
    studentData.motherName,

  surname:
    cert.surname ||
    studentData.surname ||
    "",

  course:
    cert.course ||
    studentData.courseName,

  instituteName:
    cert.instituteName ||
    studentData.instituteName,

  duration:
    cert.duration ||
    studentData.duration,

  coursePeriod:
    cert.coursePeriod ||
    studentData.coursePeriod,

  certificateNo:
    cert.certificateNo || "",

  marksheetNo:
    cert.marksheetNo ||
    cert.certificateNo ||
    "",

  dob:
    cert.dob ||
    studentData.dob ||
    "",

  relationType:
    cert.relationType ||
    studentData.relationType,

  showFatherInCertificate:
    cert.showFatherInCertificate ??
    studentData.showFatherInCertificate,

  showMotherInCertificate:
    cert.showMotherInCertificate ??
    studentData.showMotherInCertificate,

  logo:
    cert.logo,

  ownerName:
    cert.ownerName,

  franchiseSignature:
    cert.franchiseSignature,
};

setStudent(finalData);

fetchMarks(cert.studentId, finalData);

    } catch (err) {

      console.log("LOAD ERROR:", err);

    }

  };

  if (id) {
    loadStudent();
  }

}, [id]);

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

        if (!student?.studentId) return;

        const verifyUrl =
          `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

        const qr = await QRCode.toDataURL(verifyUrl);

        setQrCode(qr);

      } catch (err) {
        console.log("QR ERROR:", err);
      }
    };

    if (student) generateQR();

  }, [student]);

  const fetchMarks = async (studentId, studentData) => {
  try {

    // ==========================================
    // GET MARKS FROM EXAM_RESULTS
    // ==========================================

    const resultRes = await databases.listDocuments(
  DATABASE_ID,
  "exam_results",
  [
    Query.equal("studentId", studentId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]
);

    if (resultRes.documents.length === 0) {
      console.log("No exam result found for:", studentId);
      setMarksArray([]);
      return;
    }

    // ==========================================
    // FIND THE CORRECT RESULT
    // ==========================================

    let resultDoc = resultRes.documents[0];

    // For normal single/beauty courses there should
    // normally be one result. For semester courses,
    // keep the existing semester result separate.
    if (studentData?.courseType === "semester") {

      resultDoc =
        resultRes.documents.find(
          (doc) =>
            Number(doc.semesterNumber) ===
            Number(studentData.currentSemester || 1)
        ) || resultDoc;
    }

    // ==========================================
    // READ MARKS ARRAY
    // ==========================================

    let parsedMarks = [];

    if (resultDoc.marksArray) {

      try {

        parsedMarks =
          typeof resultDoc.marksArray === "string"
            ? JSON.parse(resultDoc.marksArray)
            : resultDoc.marksArray;

      } catch (parseError) {

        console.error(
          "MARKS ARRAY PARSE ERROR:", 
          parseError
        );

        parsedMarks = []; 
      }
    }

    // ==========================================
    // CONVERT TO MARKSHEET FORMAT
    // ==========================================

    const finalMarks = parsedMarks.map((m) => ({
      subject: m.subject || "",
      objective: Number(
        m.objective ?? m.theory ?? 0
      ),
      practical: Number(
        m.practical ?? 0
      ),
      total: Number(
        m.total ??
        (
          Number(m.objective ?? m.theory ?? 0) +
          Number(m.practical ?? 0)
        )
      ),
    }));

    console.log(
      "MARKSHEET MARKS FROM EXAM_RESULTS:",
      finalMarks
    );

    setMarksArray(finalMarks);

  } catch (err) {

    console.error(
      "MARK FETCH ERROR:",
      err
    );

    setMarksArray([]);
  }
};

  // ==========================================
// ADMIN CHECK
// ==========================================
useEffect(() => {

  const checkAdmin = async () => {

    try {

      const user = await account.get();

      if (user.email === "bnmiindia@gmail.com") {
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


    // Check empty subject names
    const hasEmptySubject = marksArray.some(
      (m) => !m.subject?.trim()
    );

    if (hasEmptySubject) {

      alert("Subject name cannot be empty.");

      return;

    }


    // ==========================================
    // 1. UPDATE EXAM RESULTS
    // ==========================================

    const examRes =
      await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [
          Query.equal(
            "studentId",
            student.studentId
          ),
          Query.limit(100),
        ]
      );


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


    for (const examDoc of examRes.documents) {

     await databases.updateDocument(
  DATABASE_ID,
  "exam_results",
  examDoc.$id,
  {
    marksArray: JSON.stringify(updatedMarksArray),
  }
);
    }


    // ==========================================
    // 2. UPDATE STUDENT SUBJECT RESULTS
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

      const sortedSubjectDocs =
  [...subjectRes.documents].sort(
    (a, b) =>
      new Date(a.$createdAt) -
      new Date(b.$createdAt)
  );


    /*
      Update subjects according to their
      existing order.
    */

    for (
      let i = 0;
      i < updatedMarksArray.length;
      i++
    ) {

     const subjectDoc =
  sortedSubjectDocs[i];

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



    // ==========================================
    // 3. UPDATE LOCAL STATE
    // ==========================================

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

  if (!student) return <div className="p-10">Loading...</div>;

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  const handleDownload = async () => {

    try {

      const node = printRef.current;
      const rect = node.getBoundingClientRect();

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,

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
      student?.courseType === "single" ||
      student?.courseType === "beauty"
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

      {/* DOWNLOAD */}
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
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
      >
        Edit Subjects
      </button>

    ) : (

      <>

        <button
          onClick={() => {

            setEditingSubjects(false);

            fetchMarks(
              student.studentId,
              student
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

      {/* PRINT */}
      <button
        onClick={() => window.print()}
        className="bg-blue-600 text-white px-6 py-2 mb-6 ml-3"
      >
        Print
      </button>

      {/* MARKSHEET */}
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

        {/* BG */}
        <img
          src="/singlemark.png"
          className="absolute w-full h-full"
        />

        {/* LOGO */}
        {student.logo && (
          <div
            className="absolute top-[10px] left-[410px]
            w-[135px] h-[135px] overflow-hidden bg-white
            rounded-full border-4 border-white
            flex items-center justify-center shadow-md"
          >
            <img
              src={student.logo}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}

        {/* QR */}
        {qrCode ? (
          <img
            src={qrCode}
            alt="QR Code"
            className="absolute  top-[240px] right-[50px] w-[90px] bg-white p-1"
          />
        ) : (
          <div className="absolute top-[240px] right-[50px] text-xs">
            Generating QR...
          </div>
        )}

        {/* LEFT SIDE */}
        <div className="absolute top-[325px] left-[330px]">
          {student.studentName}
        </div>

        <div className="absolute top-[346px] left-[330px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[367px] left-[330px]">
          {
  student.surname ||
  ""
}
        </div>

        <div className="absolute top-[388px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[410px] left-[330px]">
          {student.course}
        </div>

        <div className="absolute top-[432px] left-[330px] font-semibold">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}
        {/* <div className="absolute top-[330px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration || "1 Year"}
        </div> */}

        <div className="absolute top-[348px] left-[680px] text-[15px]">
          {
  student.marksheetNo ||
  student.certificateNo ||
  ""
}
        </div>

        <div className="absolute top-[369px] left-[680px] text-[15px]">
         {
  (student.dob || student.dateOfBirth)
    ? new Date(
        student.dob || student.dateOfBirth
      )
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
    : ""
}
        </div>

        <div className="absolute top-[392px] left-[680px] text-[13px]">
          {
  student.coursePeriod ||
student.duration ||
"1 Year"
}
        </div>

        {/* SUBJECT SECTION */}
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 145,
            width: "640px",
          }}
        >

          {student?.courseType?.toLowerCase() === "multiple" ? (

            marksArray.map((m, index) => (

              <div
                key={index}
                style={{
                  display: "flex",
                  minHeight: "40px",
                  height: "auto",
                  borderBottom: "1px solid black",
                }}
              >

                {/* SUBJECT */}
                <div
                  style={{
                    width: "470px",
                    padding: "6px 10px",
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
    rows={2}
  />

) : (

  m.subject || ""

)}
                </div>

                {/* OBJECTIVE */}
                <div
                  style={{
                    width: "70px",
                    textAlign: "center",
                    paddingTop: "6px",
                    fontWeight: "bold",
                  }}
                >
                  {m.objective}
                </div>

                {/* PRACTICAL */}
                <div
                  style={{
                    width: "70px",
                    textAlign: "center",
                    paddingTop: "6px",
                    fontWeight: "bold",
                  }}
                >
                  {m.practical}
                </div>

                {/* TOTAL */}
                <div
                  style={{
                    width: "70px",
                    textAlign: "center",
                    paddingTop: "6px",
                    fontWeight: "bold",
                  }}
                >
                  {m.total}
                </div>

              </div>
            ))

          ) : (

            marksArray.slice(0, 1).map((m, index) => (

              <div
                key={index}
                style={{
                  display: "flex",
                  minHeight: "180px",
                  height: "auto",
                }}
              >

                {/* SUBJECT */}
                <div
                  style={{
                    width: "470px",
                    padding: "6px 10px",
                    fontSize: "15px",
                    lineHeight: "1.7",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >

{editingSubjects ? (

  <textarea
    value={marksArray
      .map((s) =>
        (s.subject || "")
          .replace(/\\n/g, "\n")
      )
      .join("\n")
    }
    onChange={(e) => {

      const lines = e.target.value
        .split("\n");

      setMarksArray((prev) => {

        return prev.map((item, index) => ({
          ...item,
          subject: lines[index] ?? "",
        }));

      });

    }}
    className="border border-gray-400 px-2 py-2 w-full bg-white text-black rounded"
    rows={7}
  />

) : (

(m.subject || "")
  .replace(/\\n/g, "\n")
  .split("\n")
  .filter(
    (line) =>
      line.trim() !== ""
  )
  .map((line, j) => (

    <div
      key={j}
      style={{
        marginBottom: "8px",
      }}
    >
      {line.trim()}
    </div>

  ))

)}

                </div>

                {/* OBJECTIVE */}
                <div
                  style={{
                    width: "70px",
                    textAlign: "center",
                    paddingTop: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {m.objective}
                </div>

                {/* PRACTICAL */}
                <div
                  style={{
                    width: "70px",
                    textAlign: "center",
                    paddingTop: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {m.practical}
                </div>

              </div>
            ))

          )}

        </div>

        {/* TOTAL */}
        <div
          className="absolute font-bold"
          style={{
            top:
              student?.courseType?.toLowerCase() === "multiple"
                ? 570 + marksArray.length * 45
                : 890,
            left: 775
          }}
        >
          {total}
        </div>

        {/* GRADE */}
        {/* <div
          className="absolute font-bold"
          style={{
            top: 572,
            left: 780
          }}
        >
          {getGrade()}
        </div> */}


    <div
          className="absolute font-bold"
          style={{
            top:
              student?.courseType?.toLowerCase() === "multiple"
                ? 570 + marksArray.length * 45
                :  572,
            left: 780
          }}
        >
          {total}
        </div>
        {/* SIGNATURE */}
        {franchiseSign && (
          <img
            src={franchiseSign + "&mode=admin"}
            crossOrigin="anonymous"
            className="absolute bottom-[94px] left-[125px] w-[100px]"
          />
        )}

        {/* OWNER */}
        {student.ownerName && (
          <div className="absolute bottom-[60px] left-[100px] text-sm text-center">
            <div className="font-semibold">
              {student.ownerName}
            </div>

            <div className="text-xs text-gray-600">
              Controller Of Examination
            </div>
          </div>
        )}

      </div>
    </div>
  );
}