"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PAYMENT_COLLECTION = "student_payments";
const ADMISSION_COLLECTION = "student_admissions";

export default function ReceiptPage() {

    const { id } = useParams();

    const [payment, setPayment] = useState(null);
    const [admission, setAdmission] = useState(null);
    const [receiptNumber, setReceiptNumber] = useState("");

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const generateReceiptNumber = () => {

        const date = new Date();

        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();

        const random = Math.floor(100000 + Math.random() * 900000);

        return `${d}-${m}-${y}/COA${random}`;

    };

    const fetchData = async () => {

        const pay = await databases.getDocument(
            DATABASE_ID,
            PAYMENT_COLLECTION,
            id
        );

        setPayment(pay);

        const adm = await databases.getDocument(
            DATABASE_ID,
            ADMISSION_COLLECTION,
            pay.admissionId
        );

        setAdmission(adm);

        setReceiptNumber(generateReceiptNumber());

    };

    if (!payment || !admission) {
        return <div className="p-10">Loading...</div>
    }

    const totalFees = Number(admission.totalFees || 0);
    const paid = Number(payment.paymentAmount || 0);
    const due = totalFees - paid;

    return (

        <div className="flex justify-center p-10 bg-gray-100">

            <div className="relative w-[900px]">

                {/* RECEIPT TEMPLATE BACKGROUND */}

                <img
                    src="/FEES.png"
                    className="w-full"
                />

                {/* RECEIPT NUMBER */}

                <div className="absolute top-[260px] left-[140px] flex items-center gap-2">

                    <span className="font-semibold">Receipt Number :</span>

                    <div className="border px-3 py-1 w-[220px] text-center">
                        {receiptNumber}
                    </div>

                </div>

                {/* RECEIPT DATE */}

                <div className="absolute top-[260px] right-[130px] flex items-center gap-2">

                    <span className="font-semibold">Receipt Date :</span>

                    <div className="border px-3 py-1 w-[140px] text-center">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                    </div>

                </div>

                {/* STUDENT NAME */}

                <div className="absolute top-[320px] left-[140px] flex items-center gap-2">

                    <span className="font-semibold">Student Name :</span>

                    <div className="border px-3 py-1 w-[270px]">
                        {payment.studentName}
                    </div>

                </div>

                {/* BATCH */}

                <div className="absolute top-[320px] right-[100px] flex items-center gap-2">

                    <span className="font-semibold">Batch Name :</span>

                    <div className="border px-3 py-1 w-[140px] text-center">
                        {admission.batch}
                    </div>

                </div>

                {/* COURSE */}

                <div className="absolute top-[390px] left-[140px] flex items-center gap-2">

                    <span className="font-semibold">Course Name :</span>

                    <div className="border px-3 py-1 w-[550px]">
                        {payment.course}
                    </div>

                </div>

                {/* FEES SECTION */}

                <div className="absolute top-[450px] left-[140px] flex gap-6">

                    <div className="flex items-center gap-2">

                        <span className="font-semibold">Course Fees :</span>

                        <div className="border px-3 py-1 w-[110px] text-center">
                            {totalFees}
                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <span className="font-semibold">Fees Received :</span>

                        <div className="border px-3 py-1 w-[110px] text-center">
                            {paid}
                        </div>

                    </div>

                    <div className="flex items-center gap-2">

                        <span className="font-semibold">Due Amount :</span>

                        <div className="border px-3 py-1 w-[110px] text-center">
                            {due}
                        </div>

                    </div>

                </div>

                {/* PRINT BUTTON */}

                <div className="text-center mt-6">

                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded"
                    >
                        Print Receipt
                    </button>

                </div>

            </div>

        </div>

    );

}