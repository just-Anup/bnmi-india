"use client";

import { useEffect, useState, useRef } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const ADMISSION_COLLECTION = "student_admissions";
const CERTIFICATE_COLLECTION = "certificates";

const RESULT_COLLECTION = "exam_results";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintMarksheetSemester() {
  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  const printRef = useRef();

  // =========================================================
  // LOAD ONLY IDENTIFIERS FROM LOCAL STORAGE
  // =========================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = localStorage.getItem("marksheetStudent");

        if (!stored) {
          console.error("marksheetStudent not found");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);

        const studentId = parsed.studentId;

        const semesterNumber = Number(
          parsed.selectedSemester ??
          parsed.semesterNumber ??
          1
        );

        if (!studentId) {
          console.error("Student ID missing");
          setLoading(false);
          return;
        }

        await loadAllData(studentId, semesterNumber);

      } catch (error) {
        console.error("LOAD MARKSHEET ERROR:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================================================
  // FETCH EVERYTHING FROM APPWRITE
  // =========================================================
  const loadAllData = async (studentId, semesterNumber) => {
    try {
      // =====================================================
      // 1. STUDENT ADMISSION
      // =====================================================

      const admission = await databases.getDocument(
        DATABASE_ID,
        ADMISSION_COLLECTION,
        studentId
      );

      // =====================================================
      // 2. CERTIFICATE
      // =====================================================

      const certificateRes =
        await databases.listDocuments(
          DATABASE_ID,
          CERTIFICATE_COLLECTION,
          [
            Query.equal(
              "studentId",
              studentId
            ),
            Query.limit(1)
          ]
        );

      const certificate =
        certificateRes.documents.length > 0
          ? certificateRes.documents[0]
          : null;

      setCertificateData(certificate);

      // =====================================================
      // 3. COURSE
      // =====================================================

    // =====================================================
// 3. COURSE
// =====================================================
// Course information is already available from
// admission/certificate, so no separate course
// collection is required here.

const course = null;

setCourseData(null);

      // =====================================================
      // 4. SEMESTER RESULT
      // =====================================================

      const resultRes =
        await databases.listDocuments(
          DATABASE_ID,
          RESULT_COLLECTION,
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
            ),

            Query.limit(1)
          ]
        );

      if (resultRes.documents.length === 0) {

        console.error(
          "No approved result found for semester:",
          semesterNumber
        );

        setLoading(false);
        return;
      }

      const result = resultRes.documents[0];

      setResultData(result);

      // =====================================================
// GET FRANCHISE DETAILS - SAME AS MULTIPLE MARKSHEET
// =====================================================

let franchise = null;

try {
  const franchiseEmail =
    certificate?.franchiseEmail ||
    admission?.franchiseEmail;

  if (franchiseEmail) {
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [
        Query.equal("email", franchiseEmail),
        Query.limit(1)
      ]
    );

    if (franchiseRes.documents.length > 0) {
      franchise = franchiseRes.documents[0];
    }
  }
} catch (err) {
  console.log("FRANCHISE LOOKUP ERROR:", err);
}


      // =====================================================
      // 5. SUBJECT MARKS
      // =====================================================

      let subjects = [];

      if (typeof result.marksArray === "string") {

        try {
          subjects = JSON.parse(
            result.marksArray || "[]"
          );
        } catch (error) {

          console.error(
            "marksArray JSON ERROR:",
            error
          );

          subjects = [];
        }

      } else if (Array.isArray(result.marksArray)) {

        subjects = result.marksArray;

      }

      const finalMarks =
        subjects.map((s) => ({
          subject: s.subject || "",

          objective:
            Number(s.objective || 0),

          practical:
            Number(s.practical || 0),

          total:
            Number(
              s.total ??
              (
                Number(s.objective || 0) +
                Number(s.practical || 0)
              )
            ),

          semester:
            Number(
              result.semesterNumber
            )
        }));

      setMarksArray(finalMarks);

      // =====================================================
      // 6. BUILD FINAL STUDENT DATA
      // =====================================================

      const finalStudent = {

        // -----------------------------
        // Admission details
        // -----------------------------

        studentId:
          admission.$id,

        studentName:
          admission.studentName || "",

        fatherName:
          admission.fatherName || "",

        surname:
          admission.surname || "",

        motherName:
          admission.motherName || "",

        dob:
          admission.dob || "",

        course:
          admission.course ||
          admission.courseName ||
          "",

        courseCode:
          admission.courseCode || "",

        instituteName:
          admission.instituteName || "",

        // -----------------------------
        // Semester
        // -----------------------------

        semesterNumber:
          Number(semesterNumber),

        // -----------------------------
        // Result
        // -----------------------------

        percentage:
          Number(result.percentage || 0),

        grade:
          result.grade || "",

        marksheetNo:
          result.marksheetNo ||
          certificate?.marksheetNo ||
          certificate?.certificateNo ||
          "",

        // -----------------------------
        // Certificate details
        // -----------------------------

        certificateNo:
          certificate?.certificateNo || "",

      coursePeriod:
  certificate?.coursePeriod ||
  certificate?.duration ||
  admission.coursePeriod ||
  admission.duration ||
  "",


        logo:
          certificate?.logo ||
          admission.logo ||
          "",
franchiseSignature:
  franchise?.signature ||
  franchise?.franchiseSignature ||
  certificate?.franchiseSignature ||
  admission?.franchiseSignature ||
  admission?.signature ||
  "",

     ownerName:
  certificate?.ownerName ||
  franchise?.ownerName ||
  franchise?.owner ||
  franchise?.name ||
  admission?.ownerName ||
  admission?.franchiseOwnerName ||
  "",
        city:
          certificate?.city ||
          admission.city ||
          ""
      };

      setStudent(finalStudent);

      setLoading(false);

    } catch (error) {

      console.error(
        "FETCH MARKSHEET DATA ERROR:",
        error
      );

      setLoading(false);
    }
  };

  // =========================================================
  // QR CODE
  // =========================================================

  useEffect(() => {

    const generateQR = async () => {

      if (!student?.studentId) return;

      const verifyUrl =
        `https://www.bnmiindia.org/beauty-verification/${student.studentId}?semester=${student.semesterNumber}`;

      try {

        const qr =
          await QRCode.toDataURL(
            verifyUrl,
            {
              width: 300,
              margin: 1
            }
          );

        setQrCode(qr);

      } catch (error) {

        console.error(
          "QR ERROR:",
          error
        );
      }
    };

    generateQR();

  }, [
    student?.studentId,
    student?.semesterNumber
  ]);

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = async () => {

    try {

      const node =
        printRef.current;

      if (!node) return;

      const images =
        node.querySelectorAll("img");

      await Promise.all(

        Array.from(images).map(
          (img) => {

            if (img.complete) {
              return Promise.resolve();
            }

            return new Promise(
              (resolve) => {

                img.onload = resolve;
                img.onerror = resolve;

              }
            );
          }
        )
      );

      const dataUrl =
        await htmlToImage.toPng(
          node,
          {
            cacheBust: true,
            pixelRatio: 4,
            backgroundColor: "#ffffff",

            imagePlaceholder:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WvJr3QAAAAASUVORK5CYII="
          }
        );

      const link =
        document.createElement("a");

      link.download =
        `${student.studentName}_Semester_${student.semesterNumber}_Marksheet.png`;

      link.href = dataUrl;

      link.click();

    } catch (error) {

      console.error(
        "DOWNLOAD ERROR:",
        error
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black text-lg font-semibold">
          Loading marksheet...
        </div>
      </div>
    );
  }

  if (!student) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-red-600 font-semibold">
          Unable to load marksheet.
        </div>
      </div>
    );
  }

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const total =
    marksArray.reduce(
      (sum, m) =>
        sum + Number(m.total || 0),
      0
    );

  const percentage =
    Number(student.percentage || 0);

  const objectiveTotal =
    marksArray.reduce(
      (sum, m) =>
        sum + Number(m.objective || 0),
      0
    );

  const practicalTotal =
    marksArray.reduce(
      (sum, m) =>
        sum + Number(m.practical || 0),
      0
    );

  const objectiveOutOf =
    marksArray.length * 50;

  const practicalOutOf =
    marksArray.length * 50;

  const totalOutOf =
    marksArray.length * 100;

  // =========================================================
  // DISPLAY
  // =========================================================

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

        {/* =================================================
            TEMPLATE
        ================================================= */}

        <img
          src="/multiplemarksheet.png"
          className="absolute w-full h-full"
        />

        {/* =================================================
            LOGO
        ================================================= */}

        {student.logo && (

          <div
            className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md"
          >

            <img
              src={student.logo}
              className="w-full h-full object-cover rounded-full"
            />

          </div>

        )}

        {/* =================================================
            STUDENT DETAILS
        ================================================= */}

        <div className="absolute top-[310px] left-[330px]">
          {student.studentName}
        </div>

        <div className="absolute top-[330px] left-[330px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[352px] left-[330px]">
          {student.surname}
        </div>

        <div className="absolute top-[374px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[395px] left-[330px] font-bold">
          {student.course}
        </div>

        <div className="absolute top-[417px] left-[330px] font-bold">
          {student.instituteName}
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="absolute top-[334px] left-[680px]">
          {student.marksheetNo ||
            student.certificateNo}
        </div>

        <div className="absolute top-[355px] left-[680px]">

          {student.dob
            ? new Date(student.dob)
                .toLocaleDateString("en-GB")
                .replace(/\//g, "-")
            : ""}

        </div>

        {/* COURSE PERIOD FROM DATABASE */}

        <div className="absolute top-[378px] left-[680px] text-[13px]">

          {student.coursePeriod || "N/A"}

        </div>

        {/* =================================================
            SEMESTER
        ================================================= */}

        {/* <div className="absolute top-[400px] left-[680px] text-[13px]">

          Semester {student.semesterNumber}

        </div> */}

        {/* =================================================
            SUBJECT TABLE
        ================================================= */}

        <div
          style={{
            position: "absolute",
            top: 540,
            left: 150,
            width: "650px",
            display: "flex",
            flexDirection: "column",
            gap: "7px"
          }}
        >

          {marksArray.map(
            (m, index) => (

              <div
                key={index}
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "280px 60px 60px 60px 60px 70px 70px",

                  alignItems: "start",

                  minHeight: "20px"
                }}
              >

                {/* SUBJECT */}

                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: "15px",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    paddingRight: "10px"
                  }}
                >

                  {index + 1}) {m.subject}

                </div>

                {/* OBJECTIVE OUT OF */}

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                >
                  50
                </div>

                {/* OBJECTIVE SCORE */}

                <div
                  style={{
                    textAlign: "center"
                  }}
                >
                  {m.objective}
                </div>

                {/* PRACTICAL OUT OF */}

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                >
                  50
                </div>

                {/* PRACTICAL SCORE */}

                <div
                  style={{
                    textAlign: "center"
                  }}
                >
                  {m.practical}
                </div>

                {/* TOTAL OUT OF */}

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                >
                  100
                </div>

                {/* TOTAL SCORE */}

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                >
                  {
                    Number(m.objective) +
                    Number(m.practical)
                  }
                </div>

              </div>

            )
          )}

        </div>

        {/* =================================================
            TOTAL
        ================================================= */}

        <div
          style={{
            position: "absolute",
            top: 867,
            left: 150,
            width: "650px",
            display: "grid",
            gridTemplateColumns:
              "280px 60px 60px 60px 60px 70px 70px",
            fontWeight: "bold",
            fontSize: "18px"
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

        {/* =================================================
            PERCENTAGE
        ================================================= */}

        <div className="absolute bottom-[260px] left-[350px] font-bold">

          Percentage: {percentage}%

        </div>

        {/* =================================================
            GRADE
        ================================================= */}

        <div className="absolute bottom-[260px] left-[250px] font-bold">

          Grade: {student.grade}

        </div>

        {/* =================================================
            TOTAL
        ================================================= */}

        <div className="absolute bottom-[260px] left-[600px] font-bold">

          Total: {total}/{totalOutOf}

        </div>

        {/* =================================================
            SIGNATURE
        ================================================= */}

   {/* =================================================
    FRANCHISE SIGNATURE
================================================= */}

{student?.franchiseSignature && (
  <img
    id="sign-img"
    src={student.franchiseSignature + "&mode=admin"}
    crossOrigin="anonymous"
    loading="eager"
    decoding="sync"
    className="absolute bottom-[95px] left-[100px] w-[100px]"
    alt="Franchise Signature"
  />
)}

        {/* =================================================
            OWNER NAME
        ================================================= */}

        {student.ownerName && (

          <div className="absolute bottom-[60px] left-[100px] text-sm">

            <div className="font-semibold">
              {student.ownerName}
            </div>

            <div className="text-xs text-gray-600 font-bold">
              Controller Of Examination
            </div>

          </div>

        )}

        {/* =================================================
            QR
        ================================================= */}

        {qrCode && (

          <img
            src={qrCode}
            className="absolute top-[240px] right-[80px] w-[90px] bg-white p-1"
          />

        )}

      </div>
    </div>
  );
}