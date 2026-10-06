"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import * as htmlToImage from "html-to-image";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintHallTicket() {

  const [students, setStudents] = useState([]);
  const [exam, setExam] = useState(null);
  const [franchise, setFranchise] = useState(null);

  const printRef = useRef();

  useEffect(() => {

    const s = localStorage.getItem("hallticketStudents");
    const e = localStorage.getItem("hallticketExam");
    const f = localStorage.getItem("hallticketFranchise");

    if (s) setStudents(JSON.parse(s));
    if (e) setExam(JSON.parse(e));
    if (f) setFranchise(JSON.parse(f));

  }, []);


  const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year.slice(-2)}`;
  };
  const printPage = () => {
    window.print();
  };

  // ✅ IMAGE TO BASE64
  const toBase64 = async (url) => {

    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {

      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);

      reader.readAsDataURL(blob);

    });

  };

  // ✅ DOWNLOAD
  const handleDownload = async () => {

    try {

      const node = printRef.current;

      const images = node.querySelectorAll("img");

      for (let img of images) {

        const src = img.src;

        if (!src.startsWith("data:")) {

          try {

            const base64 = await toBase64(src);

            img.src = base64;

          } catch (err) {
            console.log(err);
          }

        }

      }

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      const link = document.createElement("a");

      link.download = `hall-ticket.png`;

      link.href = dataUrl;

      link.click();

    } catch (err) {

      console.log("DOWNLOAD ERROR:", err);

    }

  };

  if (!exam) {
    return (
      <div className="p-10 bg-black text-white min-h-screen">
        Loading...
      </div>
    );
  }

  return (

    <div className="p-6 bg-black min-h-screen text-white">

      <div className="flex gap-4 mb-6">

        <button
          onClick={printPage}
          className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 rounded"
        >
          Print Hall Ticket
        </button>

        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded"
        >
          Download Hall Ticket
        </button>

      </div>

      <div ref={printRef}>

        {students.map((student, index) => {

          // ✅ PHOTO
          const photoUrl = student.photoId
            ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
            : null;

          const signatureUrl = student.signatureId
            ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
            : null;

          const franchiseSign = franchise?.signature || null;

          return (

            <div
              key={index}
              className="relative w-[800px] h-[1100px] mb-10 bg-white text-black"
            >

              {/* BACKGROUND TEMPLATE */}
              <img
                src="/hall.png"
                className="absolute top-0 left-0 w-full h-full"
              />

              {/* QR CODE */}
              <div className="absolute bottom-[160px] left-[100px] bg-white p-2">
                <QRCode
                  value={`${window.location.origin}/verify-student/${student.$id}`}
                  size={90}
                />
              </div>

              {/* FRANCHISE LOGO */}
              {franchise?.logo && (
                <div className="absolute top-[5px] left-[350px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
                  <img
                    src={franchise.logo}
                    className="w-full h-full object-cover rounded-full"
                    alt="Institute Logo"
                  />
                </div>
              )}

              {/* FRANCHISE NAME */}
              <div className="absolute top-[140px] w-full text-center text-2xl font-bold text-red-700">
                {franchise?.instituteName || ""}
              </div>

              {/* PHOTO */}
              {photoUrl && (
                <img
                  src={photoUrl}
                  className="absolute top-[270px] left-[86px] w-[120px] h-[120px] object-cover"
                />
              )}

              {/* COURSE NAME */}
              <div className="absolute top-[279px] left-[310px] font-semibold text-xs">
                {student.courseName}
              </div>

              {/* COURSE DURATION */}
              <div className="absolute top-[300px] left-[330px]">
                {exam.duration || student.duration || "N/A"}
              </div>

              {/* STUDENT NAME */}
              <div className="absolute top-[415px] left-[190px]">
                {student.studentName}
              </div>
              {/* ROLL NUMBER */}

              <div className="absolute top-[365px] right-[120px] text-lg font-semibold">
                Roll No: {student.rollNumber || ""}
              </div>

              {/* FATHER NAME */}
              <div className="absolute top-[460px] left-[240px]">
                {student.fatherName}
              </div>

              {/* SURNAME */}
              <div className="absolute top-[504px] left-[160px]">
                {student.surname}
              </div>

              {/* MOTHER NAME */}
              <div className="absolute top-[546px] left-[180px]">
                {student.motherName}
              </div>

              {/* USERNAME */}
              <div className="absolute top-[345px] left-[350px]">
                {student.studentName}
              </div>

              {/* PASSWORD */}
              <div className="absolute top-[370px] left-[350px]">
                {student.password}
              </div>

              {/* EXAM DATE */}
              <div className="absolute top-[415px] left-[470px]">
                {formatDate(exam.examDate)}
              </div>

              {/* EXAM TIME */}
              <div className="absolute top-[460px] left-[490px]">
                {exam.startTime} - {exam.endTime}
              </div>

              {/* DURATION */}
              <div className="absolute top-[502px] left-[510px]">
                {exam.duration || student.duration || "N/A"}
              </div>

              {/* REPORTING TIME */}
              <div className="absolute top-[545px] left-[500px]">
                {exam.reportingTime}
              </div>

              {/* CENTER ADDRESS */}
              <div className="absolute top-[585px] left-[390px] w-[300px] text-sm">
                {franchise?.address || ""}
                <br />
                {franchise?.city || ""}, {franchise?.state || ""}
              </div>

              {/* STUDENT SIGNATURE */}
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  className="absolute bottom-[280px] left-[490px] w-[140px] h-[60px] object-contain border"
                />
              ) : (
                <div className="absolute bottom-[250px] left-[120px] text-red-500">
                  No Signature
                </div>
              )}

              {/* FRANCHISE SIGNATURE */}
              {franchiseSign && (
                <img
                  src={franchiseSign}
                  className="absolute bottom-[280px] right-[500px] w-[160px] h-[60px] object-contain"
                />
              )}

              {/* EXTRA SIGNATURE */}
              {franchiseSign && (
                <div className="absolute bottom-[120px] right-[70px] w-[120px] h-[60px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
                  <img
                    src={franchiseSign} className="w-full h-full object-cover "

                  />
                </div>
              )}

              {/* FRANCHISE OWNER NAME */}
              <div className="absolute bottom-[100px] right-[95px] text-sm font-semibold text-center">
                {franchise?.name || ""}
              </div>

              {/* FRANCHISE EMAIL */}
              <div className="absolute bottom-[70px] w-full text-center text-sm">
                Email: {franchise?.email || ""}
              </div>

              {/* FRANCHISE ADDRESS */}
              <div className="absolute bottom-[90px] w-full text-center text-sm">
                {franchise?.address || ""}, {franchise?.city || ""}, {franchise?.state || ""}
              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}