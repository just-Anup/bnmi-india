"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState,useRef } from "react";
import QRCode from "qrcode";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useParams } from "next/navigation";
import * as htmlToImage from "html-to-image";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintCertificate() {

  const printRef = useRef(null);

  const [student, setStudent] = useState(null);
  const [certificateNo, setCertificateNo] = useState("");
const { id } = useParams();

const [editMode, setEditMode] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);
const [loadingUser, setLoadingUser] = useState(true);


useEffect(() => {

  if (!id) return;

  const loadCertificate = async () => {

    try {

      // ✅ CERTIFICATE
      const cert = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "certificates",
        id
      );

      // ✅ STUDENT
    let studentData = null;

const needStudentData =
  !cert.studentName ||
  !cert.fatherName ||
  !cert.motherName ||
  !cert.photoId ||
  !cert.signatureId ||
  !cert.relationType ||
  cert.showFatherInCertificate === undefined ||
  cert.showMotherInCertificate === undefined ||
  !cert.dob ||
  !cert.course ||
  !cert.duration ||
  !cert.coursePeriod ||
  !cert.surname;

if (needStudentData) {
  studentData = await databases.getDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    "student_admissions",
    cert.studentId
  );
}

      // ✅ FRANCHISE
   let franchiseData = null;

try {

  const needFranchiseData =
    !cert.logo ||
    !cert.ownerName ||
    !cert.franchiseSignature ||
    !cert.city;

  if (needFranchiseData) {

    const franchiseEmail =
      cert.franchiseEmail ||
      studentData?.franchiseEmail;

    if (franchiseEmail) {

      const franchiseRes =
        await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          "franchise_approved",
          [
            Query.equal("email", franchiseEmail)
          ]
        );

      if (franchiseRes.documents.length > 0) {
        franchiseData = franchiseRes.documents[0];
      }

    }

  }

} catch (err) {
  console.log("FRANCHISE ERROR:", err);
}

      
      // ✅ ISSUE DATE
      let formattedIssueDate = "";

      if (cert.issueDate) {

        if (
          cert.issueDate.includes("-") &&
          cert.issueDate.length <= 10
        ) {

          formattedIssueDate =
            cert.issueDate;

        } else {

          formattedIssueDate =
            new Date(cert.issueDate)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-");
        }
      }

      // ✅ VERIFY URL
      const verifyUrl =
  cert.verifyUrl ||
  `https://www.bnmiindia.org/beauty-verification/${cert.studentId}`;

      // ✅ QR
      let qrCodeImage =
        cert.qrCode || "";

      if (!qrCodeImage) {

        try {

          qrCodeImage =
            await QRCode.toDataURL(
              verifyUrl
            );

        } catch (err) {

          console.log(
            "QR ERROR:",
            err
          );

        }
      }

      // ✅ FINAL DATA
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

  relationType:
    cert.relationType ||
    studentData?.relationType ||
    "S/O",

  showFatherInCertificate:
    String(
      cert.showFatherInCertificate ??
      studentData?.showFatherInCertificate
    ).toLowerCase() === "true",

  showMotherInCertificate:
    String(
      cert.showMotherInCertificate ??
      studentData?.showMotherInCertificate
    ).toLowerCase() === "true",

  course:
    cert.course ||
    studentData?.courseDisplayName ||
    studentData?.courseName ||
    "",

  duration:
    cert.duration ||
    studentData?.courseDuration ||
    studentData?.duration ||
    "",

  coursePeriod:
    cert.coursePeriod ||
    studentData?.coursePeriod ||
    "",

  // ✅ Semester uses overall values
  marks:
    cert.overallPercentage ??
    cert.marks ??
    "",

  percentage:
    cert.overallPercentage ??
    cert.percentage ??
    "",

  grade:
    cert.overallGrade ||
    cert.grade ||
    "",

  overallPercentage:
    cert.overallPercentage ??
    "",

  overallGrade:
    cert.overallGrade ??
    "",

  dob:
    cert.dob ||
    studentData?.dob ||
    "",

  instituteName:
    cert.instituteName ||
    studentData?.instituteName ||
    "",

  certificateNo:
    cert.certificateNo ||
    "",

  marksheetNo:
    cert.marksheetNo ||
    cert.certificateNo ||
    "",

  issueDate:
    formattedIssueDate,

  logo:
    cert.logo ||
    franchiseData?.logo ||
    "",

  ownerName:
    cert.ownerName ||
    franchiseData?.ownerName ||
    franchiseData?.owner ||
    franchiseData?.name ||
    "",

  franchiseSignature:
    cert.franchiseSignature ||
    franchiseData?.signature ||
    "",

  city:
    cert.city ||
    franchiseData?.city ||
    franchiseData?.address ||
    "",

  photoId:
    cert.photoId ||
    studentData?.photoId ||
    "",

  signatureId:
    cert.signatureId ||
    studentData?.signatureId ||
    "",

  qrCode: qrCodeImage,

  verifyUrl
};

      setStudent(finalData);

      setCertificateNo(
        cert.certificateNo || ""
      );

    } catch (err) {

      console.log(err);

    }
  };

  loadCertificate();

}, [id]);

 

  if (!student) return <p className="p-10">Loading certificate...</p>;
    const handleChange = (field, value) => {
  setStudent((prev) => ({
    ...prev,
    [field]: value,
  }));
};

  // ✅ PHOTO
  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  // ✅ SIGNATURE
  const signatureUrl = student.signatureId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

 const franchiseSign =
  student.franchiseSignature ||
  student.signature ||
  null;

  // ✅ COURSE DURATION FUNCTION (FIXED)
 const getCourseDuration = (durationText) => {

  if (!durationText) return "N/A";

  const today = new Date();

  // ✅ END DATE = TODAY
  const end = new Date(today);

  // ✅ START DATE = TODAY
  const start = new Date(today);

  const text = durationText.toLowerCase();

  // ✅ YEAR
  if (text.includes("year")) {
    const years = parseInt(text) || 1;
    start.setFullYear(start.getFullYear() - years);
  }

  // ✅ MONTH
  if (text.includes("month")) {
    const months = parseInt(text) || 1;
    start.setMonth(start.getMonth() - months);
  }

  // ✅ ONE DAY FOR PERFECT RANGE
  start.setDate(start.getDate() + 1);

  const format = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return `${format(start)} To ${format(end)}`;
};
  const handleDownload = async () => {
  try {
    const node = printRef.current;

    if (!node) return;

    const rect = node.getBoundingClientRect();

    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 3,
      width: rect.width,
      height: rect.height,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = `${student.studentName}_certificate.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.log(err);
  }
};

  return (

    <div className="p-10">

    <button
    onClick={handleDownload}
    className="bg-green-600 text-white px-6 py-2 mb-6 rounded-lg"
>
    Download Certificate
</button>


      {/* EDIT BUTTON */}
<div className="mb-6 flex gap-4">

  <button
    onClick={() => setEditMode(!editMode)}
    className="bg-blue-600 text-white px-5 py-2 rounded"
  >
    {editMode ? "Close Edit" : "Edit Certificate"}
  </button>

</div>

{/* EDIT PANEL */}
{editMode && (

  <div className="bg-white shadow-lg rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">

    <input
      type="text"
      value={student.studentName || ""}
      onChange={(e) =>
        handleChange("studentName", e.target.value)
      }
      placeholder="Student Name"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.fatherName || ""}
      onChange={(e) =>
        handleChange("fatherName", e.target.value)
      }
      placeholder="Father Name"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.motherName || ""}
      onChange={(e) =>
        handleChange("motherName", e.target.value)
      }
      placeholder="Mother Name"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.course || ""}
      onChange={(e) =>
        handleChange("course", e.target.value)
      }
      placeholder="Course Name"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.duration || ""}
      onChange={(e) =>
        handleChange("duration", e.target.value)
      }
      placeholder="Course Duration"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.grade || ""}
      onChange={(e) =>
        handleChange("grade", e.target.value)
      }
      placeholder="Grade"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.marks || ""}
      onChange={(e) =>
        handleChange("marks", e.target.value)
      }
      placeholder="Marks"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.instituteName || ""}
      onChange={(e) =>
        handleChange("instituteName", e.target.value)
      }
      placeholder="Institute Name"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.city || ""}
      onChange={(e) =>
        handleChange("city", e.target.value)
      }
      placeholder="City"
      className="border p-3 rounded"
    />

    <input
      type="text"
      value={student.issueDate || ""}
      onChange={(e) =>
  handleChange("issueDate", e.target.value)
}
      placeholder="Issue Date"
      className="border p-3 rounded"
    />

  </div>

)}

      <div
    ref={printRef}
    className="relative w-[900px] h-[1200px] mx-auto bg-white"
>

        {/* TEMPLATE */}
        <img src="/certificate.png" className="absolute w-full h-full" />

        {/* LOGO */}
            {student?.logo && (
  <img
    src={student.logo}
    className="absolute top-[20px] left-[380px] w-[120px]"
  />
)}


        {/* PHOTO */}
        <div className="absolute top-[360px] left-[380px] w-[160px] h-[160px] overflow-hidden bg-white">
          {photoUrl && (
            <img src={photoUrl} className="w-full h-full object-cover" />
          )}
        </div>



   
{/* NAME */}
<div className="absolute top-[650px] left-[10px] w-full text-center">

  <div className="text-3xl font-bold flex items-center justify-center gap-3 flex-wrap">

    {/* STUDENT NAME */}
    <span>
      {student.studentName || student.name || ""}
    </span>

    {/* FATHER NAME */}
  {String(student.showFatherInCertificate).toLowerCase() === "true" && (
  <span className="text-3xl font-semibold">
    {student.relationType} {student.fatherName}
  </span>
)}

    {/* MOTHER NAME */}
 {String(student.showMotherInCertificate).toLowerCase() === "true" && (
  <span className="text-3xl font-semibold">
    {student.relationType} {student.motherName}
  </span>
)}

  </div>

</div>


        {/* COURSE */}
       <div
  className="absolute top-[827px] left-0 w-full px-16"
>
  <div
    className="text-center font-bold text-[18px] leading-tight"
    style={{
      wordBreak: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "normal",
    }}
  >
    {student.course || "N/A"}
  </div>
</div>

        {/* ✅ COURSE DURATION (FIXED) */}
      <div
  className="absolute top-[848px] left-0 w-full text-center font-semibold"
>
  Course Period: {student.duration || "N/A"}
</div>

{/* COURSE DURATION */}
<div
  className="absolute top-[870px] left-0 w-full text-center font-semibold"
>
  Course Duration: {student.coursePeriod || "N/A"}
</div>

        {/* GRADE */}
        <div className="absolute top-[770px] left-[550px] font-bold text-2xl">
          {student.grade}
        </div>

        {/* MARKS */}
        <div className="absolute top-[770px] left-[680px] font-bold text-2xl">
          {student.marks}%
        </div>

        {/* QR */}
        {student.qrCode && (
          <img
            src={student.qrCode}
            className="absolute top-[320px] right-[90px] w-[120px]"
          />
        )}

        {/* CERT NO + DATE */}
        <div className="absolute bottom-[110px] left-[340px] font-semibold">

          <div>Certificate No : {certificateNo}</div>

          <div className="mt-1">
          Date Of Issue : {student.issueDate || "N/A"}
          </div>

        </div>

        {/* INSTITUTE + CITY */}
        <div
  className="absolute bottom-[445px] left-[75px] w-[750px] text-center font-bold text-red-700"
  style={{
    fontSize: "25px",
    lineHeight: "32px",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
  }}
>
  ATC: {student.instituteName} |{" "}
  {[student.city].filter(Boolean).join(", ")}
</div>

        {/* SIGNATURE */}
        <div className="absolute top-[535px] left-[390px] w-[140px] h-[60px] bg-white flex items-center justify-center overflow-hidden">
          {signatureUrl && (
            <img
              src={signatureUrl}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* FRANCHISE SIGN */}
        {franchiseSign && (
          <img
            src={franchiseSign}
            className="absolute bottom-[100px] left-[100px] w-[100px]"
          />
        )}
        {/* ✅ OWNER NAME */}
{/* ✅ OWNER NAME */}
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