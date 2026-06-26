"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import * as htmlToImage from "html-to-image";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function AdmissionForm() {

    const { id } = useParams();

    const [student, setStudent] = useState(null);
    const [franchise, setFranchise] = useState(null);

    const printRef = useRef();

    useEffect(() => {
        if (id) fetchStudent();
    }, [id]);

    const fetchStudent = async () => {

        try {

            const res = await databases.getDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id
            );

            setStudent(res);

            const franchiseRes = await databases.listDocuments(
                DATABASE_ID,
                "franchise_approved",
                [Query.equal("email", res.franchiseEmail)]
            );

            if (franchiseRes.documents.length > 0) {
                setFranchise(franchiseRes.documents[0]);
            }

        } catch (error) {
            console.log("Error loading student:", error);
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

            link.download = `${student.studentName}_admission_form.png`;

            link.href = dataUrl;

            link.click();

        } catch (err) {

            console.log("DOWNLOAD ERROR:", err);

        }

    };

    if (!student) {
        return <div className="p-10">Loading...</div>;
    }

    return (

        <div className="flex justify-center p-10 bg-gray-100">

            <div
                ref={printRef}
                className="relative w-[900px] bg-white shadow"
            >

           

                {/* TEMPLATE */}

                <img
                    src="/admi.png"
                    className="w-full"
                    alt="Admission Template"
                />

                {/* FRANCHISE LOGO */}

{franchise?.logo && (
  <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
    <img
      src={franchise.logo}
      className="w-full h-full object-cover rounded-full"
      alt="Institute Logo"
    />
  </div>
)}

                {/* INSTITUTE NAME */}

                <div className="absolute top-[160px] text-center w-full text-3xl font-bold ">
                    {franchise?.instituteName || ""}
                </div>

                 <img
          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
          className="absolute top-[250px] right-[120px] w-[100px] h-[100px] object-cover"
        />

         {/* ROLL NUMBER */}

<div className="absolute top-[320px] right-[250px] text-lg font-semibold">
    Roll No: {student.rollNumber || ""}
</div>

                {/* ADMISSION DATE */}

                <div className="absolute top-[320px] left-[260px] text-lg">
                    {student.admissionDate || ""}
                </div>

                {/* COURSE NAME */}

                <div className="absolute top-[365px] left-[210px] text-lg">
                    {student.courseName || ""}
                </div>

                {/* STUDENT NAME */}

                <div className="absolute top-[408px] left-[210px] text-lg">
                    {student.studentName || ""}
                </div>

                {/* FATHER NAME */}

                <div className="absolute top-[450px] left-[210px] text-lg">
                    {student.fatherName || ""}
                </div>

                {/* MOTHER NAME */}

                <div className="absolute top-[495px] left-[210px] text-lg">
                    {student.motherName || ""}
                </div>

                {/* MOBILE */}

                <div className="absolute top-[670px] w-[200px] left-[240px] text-lg">
                    {student.mobile || ""}
                </div>

                {/* ALT MOBILE */}

                <div className="absolute top-[670px] left-[620px] text-lg">
                    {student.altMobile || ""}
                </div>

                {/* AADHAR */}

                <div className="absolute top-[537px] left-[260px] text-lg">
                    {student.aadhar || ""}
                </div>

                {/* EMAIL */}

                <div className="absolute top-[580px] left-[170px] text-lg">
                    {student.email || ""}
                </div>

                {/* QUALIFICATION */}

                <div className="absolute top-[625px] left-[230px] text-lg">
                    {student.qualification || ""}
                </div>

                {/* GENDER */}

                <div className="absolute top-[624px] left-[550px] text-lg">
                    {student.gender || ""}
                </div>

                {/* ADDRESS */}

                <div className="absolute top-[705px] left-[250px] w-[600px] text-lg">
                    {student.address || ""}
                </div>

                {/* STUDENT SIGNATURE */}

                {student.signatureId && (

                    <img
                        src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                        className="absolute top-[760px] left-[250px] w-[80px] h-[40px]"
                        alt="Student Signature"
                    />

                )}

                {/* COURSE FEES */}

                <div className="absolute top-[890px] left-[200px] text-lg">
                    {student.courseFees || ""}
                </div>

                {/* PAID FEES */}

                <div className="absolute top-[890px] left-[450px] text-lg">
                    {student.feesReceived || ""}
                </div>

                {/* BALANCE */}

                <div className="absolute top-[890px] left-[690px] text-lg">
                    {student.balance || ""}
                </div>

                {/* BATCH */}

                <div className="absolute top-[955px] left-[200px] text-lg">
                    {student.batch || ""}
                </div>

                {/* REGISTERED PERSON */}

                <div className="absolute top-[955px] left-[500px] text-lg">
                    {student.createdByName || ""}
                </div>

                {/* FRANCHISE SIGNATURE */}

                {franchise?.signature && (
                    <img
                        src={franchise.signature}
                        className="absolute bottom-[150px] right-[65px] w-[150px] h-[50px]"
                    />
                )}

                {/* FRANCHISE EMAIL */}

                <div className="absolute bottom-[70px] text-center w-full text-lg">
                    Email: {franchise?.email || ""}
                </div>

                {/* FRANCHISE ADDRESS */}

                <div className="absolute bottom-[95px]  text-sm text-center w-full px-55">
                    Address: {franchise?.address || ""}, {franchise?.city || ""}, {franchise?.state || ""}
                </div>

                {/* FRANCHISE OWNER */}

                <div className="absolute bottom-[120px] right-[70px] text-lg">
                    {franchise?.name || ""}
                </div>

            </div>

            {/* BUTTONS */}

            <div className="fixed top-20 right-20 flex gap-4">

                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded shadow-lg"
                >
                    Print Admission Form
                </button>

                <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-6 py-2 rounded shadow-lg"
                >
                    Download Admission Form
                </button>

            </div>

        </div>

    );

}