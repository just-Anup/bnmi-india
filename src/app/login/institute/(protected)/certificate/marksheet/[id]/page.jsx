"use client";

import { useEffect, useState, useRef } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";
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

      if (studentData?.courseType === "multiple") {

        const res = await databases.listDocuments(
          DATABASE_ID,
          "student_subject_results",
          [Query.equal("studentId", studentId)]
        );

        const docs = res.documents || [];

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

        const resultRes = await databases.listDocuments(
          DATABASE_ID,
          "student_subject_results",
          [Query.equal("studentId", studentId)]
        );

        let subjectList = [];

        if (resultRes.documents.length > 0) {

          subjectList =
            resultRes.documents[0].subjects
              ?.split(",")
              .map((s) => s.trim()) || [];
        }

        const marksRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_subject_marks",
          [Query.equal("studentId", studentId)]
        );

        let marksDocs = marksRes.documents || [];

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
          src="/beautymark.jpeg"
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
            className="absolute bottom-[123px] right-[200px] w-[80px] bg-white p-1"
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
          {student.surname}
        </div>

        <div className="absolute top-[388px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[410px] left-[330px]">
          {student.course}
        </div>

        <div className="absolute top-[449px] left-[330px] font-bold text-lg">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}
        {/* <div className="absolute top-[330px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration || "1 Year"}
        </div> */}

        <div className="absolute top-[348px] left-[680px] text-[15px]">
          {student.marksheetNo},
        </div>

        <div className="absolute top-[369px] left-[680px] text-[15px]">
          {student.dob
            ? new Date(student.dob)
                .toLocaleDateString("en-GB")
                .replace(/\//g, "-")
            : ""}
        </div>

        <div className="absolute top-[392px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration || "1 Year"}
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
                  {index + 1}) {m.subject}
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

                  {marksArray.map((s, i) => (

                    <div
                      key={i}
                      style={{
                        marginBottom: "8px",
                      }}
                    >
                      {i + 1}. {s.subject}
                    </div>

                  ))}

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
        <div
          className="absolute font-bold"
          style={{
            top: 572,
            left: 780
          }}
        >
          {getGrade()}
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