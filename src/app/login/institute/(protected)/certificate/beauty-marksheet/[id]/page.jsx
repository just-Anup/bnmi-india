"use client";

import { useEffect, useState, useRef } from "react";
import { databases, ID, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";
import * as htmlToImage from "html-to-image";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");

  const printRef = useRef();

  // ✅ LOAD STUDENT
  useEffect(() => {

    const data = localStorage.getItem("marksheetStudent");

    if (data) {
      const parsed = JSON.parse(data);
      setStudent(parsed);
      fetchMarks(parsed.studentId);
    }
  }, []);

  // ✅ LOAD IMAGES
  useEffect(() => {

    const loadImages = async () => {

      if (!student) return;

      try {

        if (student.logo) {
          const logoBase64 = await toBase64(student.logo);

          setStudent(prev => ({
            ...prev,
            logo: logoBase64
          }));
        }

        if (student.franchiseSignature) {

          const signBase64 = await toBase64(student.franchiseSignature);

          setStudent(prev => ({
            ...prev,
            franchiseSignature: signBase64
          }));
        }

      } catch (err) {
        console.log("IMAGE LOAD ERROR:", err);
      }
    };

    loadImages();

  }, [student?.studentId]);

  // ✅ QR
  useEffect(() => {

    const generateQR = async () => {

      try {

        if (!student?.studentId) return;

        const verifyUrl =
          `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

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
          parsedMarks = JSON.parse(resultDoc.marksArray);
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

  // ✅ DOWNLOAD
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

  // ✅ BASE64
  const toBase64 = async (url) => {

    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {

      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);

      reader.readAsDataURL(blob);
    });
  };

  if (!student) return <div className="p-10">Loading...</div>;

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  // ✅ DYNAMIC HEIGHT
  const dynamicHeight =
    1200 + marksArray.length * 120;

  return (

    <div className="p-10 bg-white">

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download Image
      </button>

      {/* MARKSHEET */}
      <div
        ref={printRef}
        style={{
          width: "900px",
          minHeight: `${dynamicHeight}px`,
          height: "auto",
          position: "relative",
          overflow: "visible",
          background: "#fff"
        }}
      >

        {/* BG */}
        <img
          src="/beautymark.png"
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

        {/* LEFT DETAILS */}
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

        <div className="absolute top-[450px] left-[330px]">
          {student.instituteName}
        </div>

        {/* RIGHT DETAILS */}
        <div className="absolute top-[330px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration || "1 Year"}
        </div>

        <div className="absolute top-[348px] left-[680px]">
          {student.marksheetNo}
        </div>

        <div className="absolute top-[369px] left-[680px]">
          {student.dob}
        </div>

        <div className="absolute top-[392px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration || "1 Year"}
        </div>

        {/* ✅ SUBJECT TABLE */}
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 135,
            width: "640px"
          }}
        >

          {marksArray.map((m, index) => (

            <div
              key={index}
              style={{
                display: "flex",
                minHeight: "120px",
                height: "auto",
                borderBottom: "2px solid black"
              }}
            >

              {/* SUBJECT */}
              <div
                style={{
                  width: "465px",
                  padding: "10px",
                  fontSize: "15px",
                  lineHeight: "1.7",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  borderRight: "2px solid black"
                }}
              >

                {m.subject
                  ?.split(/\d+\.\s/)
                  .filter(Boolean)
                  .map((sub, i) => (

                    <div
                      key={i}
                      style={{
                        marginBottom: "8px"
                      }}
                    >
                      {i + 1}. {sub.trim()}
                    </div>
                  ))}

              </div>

              {/* OBJECTIVE */}
              <div
                style={{
                  width: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingTop: "15px",
                  borderRight: "2px solid black",
                  fontWeight: "bold"
                }}
              >
                {m.objective}
              </div>

              {/* PRACTICAL */}
              <div
                style={{
                  width: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingTop: "15px",
                  borderRight: "2px solid black",
                  fontWeight: "bold"
                }}
              >
                {m.practical}
              </div>

              {/* GRADE */}
              <div
                style={{
                  width: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingTop: "15px",
                  fontWeight: "bold"
                }}
              >
                {student.grade}
              </div>

            </div>
          ))}

        </div>

        {/* TOTAL */}
        <div
          className="absolute font-bold"
          style={{
            top: 560 + marksArray.length * 120 + 25,
            left: 755
          }}
        >
          {total}.00%
        </div>

        {/* QR */}
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