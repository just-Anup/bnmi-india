"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const RESULT_COLLECTION = "exam_results";
const CERT_COLLECTION = "certificates";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function CertificatePage() {

    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {

        try {

            const res = await databases.listDocuments(
                DATABASE_ID,
                RESULT_COLLECTION
            );

            const passedStudents = res.documents.filter(
                r => r.grade !== "F"
            );

            setResults(passedStudents);

        } catch (err) {

            console.log(err);

        }

    };

    const toggleSelect = (id) => {

        if (selected.includes(id)) {

            setSelected(selected.filter(s => s !== id));

        } else {

            setSelected([...selected, id]);

        }

    };

    const applyCertificate = async () => {

        if (selected.length === 0) {
            alert("Please select at least one student");
            return;
        }

        try {

            for (const id of selected) {

                const student = results.find(r => r.$id === id);

                if (!student) continue;

                await databases.createDocument(
                    DATABASE_ID,
                    CERT_COLLECTION,
                    ID.unique(),
                    {
                        studentId: student.studentId,
                        studentName: student.studentName,
                        course: student.course,
                        photoId: student.photoId,
                        marks: student.totalMarks,
                        grade: student.grade,
                        certificateNo: "BNMI-" + Date.now(),
                        status: "pending",
                        createdAt: new Date().toISOString()
                    }
                );

            }

            alert("Certificate request sent to admin");

            setSelected([]);

        } catch (err) {

            console.log("Certificate Error:", err);
            alert(err.message);

        }

    };
    const getPhoto = (photoId) => {

        if (!photoId) return null;

        return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    };

    return (

        <div className="p-10 bg-gray-100 min-h-screen">

            <h1 className="text-2xl font-bold mb-6">
                ALL EXAMS RESULTS
            </h1>

            <div className="flex justify-end mb-4">

                <button
                    onClick={applyCertificate}
                    className="bg-blue-600 text-white px-6 py-2 rounded"
                >
                    Apply For Certificate
                </button>

            </div>

            <div className="bg-white rounded shadow p-6">

                <table className="w-full border">

                    <thead className="bg-yellow-200">

                        <tr>

                            <th className="border p-2"></th>
                            <th className="border p-2">#</th>
                            <th className="border p-2">Photo</th>
                            <th className="border p-2">Student</th>
                            <th className="border p-2">Course</th>
                            <th className="border p-2">Exam Mode</th>
                            <th className="border p-2">Objective Marks</th>
                            <th className="border p-2">Practical Marks</th>
                            <th className="border p-2">Percentage</th>
                            <th className="border p-2">Grade</th>
                            <th className="border p-2">Result</th>
                            <th className="border p-2">Exam Date</th>

                        </tr>

                    </thead>

                    <tbody>

                        {results.map((r, index) => {

                            const photoUrl = getPhoto(r.photoId);

                            let objective = 0;
                            let practical = 0;

                            try {

                                const marks = JSON.parse(r.marks);

                                marks.forEach(m => {
                                    objective += Number(m.theory || 0);
                                    practical += Number(m.practical || 0);
                                });

                            } catch { }

                            return (

                                <tr key={r.$id}>

                                    <td className="border p-2">

                                        <input
                                            type="checkbox"
                                            checked={selected.includes(r.$id)}
                                            onChange={() => toggleSelect(r.$id)}
                                        />

                                    </td>

                                    <td className="border p-2">
                                        {index + 1}
                                    </td>

                                    <td className="border p-2">

                                        {photoUrl && (

                                            <img
                                                src={photoUrl}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />

                                        )}

                                    </td>

                                    <td className="border p-2">
                                        {r.studentName}
                                    </td>

                                    <td className="border p-2">
                                        {r.course}
                                    </td>

                                    <td className="border p-2">
                                        OFFLINE
                                    </td>

                                    <td className="border p-2">
                                        {objective}
                                    </td>

                                    <td className="border p-2">
                                        {practical}
                                    </td>

                                    <td className="border p-2">
                                        {r.percentage}
                                    </td>

                                    <td className="border p-2">
                                        {r.grade}
                                    </td>

                                    <td className="border p-2">
                                        Passed
                                    </td>

                                    <td className="border p-2">
                                        {r.examDate || "-"}
                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        </div>

    );

}