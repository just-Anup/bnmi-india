"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { databases } from "@/lib/appwrite";
import { ID, Permission, Role } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "questions";

export default function UploadQuestions() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setLoading(true);

    try {
      const fileName = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .trim();

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      for (let item of jsonData) {
        if (!item.Question) continue;

        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            question: item.Question || "",
            option1: item.Option1 || "",
            option2: item.Option2 || "",
            option3: item.Option3 || "",
            option4: item.Option4 || "",
            correctAnswer: item.Correct || "",
            courseName: fileName,
          },
          [
            Permission.read(Role.any()),
            Permission.write(Role.any()),
          ]
        );
      }

      alert("Upload successful");
      setFile(null);

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">

        <h1 className="text-2xl font-bold mb-4">
          Upload Questions
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Upload Excel file (Question, Option1-4, Correct)
        </p>

        {/* File Upload Box */}
        <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center mb-4">
          <p className="text-gray-500">
            {file ? file.name : "Click to select Excel file"}
          </p>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-3"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Uploading..." : "Upload Questions"}
        </button>

      </div>
    </div>
  );
}