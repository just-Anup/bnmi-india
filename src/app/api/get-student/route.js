import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("id");

    if (!studentId) {
      return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
    }

    // ✅ 1. FETCH STUDENT
    const studentRes = await databases.listDocuments(
      DATABASE_ID,
      "student_admissions", // ✅ YOUR REAL COLLECTION
      [Query.equal("studentId", studentId)]
    );

    if (studentRes.documents.length === 0) {
      return new Response(JSON.stringify({ error: "Student not found" }), { status: 404 });
    }

    const student = studentRes.documents[0];

    // ✅ 2. FETCH MARKS
    let marksArray = [];

    const marksRes = await databases.listDocuments(
      DATABASE_ID,
      "exam_results",
      [Query.equal("studentId", studentId)]
    );

    if (marksRes.documents.length > 0) {
      const resultDoc = marksRes.documents[0];

      if (resultDoc.marksArray) {
        marksArray = JSON.parse(resultDoc.marksArray);
      }
    }

    // ✅ 3. FETCH FRANCHISE (LOGO + SIGNATURE)
    let franchiseData = {};

    if (student.franchiseId) {
      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("franchiseId", student.franchiseId)]
      );

      if (franchiseRes.documents.length > 0) {
        franchiseData = franchiseRes.documents[0];
      }
    }

    // ✅ FINAL MERGED DATA (IMPORTANT)
    const finalData = {
      ...student,
      marksArray,
      logo: franchiseData.logo || null,
      franchiseSignature: franchiseData.signature || null,
    };

    return new Response(JSON.stringify(finalData), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.log("API ERROR:", err);

    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}