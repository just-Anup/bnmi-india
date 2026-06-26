"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "react-qr-code";
import * as htmlToImage from "html-to-image";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function IDCard() {

  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [franchise, setFranchise] = useState(null);

  const printRef = useRef();

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {

    try {

      const res = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      setStudent(res);

      // 🔥 FETCH FRANCHISE
      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", res.franchiseEmail)]
      );

      if (franchiseRes.documents.length > 0) {
        setFranchise(franchiseRes.documents[0]);
      }

    } catch (err) {
      console.log(err);
    }

  };

  // ✅ CONVERT IMAGE TO BASE64
  const toBase64 = async (url) => {

    const res = await fetch(url);

    const blob = await res.blob();

    return new Promise((resolve) => {

      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result);

      reader.readAsDataURL(blob);

    });

  };

  // ✅ DOWNLOAD FUNCTION
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

      link.download = `${student.studentName}_idcard.png`;

      link.href = dataUrl;

      link.click();

    } catch (err) {

      console.log("DOWNLOAD ERROR:", err);

    }

  };

  if (!student) return <div>Loading...</div>;

  return (

    <div className="flex flex-col items-center p-6 bg-black min-h-screen">

      {/* BUTTONS */}
      <div className="flex gap-4 mb-6">

        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Print ID Card
        </button>

        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download ID Card
        </button>

      </div>

      {/* ID CARD */}
      <div
        ref={printRef}
        className="relative w-[350px]"
      >

        {/* TEMPLATE */}
        <img src="/ID.png" className="w-full" />

        {/* FRANCHISE LOGO */}
      {franchise?.logo && (
  <div className="absolute top-[5px] left-[130px] w-[95px] h-[95px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={franchise.logo}
      className="w-full h-full object-cover rounded-full"
      alt="Institute Logo"
    />
  </div>
)}

        {/* INSTITUTE NAME */}
        <div className="absolute top-[95px] left-[5px] text-center w-full text-lg font-semibold">
          {franchise?.instituteName || ""}
        </div>

        {/* PHOTO */}
        <img
          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
          className="absolute top-[190px] left-[120px] w-[100px] h-[100px] object-cover"
        />

        {/* STUDENT NAME */}
        <div className="absolute top-[341px] left-[145px] text-sm font-semibold">
          {student.studentName}
        </div>

        {/* COURSE */}
        <div className="absolute top-[370px] left-[140px] text-xs font-bold">
          {student.courseName}
        </div>

        {/* MOBILE */}
        <div className="absolute top-[400px] left-[150px] text-sm font-bold">
          {student.mobile || ""}
        </div>

        {/* ROLL NUMBER */}
        <div className="absolute top-[427px] left-[150px] text-lg">
          {student.rollNumber}
        </div>

        {/* OWNER NAME */}
        <div className="absolute bottom-[30px] left-[46px] text-xs font-semibold">
          {franchise?.name || ""}
        </div>

        {/* QR CODE */}
        <div className="absolute top-[450px] left-[220px] bg-white p-1">
          <QRCode
            value={`${window.location.origin}/verify-student/${student.$id}`}
            size={80}
          />
        </div>

        {/* FRANCHISE SIGNATURE */}
        {franchise?.signature && (
          <img
            src={franchise.signature}
            className="absolute bottom-[50px] left-[40px] w-[100px] h-[40px] object-contain"
          />
        )}

      </div>

    </div>

  );

}