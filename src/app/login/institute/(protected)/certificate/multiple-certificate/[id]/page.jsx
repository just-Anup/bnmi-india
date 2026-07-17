"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import QRCode from "qrcode"; // ✅ ADDED
import { databases, account } from "@/lib/appwrite";
import * as htmlToImage from "html-to-image";
import { useRef } from "react";
import { Query } from "appwrite";
import { useParams } from "next/navigation";

const BUCKET_ID = "6986e8a4001925504f6b";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintCertificate() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [certificateNo, setCertificateNo] = useState("");
const [percentage, setPercentage] = useState(0);
const [editMode, setEditMode] = useState(false);
const [isAdmin, setIsAdmin] = useState(false);
const [loadingUser, setLoadingUser] = useState(true);

  const printRef = useRef();
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
      const studentData = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "student_admissions",
        cert.studentId
      );

      // ✅ FRANCHISE
      let franchiseData = null;

      try {

        const franchiseRes =
          await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            "franchise_approved",
            [
              Query.equal(
                "email",
                studentData.franchiseEmail
              )
            ]
          );

        if (franchiseRes.documents.length > 0) {

          franchiseData =
            franchiseRes.documents[0];
        }

      } catch (err) {

        console.log(
          "FRANCHISE ERROR:",
          err
        );

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

        ...studentData,
        ...cert,

       studentName:
  cert.studentName ||
  studentData.studentName ||
  "",

fatherName:
  cert.fatherName ||
  studentData.fatherName ||
  "",

motherName:
  cert.motherName ||
  studentData.motherName ||
  "",

        course:
          cert.course ||
          studentData.courseName ||
          "",

        duration:
          cert.duration ||
          studentData.duration ||
          studentData.courseDuration ||
          "",

          coursePeriod:
  cert.coursePeriod || "",

        grade:
          cert.grade || "",

        marks:
          cert.marks || "",

        instituteName:
          cert.instituteName ||
          studentData.instituteName ||
          "",

        city:
          cert.city ||
          franchiseData?.city ||
          franchiseData?.address ||
          "",

        qrCode:
          qrCodeImage || "",

        verifyUrl,

        certificateNo:
          cert.certificateNo || "",

        issueDate:
          formattedIssueDate || "",

     logo:
  franchiseData?.logo ||
  cert.logo ||
  "",

        ownerName:
          cert.ownerName ||
          franchiseData?.ownerName ||
          franchiseData?.owner ||
          franchiseData?.name ||
          "Controller",

         franchiseSignature:
  franchiseData?.signature ||
  franchiseData?.franchiseSignature ||
  cert.franchiseSignature ||
  "",


        photoId:
          studentData.photoId || "",

        signatureId:
          studentData.signatureId || "",

        relationType:
          studentData.relationType ||
          "S/O",

        showFatherInCertificate:
          String(
            studentData.showFatherInCertificate
          ).toLowerCase() === "true",

        showMotherInCertificate:
          String(
            studentData.showMotherInCertificate
          ).toLowerCase() === "true"
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
  

  useEffect(() => {
  const fetchMarks = async () => {
    try {
      if (!student?.studentId) return; // ✅ VERY IMPORTANT

      const res = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "student_subject_results",
        [Query.equal("studentId", student.studentId)]
      );

      if (res.documents.length === 0) {
        setPercentage(0);
        return;
      }

      const total = res.documents.reduce(
        (sum, m) => sum + Number(m.total || 0),
        0
      );

      const percent = (
        (total / (res.documents.length * 100)) * 100
      ).toFixed(2);

      console.log("CERT PERCENT:", percent); // 🔥 DEBUG

      setPercentage(percent);

    } catch (err) {
      console.log("PERCENT ERROR:", err);
    }
  };

  fetchMarks();
}, [student]);


