
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheet() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const printRef = useRef(null);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const cert = await databases.getDocument(
          DATABASE_ID,
          "certificates",
          id
        );

        const studentData = await databases.getDocument(
          DATABASE_ID,
          "student_admissions",
          cert.studentId
        );

        const resultRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [Query.equal("studentId", cert.studentId)]
        );

        if (resultRes.documents.length === 0) {
          alert("Exam result not found");
          return;
        }

        const result = resultRes.documents[0];

        const finalData = {
          ...result,
          ...studentData,
          ...cert,
          studentName:
            cert.studentName || studentData.studentName,
          fatherName:
            cert.fatherName || studentData.fatherName,
          motherName:
            cert.motherName || studentData.motherName,
          surname: cert.surname || studentData.surname || "",
          course: cert.course || studentData.courseName,
          instituteName:
            cert.instituteName || studentData.instituteName,
          duration: cert.duration || studentData.duration,
          coursePeriod:
            cert.coursePeriod || studentData.coursePeriod,
          certificateNo: cert.certificateNo || "",
          marksheetNo:
            cert.marksheetNo || cert.certificateNo || "",
          dob: cert.dob || studentData.dob || "",
          relationType:
            cert.relationType || studentData.relationType,
          showFatherInCertificate:
            cert.showFatherInCertificate ??
            studentData.showFatherInCertificate,
          showMotherInCertificate:
            cert.showMotherInCertificate ??
            studentData.showMotherInCertificate,
          logo: cert.logo,
          ownerName: cert.ownerName,
          franchiseSignature: cert.franchiseSignature,
        };

        setStudent(finalData);
        fetchMarks(cert.studentId, finalData);
      } catch (err) {
        console.error("LOAD ERROR:", err);
        alert("Unable to load marksheet data.");
      }
    };

    if (id) {
      loadStudent();
    }
  }, [id]);

  useEffect(() => {
    const generateQR = async () => {
      try {
        if (!student?.studentId) return;

        const verifyUrl =
          `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

        const qr = await QRCode.toDataURL(verifyUrl);
        setQrCode(qr);
      } catch (err) {
        console.error("QR ERROR:", err);
      }
    };

    if (student) {
      generateQR();
    }
  }, [student]);

  const fetchMarks = async (studentId, studentData) => {
    try {
      const resultRes = await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [
          Query.equal("studentId", studentId),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );

      if (resultRes.documents.length === 0) {
        console.log("No exam result found for:", studentId);
        setMarksArray([]);
        return;
      }

      let resultDoc = resultRes.documents[0];

      if (studentData?.courseType === "semester") {
        resultDoc =
          resultRes.documents.find(
            (doc) =>
              Number(doc.semesterNumber) ===
              Number(studentData.currentSemester || 1)
          ) || resultDoc;
      }

      let parsedMarks = [];

      if (resultDoc.marksArray) {
        try {
          parsedMarks =
            typeof resultDoc.marksArray === "string"
              ? JSON.parse(resultDoc.marksArray)
              : resultDoc.marksArray;
        } catch (parseError) {
          console.error("MARKS ARRAY PARSE ERROR:", parseError);
          parsedMarks = [];
        }
      }

      const finalMarks = parsedMarks.map((m) => ({
        subject: m.subject || "",
        objective: Number(m.objective ?? m.theory ?? 0),
        practical: Number(m.practical ?? 0),
        total: Number(
          m.total ??
            (Number(m.objective ?? m.theory ?? 0) +
              Number(m.practical ?? 0))
        ),
      }));

      setMarksArray(finalMarks);
    } catch (err) {
      console.error("MARK FETCH ERROR:", err);
      setMarksArray([]);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await account.get();

        if (user.email === "bnmiindia123@gmail.com") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.log("ADMIN CHECK ERROR:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    checkAdmin();
  }, []);

  const updateSubjectName = (index, value) => {
    setMarksArray((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        subject: value,
      };

      return updated;
    });
  };

  const saveSubjectChanges = async () => {
    if (!isAdmin) {
      alert("Only admin can edit subjects.");
      return;
    }

    if (savingSubjects) return;

    try {
      setSavingSubjects(true);

      if (!marksArray.length) {
        alert("No subjects found.");
        return;
      }

      const hasEmptySubject = marksArray.some(
        (m) => !m.subject?.trim()
      );

      if (hasEmptySubject) {
        alert("Subject name cannot be empty.");
        return;
      }

      const examRes = await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [
          Query.equal("studentId", student.studentId),
          Query.limit(100),
        ]
      );

      const updatedMarksArray = marksArray.map((m) => ({
        subject: m.subject.trim(),
        objective: Number(m.objective || 0),
        practical: Number(m.practical || 0),
        total:
          Number(m.objective || 0) +
          Number(m.practical || 0),
      }));

      for (const examDoc of examRes.documents) {
        await databases.updateDocument(
          DATABASE_ID,
          "exam_results",
          examDoc.$id,
          {
            marksArray: JSON.stringify(updatedMarksArray),
          }
        );
      }

      const subjectRes = await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [
          Query.equal("studentId", student.studentId),
          Query.limit(500),
        ]
      );

      const sortedSubjectDocs = [...subjectRes.documents].sort(
        (a, b) =>
          new Date(a.$createdAt) - new Date(b.$createdAt)
      );

      for (
        let i = 0;
        i < updatedMarksArray.length;
        i++
      ) {
        const subjectDoc = sortedSubjectDocs[i];

        if (!subjectDoc) continue;

        await databases.updateDocument(
          DATABASE_ID,
          "student_subject_results",
          subjectDoc.$id,
          {
            subject: updatedMarksArray[i].subject,
          }
        );
      }

      setMarksArray(updatedMarksArray);
      setEditingSubjects(false);

      alert("Subjects updated successfully.");
    } catch (err) {
      console.error("SUBJECT UPDATE ERROR:", err);

      alert(
        err?.message || "Failed to update subjects."
      );
    } finally {
      setSavingSubjects(false);
    }
  };

  if (!student) {
    return <div className="p-10">Loading...</div>;
  }

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );


 

const convertImageToDataURL = async (url) => {
  if (!url) {
    throw new Error("Institute logo URL is missing.");
  }

  if (url.startsWith("data:image/")) {
    return url;
  }

  // Use our own Next.js endpoint instead of fetching
  // directly from Appwrite in the browser.
  const proxyUrl = `/api/logo-proxy?url=${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(
      `Logo retrieval failed: ${response.status}`
    );
  }

  const blob = await response.blob();

  if (!blob.type.startsWith("image/")) {
    throw new Error("The logo response is not an image.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Logo conversion failed."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Could not read logo image."));
    };

    reader.readAsDataURL(blob);
  });
};

const handleDownload = async () => {
  const node = printRef.current;

  if (!node) {
    alert("Marksheet not found. Please refresh the page.");
    return;
  }

  try {
    // 1. Wait for fonts.
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // 2. Embed the logo before capturing the marksheet.
    let logoDataURL = null;

    if (student?.logo) {
      try {
        logoDataURL = await convertImageToDataURL(
          student.logo
        );
      } catch (error) {
        console.error("LOGO EMBEDDING ERROR:", error);

        alert(
          "The institute logo could not be embedded in the PDF. Please check the logo URL and its CORS settings."
        );

        return;
      }
    }

    // 3. Wait for the existing marksheet images.
    const images = Array.from(node.querySelectorAll("img"));

    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.addEventListener("load", resolve, {
              once: true,
            });

            img.addEventListener("error", resolve, {
              once: true,
            });
          });
        }

        if (img.naturalWidth > 0) {
          try {
            await img.decode();
          } catch {
            // Continue; html2canvas will handle the image.
          }
        }
      })
    );

    // 4. Capture the marksheet.
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 20000,

      onclone: (clonedDocument) => {
        const clonedNode = clonedDocument.querySelector(
          "[data-marksheet-capture]"
        );

        if (!clonedNode) {
          throw new Error("Cloned marksheet not found.");
        }

        // Find the logo by its alt text instead of matching
        // the src URL, which browsers may normalize.
        if (logoDataURL) {
          const logoElement = clonedNode.querySelector(
            'img[alt="Institute logo"]'
          );

          if (logoElement) {
            logoElement.setAttribute("src", logoDataURL);
            logoElement.removeAttribute("crossorigin");
            logoElement.removeAttribute("referrerpolicy");
          } else {
            throw new Error(
              "Institute logo element not found in PDF capture."
            );
          }
        }

        // 5. Retain the existing modern CSS color workaround.
        const elements = [
          clonedNode,
          ...clonedNode.querySelectorAll("*"),
        ];

        elements.forEach((el) => {
          const computed =
            clonedDocument.defaultView.getComputedStyle(el);

          if (computed.color.includes("lab")) {
            el.style.setProperty(
              "color",
              "#000000",
              "important"
            );
          }

          if (computed.backgroundColor.includes("lab")) {
            el.style.setProperty(
              "background-color",
              "#ffffff",
              "important"
            );
          }

          if (computed.borderColor.includes("lab")) {
            el.style.setProperty(
              "border-color",
              "#000000",
              "important"
            );
          }

          el.style.setProperty(
            "box-shadow",
            "none",
            "important"
          );

          el.style.setProperty(
            "text-shadow",
            "none",
            "important"
          );

          el.style.setProperty(
            "filter",
            "none",
            "important"
          );
        });
      },
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("The marksheet canvas is empty.");
    }

    // 6. Convert the canvas into an image.
    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.98
    );

    // 7. Create the PDF with the same proportions.
    const pdf = new jsPDF({
      orientation:
        canvas.width >= canvas.height
          ? "landscape"
          : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
      compress: true,
    });

    pdf.addImage(
      imageData,
      "JPEG",
      0,
      0,
      canvas.width,
      canvas.height,
      undefined,
      "FAST"
    );

    // 8. Download directly, without opening Print.
    const safeName = (
      student?.studentName || "student"
    )
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .trim();

    pdf.save(`${safeName}_marksheet.pdf`);
  } catch (error) {
    console.error("PDF DOWNLOAD ERROR:", error);

    alert(
      error?.message ||
        "PDF generation failed. Please check the browser c onsole."
    );
  }
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
      {/* DOWNLOAD PDF */}
      <button
        onClick={handleDownload}
        className="bg-green-600 text-white px-6 py-2 mb-6"
      >
        Download PDF
      </button>

      {/* ADMIN ONLY SUBJECT EDIT */}
      {isAdmin && !loadingUser && (
        <div className="mb-6 flex gap-3">
          {!editingSubjects ? (
            <button
              onClick={() => setEditingSubjects(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
            >
              Edit Subjects
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingSubjects(false);
                  fetchMarks(student.studentId, student);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveSubjectChanges}
                disabled={savingSubjects}
                className={`px-6 py-2 rounded text-white ${
                  savingSubjects
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {savingSubjects
                  ? "Saving..."
                  : "Save Subject Changes"}
              </button>
            </>
          )}
        </div>
      )}

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
        data-marksheet-capture
        style={{
          width: "900px",
          minHeight: "1200px",
          height: "auto",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* BACKGROUND */}
        <img
          src="/singlemark.png"
          alt="Marksheet background"
          className="absolute w-full h-full"
        />

        {/* LOGO */}
        {student.logo && (
          <div
            className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md"
          >
            <img
              src={student.logo}
              alt="Institute logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}

        {/* QR CODE */}
        {qrCode ? (
          <img
            src={qrCode}
            alt="QR Code"
            className="absolute top-[240px] right-[50px] w-[90px] bg-white p-1"
          />
        ) : (
          <div className="absolute top-[240px] right-[50px] text-xs">
            Generating QR...
          </div>
        )}

        {/* LEFT SIDE DETAILS */}
        <div className="absolute top-[325px] left-[330px]">
          {student.studentName}
        </div>

        <div className="absolute top-[346px] left-[330px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[367px] left-[330px]">
          {student.surname || ""}
        </div>

        <div className="absolute top-[388px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[410px] left-[330px]">
          {student.course}
        </div>

        <div className="absolute top-[432px] left-[330px] font-semibold">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE DETAILS */}
        <div className="absolute top-[348px] left-[680px] text-[15px]">
          {student.marksheetNo || student.certificateNo || ""}
        </div>

        <div className="absolute top-[369px] left-[680px] text-[15px]">
          {(student.dob || student.dateOfBirth)
            ? new Date(
                student.dob || student.dateOfBirth
              )
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
                  {editingSubjects ? (
                    <textarea
                      value={m.subject || ""}
                      onChange={(e) =>
                        updateSubjectName(index, e.target.value)
                      }
                      className="border border-gray-400 px-2 py-1 w-full bg-white text-black rounded"
                      rows={2}
                    />
                  ) : (
                    m.subject || ""
                  )}
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
                    fontSize: "14px",
                    lineHeight: "1.7",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {editingSubjects ? (
                    <textarea
                      value={marksArray
                        .map((s) =>
                          (s.subject || "").replace(/\\n/g, "\n")
                        )
                        .join("\n")}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n");

                        setMarksArray((prev) =>
                          prev.map((item, index) => ({
                            ...item,
                            subject: lines[index] ?? "",
                          }))
                        );
                      }}
                      className="border border-gray-400 px-2 py-2 w-full bg-white text-black rounded"
                      rows={7}
                    />
                  ) : (
                    (m.subject || "")
                      .replace(/\\n/g, "\n")
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line, j) => (
                        <div
                          key={j}
                          style={{ marginBottom: "8px" }}
                        >
                          {line.trim()}
                        </div>
                      ))
                  )}
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
            left: 775,
          }}
        >
          {total}
        </div>

        {/* GRADE */}
        {/* Existing grade position retained */}
        <div
          className="absolute font-bold"
          style={{
            top:
              student?.courseType?.toLowerCase() === "multiple"
                ? 570 + marksArray.length * 45
                : 572,
            left: 780,
          }}
        >
          {total}
        </div>

        {/* FRANCHISE SIGNATURE */}
        {franchiseSign && (
          <img
            src={franchiseSign + "&mode=admin"}
            crossOrigin="anonymous"
            alt="Franchise signature"
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