useEffect(() => {

  const checkAdmin = async () => {

    try {

      const user = await account.get();

      if (user.email === "bnmiindia@gmail.com") {
        setIsAdmin(true);
      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoadingUser(false);

    }
  };

  checkAdmin();

}, []);

const saveCertificate = async () => {
  try {

    // -------------------------
    // 1. UPDATE CERTIFICATE
    // -------------------------

    await databases.updateDocument(
      DATABASE_ID,
      "certificates",
      id,
      {
        studentName: student.studentName,
        relationType: student.relationType,

        fatherName: student.fatherName,
        motherName: student.motherName,

        showFatherInCertificate:
          student.showFatherInCertificate,

        showMotherInCertificate:
          student.showMotherInCertificate,

        course: student.course,

        duration: student.duration,

        coursePeriod: student.coursePeriod,

        instituteName: student.instituteName,

        city: student.city,

        issueDate: student.issueDate,

        grade: student.grade,

        marks: student.marks,
      }
    );



    // -------------------------
    // 2. UPDATE STUDENT
    // -------------------------

    await databases.updateDocument(
      DATABASE_ID,
      "student_admissions",
      student.studentId,
      {

        studentName: student.studentName,

        relationType: student.relationType,

        fatherName: student.fatherName,

        motherName: student.motherName,

        showFatherInCertificate:
          student.showFatherInCertificate,

        showMotherInCertificate:
          student.showMotherInCertificate,

        courseName: student.course,

        duration: student.duration,

        coursePeriod: student.coursePeriod,

        instituteName: student.instituteName,

      }
    );



    // -------------------------
    // 3. UPDATE EXAM RESULT
    // -------------------------

    const exam = await databases.listDocuments(
      DATABASE_ID,
      "exam_results",
      [
        Query.equal("studentId", student.studentId)
      ]
    );

    await Promise.all(

      exam.documents.map((doc)=>

        databases.updateDocument(

          DATABASE_ID,

          "exam_results",

          doc.$id,

          {

            studentName: student.studentName,

            relationType: student.relationType,

            fatherName: student.fatherName,

            motherName: student.motherName,

            courseName: student.course,

            duration: student.duration,

            coursePeriod: student.coursePeriod,

            instituteName: student.instituteName,

          }

        )

      )

    );



    // -------------------------
    // 4. UPDATE SUBJECT RESULT
    // -------------------------

    const subject = await databases.listDocuments(
      DATABASE_ID,
      "student_subject_results",
      [
        Query.equal("studentId", student.studentId)
      ]
    );

    await Promise.all(

      subject.documents.map((doc)=>

        databases.updateDocument(

          DATABASE_ID,
          "student_subject_results",

          doc.$id,

          {

            studentName: student.studentName,

            fatherName: student.fatherName,

            motherName: student.motherName,

            course: student.course,

            instituteName: student.instituteName,

          }

        )

      )

    );



    alert("Updated Successfully");

  }

  catch(err){

    console.log(err);

    alert(err.message);

  }

};


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

  
  const toBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const handleDownload = async () => {
    try {
      const node = printRef.current;


      // ✅ convert images before capture
      const images = node.querySelectorAll("img");

      for (let img of images) {
        const src = img.src;

        if (!src.startsWith("data:")) {
          try {
            const base64 = await toBase64(src);
            img.src = base64;
          } catch (err) {
            console.log("IMAGE CONVERT ERROR:", err);
          }
        }
      }

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,

        // 🔥 FIX CUT ISSUE
        width: node.scrollWidth,
        height: node.scrollHeight,

        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          overflow: "visible"
        }
      });
      const link = document.createElement("a");
      link.download = `${student.studentName}_certificate.png`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.log("DOWNLOAD ERROR:", err);
    }
  };


  const printPage = () => window.print();




  const getGrade = (percent) => {
  const p = Number(percent);

  if (p >= 85) return "A+";
  if (p >= 70) return "A";
  if (p >= 55) return "B";
  if (p >= 40) return "C";

  return "F";
};

const grade = getGrade(percentage);

  return (

    <div className="p-10">

      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6 ml-4"
      >
        Download Certificate
      </button>

{/* EDIT BUTTON */}
{isAdmin && (

<div className="mb-6 flex gap-4">

  <button
    onClick={() => setEditMode(!editMode)}
    className="bg-blue-600 text-white px-5 py-2 rounded"
  >
    {editMode ? "Close Edit" : "Edit Certificate"}
  </button>

  <button
  onClick={saveCertificate}
  className="bg-green-600 text-white px-5 py-2 rounded"
>
  Save Changes
</button>

</div>

)}

{/* EDIT PANEL */}
{editMode && isAdmin && (

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
    <select
  value={student.relationType || "S/O"}
  onChange={(e) =>
    handleChange("relationType", e.target.value)
  }
  className="border p-3 rounded"
>
  <option value="S/O">S/O</option>
  <option value="D/O">D/O</option>
  <option value="W/O">W/O</option>
</select>

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
      placeholder="Course Period"
      className="border p-3 rounded"
    />

<input
  type="text"
  value={student.coursePeriod || ""}
  onChange={(e) =>
    handleChange("coursePeriod", e.target.value)
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
        style={{
          width: "900px",
          height: "1200px",
          position: "relative",
          overflow: "visible"
        }}
      >

        {/* TEMPLATE */}
        <img src="/certificate.png" className="absolute w-full h-full" />

        {/* LOGO */}
      {student.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={student.logo}
      className="w-full h-full object-cover rounded-full"
    />
  </div>

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

{/* COURSE PERIOD */}
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
        <div className="absolute top-[770px] left-[535px] font-bold text-2xl">
  {grade}
</div>

        {/* MARKS */}
        <div className="absolute top-[770px] left-[660px] font-bold text-2xl">
          {percentage}%
        </div>

        {/* ✅ QR (NOW WORKING WITH WEBSITE) */}
        {student.qrCode && (
          <img
            src={student.qrCode}
            className="absolute top-[300px] right-[100px] w-[120px]"
          />
        )}

        {/* CERT NO + DATE */}
        <div className="absolute bottom-[110px] left-[340px] font-semibold">

          <div>Certificate No : {certificateNo}</div>

          <div className="mt-1">
            Date Of Issue : {student.issueDate || "N/A"}
          </div>

        </div>

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

        {/* OWNER NAME */}
        {student.ownerName && (
          <div className="absolute bottom-[60px] left-[80px] text-sm text-center">

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