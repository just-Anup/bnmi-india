
"use client";

import { useEffect, useState, useRef } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import html2canvas from "html2canvas";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PrintMarksheetMultiple() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [marksArray, setMarksArray] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const printRef = useRef(null);

  // FETCH MULTIPLE SUBJECT DATA
  const fetchMarks = async (studentId) => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [Query.equal("studentId", studentId)]
      );

      const docs = [...res.documents].sort(
        (a, b) => new Date(a.$createdAt) - new Date(b.$createdAt)
      );

      const finalMarks = docs.map((m) => ({
        $id: m.$id,
        subject: m.subject,
        objective: Number(m.objective || 0),
        practical: Number(m.practical || 0),
        total: Number(m.total || 0),
      }));

      setMarksArray(finalMarks);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };

  // ADMIN CHECK
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

  // UPDATE SUBJECT NAME IN UI
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

  // SAVE SUBJECT CHANGES
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

      for (const mark of marksArray) {
        if (!mark.$id) {
          console.log("Missing document ID for:", mark.subject);
          continue;
        }

        await databases.updateDocument(
          DATABASE_ID,
          "student_subject_results",
          mark.$id,
          {
            subject: mark.subject.trim(),
          }
        );
      }

      if (student?.studentId) {
        const resultRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [
            Query.equal("studentId", student.studentId),
            Query.limit(1),
          ]
        );

        if (resultRes.documents.length > 0) {
          const result = resultRes.documents[0];

          const updatedMarksArray = marksArray.map((m) => ({
            subject: m.subject.trim(),
            objective: Number(m.objective || 0),
            practical: Number(m.practical || 0),
            total:
              Number(m.objective || 0) +
              Number(m.practical || 0),
          }));

          await databases.updateDocument(
            DATABASE_ID,
            "exam_results",
            result.$id,
            {
              subjects: marksArray
                .map((m) => m.subject.trim())
                .join(", "),
              marksArray: JSON.stringify(updatedMarksArray),
            }
          );
        }
      }

      setEditingSubjects(false);
      alert("Subjects updated successfully.");
    } catch (err) {
      console.error("SUBJECT UPDATE ERROR:", err);

      alert(err?.message || "Failed to update subjects.");
    } finally {
      setSavingSubjects(false);
    }
  };

  // FETCH STUDENT AND CERTIFICATE
  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      try {
        const certificate = await databases.getDocument(
          DATABASE_ID,
          "certificates",
          id
        );

        let studentDoc = null;

        const needStudentData =
          !certificate.studentName ||
          !certificate.fatherName ||
          !certificate.motherName ||
          !certificate.surname ||
          !certificate.dob;

        if (needStudentData) {
          studentDoc = await databases.getDocument(
            DATABASE_ID,
            "student_admissions",
            certificate.studentId
          );
        }

        const resultRes = await databases.listDocuments(
          DATABASE_ID,
          "exam_results",
          [Query.equal("studentId", certificate.studentId)]
        );

        if (resultRes.documents.length === 0) {
          alert("Exam result not found");
          return;
        }

        let franchise = null;

        const needFranchiseData =
          !certificate.logo ||
          !certificate.ownerName ||
          !certificate.franchiseSignature ||
          !certificate.city;

        if (needFranchiseData) {
          const franchiseEmail =
            certificate.franchiseEmail ||
            studentDoc?.franchiseEmail;

          if (franchiseEmail) {
            const franchiseRes = await databases.listDocuments(
              DATABASE_ID,
              "franchise_approved",
              [Query.equal("email", franchiseEmail)]
            );

            if (franchiseRes.documents.length > 0) {
              franchise = franchiseRes.documents[0];
            }
          }
        }

        setStudent({
          ...(studentDoc || {}),
          ...certificate,

          studentId: certificate.studentId,

          studentName:
            certificate.studentName ||
            studentDoc?.studentName ||
            "",

          fatherName:
            certificate.fatherName ||
            studentDoc?.fatherName ||
            "",

          motherName:
            certificate.motherName ||
            studentDoc?.motherName ||
            "",

          surname:
            certificate.surname ||
            studentDoc?.surname ||
            "",

          dob: certificate.dob || studentDoc?.dob || "",

          course:
            certificate.course ||
            studentDoc?.courseName ||
            "",

          instituteName:
            certificate.instituteName ||
            studentDoc?.instituteName ||
            "",

          duration:
            certificate.duration ||
            studentDoc?.duration ||
            "",

          coursePeriod:
            certificate.coursePeriod ||
            studentDoc?.coursePeriod ||
            "",

          certificateNo: certificate.certificateNo || "",

          logo: certificate.logo || franchise?.logo || "",

          franchiseSignature:
            certificate.franchiseSignature ||
            franchise?.signature ||
            "",

          ownerName:
            certificate.ownerName ||
            franchise?.ownerName ||
            franchise?.owner ||
            franchise?.name ||
            "",

          city: certificate.city || franchise?.city || "",
        });

        fetchMarks(certificate.studentId);
      } catch (err) {
        console.log("STUDENT FETCH ERROR:", err);
      }
    };

    fetchStudent();
  }, [id]);

  // FETCH COURSE
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          "franchise_multiple_courses",
          [Query.equal("courseName", student?.course)]
        );

        if (res.documents.length > 0) {
          setCourseData(res.documents[0]);
        }
      } catch (err) {
        console.log("COURSE FETCH ERROR:", err);
      }
    };

    if (student?.course) fetchCourse();
  }, [student]);

  // GENERATE QR CODE
  useEffect(() => {
    const generateQR = async () => {
      try {
        if (!student?.studentId) return;

        const verifyUrl =
          `https://www.bnmiindia.org/beauty-verification/${student.studentId}`;

        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 300,
          margin: 1,
        });

        setQrCode(qr);
      } catch (err) {
        console.log("QR ERROR:", err);
      }
    };

    if (student) generateQR();
  }, [student]);

  // =====================================================
  // PDF DOWNLOAD HELPERS
  // =====================================================

  const convertImageToDataURL = async (url) => {
    if (!url) {
      throw new Error("Institute logo URL is missing.");
    }

    if (url.startsWith("data:image/")) {
      return url;
    }

    // Use the same Next.js proxy as the working single marksheet.
    const proxyUrl =
      `/api/logo-proxy?url=${encodeURIComponent(url)}`;

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

  // DOWNLOAD MULTIPLE MARKSHEET AS PDF
  const handleDownload = async () => {
    const node = printRef.current;

    if (!node) {
      alert("Marksheet not found. Please refresh the page.");
      return;
    }

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Convert the logo through the proxy.
      let logoDataURL = null;

      if (student?.logo) {
        try {
          logoDataURL = await convertImageToDataURL(student.logo);
        } catch (error) {
          console.error("LOGO EMBEDDING ERROR:", error);

          alert(
            "The institute logo could not be embedded in the PDF. Please check the logo URL and /api/logo-proxy route."
          );

          return;
        }
      }

      // Wait for all existing marksheet images.
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

          if (img.naturalWidth > 0 && img.decode) {
            try {
              await img.decode();
            } catch {
              // Continue if the browser cannot decode an image.
            }
          }
        })
      );

      const rect = node.getBoundingClientRect();

      // Capture the same marksheet currently displayed on screen.
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 20000,
        width: rect.width,
        height: rect.height,

        onclone: (clonedDocument) => {
          const clonedNode = clonedDocument.querySelector(
            "[data-marksheet-capture]"
          );

          if (!clonedNode) {
            throw new Error("Cloned marksheet not found.");
          }

          // Replace the logo only in the PDF clone.
          // The actual on-screen logo remains unchanged.
          if (logoDataURL) {
            const logoElement = clonedNode.querySelector(
              'img[alt="Institute logo"]'
            );

            if (!logoElement) {
              throw new Error(
                "Institute logo element not found in PDF capture."
              );
            }

            logoElement.setAttribute("src", logoDataURL);
            logoElement.removeAttribute("crossorigin");
            logoElement.removeAttribute("referrerpolicy");
          }

          // Work around unsupported modern CSS lab() colors.
          const elements = [
            clonedNode,
            ...clonedNode.querySelectorAll("*"),
          ];

          elements.forEach((element) => {
            const computed =
              clonedDocument.defaultView.getComputedStyle(element);

            if (computed.color.includes("lab")) {
              element.style.setProperty(
                "color",
                "#000000",
                "important"
              );
            }

            if (computed.backgroundColor.includes("lab")) {
              element.style.setProperty(
                "background-color",
                "#ffffff",
                "important"
              );
            }

            if (computed.borderColor.includes("lab")) {
              element.style.setProperty(
                "border-color",
                "#000000",
                "important"
              );
            }

            element.style.setProperty(
              "box-shadow",
              "none",
              "important"
            );

            element.style.setProperty(
              "text-shadow",
              "none",
              "important"
            );

            element.style.setProperty(
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

      // Convert the captured marksheet to an image for the PDF.
      const imageData = canvas.toDataURL("image/jpeg", 0.98);

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

      const safeName = (student?.studentName || "student")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .trim();

      // Download directly. Do not open the print dialog.
      pdf.save(
        `${safeName || "student"}_multiple_marksheet.pdf`
      );
    } catch (error) {
      console.error("PDF DOWNLOAD ERROR:", error);

      alert(
        error?.message ||
          "PDF generation failed. Please check the browser console."
      );
    }
  };

  // =====================================================
  // TOTAL + GRADE
  // =====================================================

  const total = marksArray.reduce(
    (sum, m) => sum + Number(m.total || 0),
    0
  );

  const percentage = marksArray.length
    ? ((total / (marksArray.length * 100)) * 100).toFixed(2)
    : 0;

  useEffect(() => {
    const savePercentage = async () => {
      try {
        if (!student?.studentId || marksArray.length === 0) {
          return;
        }

        const res = await databases.listDocuments(
          DATABASE_ID,
          "student_subject_results",
          [Query.equal("studentId", student.studentId)]
        );

        if (res.documents.length === 0) return;

        const percent = (
          marksArray.reduce((sum, m) => sum + m.total, 0) /
          (marksArray.length * 100)
        ).toFixed(2);

        await Promise.all(
          res.documents.map((doc) =>
            databases.updateDocument(
              DATABASE_ID,
              "student_subject_results",
              doc.$id,
              { percentage: percent }
            )
          )
        );
      } catch (err) {
        console.log("SAVE PERCENT ERROR:", err);
      }
    };

    savePercentage();
  }, [marksArray]);

  const getGrade = () => {
    const percent = percentage;

    if (percent >= 85) return "A+";
    if (percent >= 70) return "A";
    if (percent >= 55) return "B";
    if (percent >= 40) return "C";
    if (percent >= 35) return "D";
    if (percent >= 33) return "F";

    return "F";
  };

  const getCoursePeriod = (durationText) => {
    if (!durationText) return "N/A";

    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    const text = durationText.toLowerCase();

    if (text.includes("month")) {
      const months = parseInt(text) || 1;
      end.setMonth(end.getMonth() + months);
    }

    if (text.includes("year")) {
      const years = parseInt(text) || 1;
      end.setFullYear(end.getFullYear() + years);
    }

    const format = (d) =>
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    return `${format(start)} To ${format(end)}`;
  };

  if (!student) {
    return <div className="p-10">Loading...</div>;
  }

  const objectiveTotal = marksArray.reduce(
    (sum, m) => sum + Number(m.objective || 0),
    0
  );

  const practicalTotal = marksArray.reduce(
    (sum, m) => sum + Number(m.practical || 0),
    0
  );

  const objectiveOutOf = marksArray.length * 50;
  const practicalOutOf = marksArray.length * 50;
  const totalOutOf = marksArray.length * 100;

  return (
    <div className="p-10 bg-white">
      {/* DOWNLOAD BUTTON */}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Edit Subjects
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingSubjects(false);
                  fetchMarks(student.studentId);
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

      {/* MULTIPLE MARKSHEET TEMPLATE — LAYOUT RETAINED */}
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
        {/* TEMPLATE */}
        <img
          src="/multiplemarksheet.png"
          className="absolute w-full h-full"
          alt="Multiple marksheet background"
        />

        {/* LOGO */}
        {student.logo && (
          <div className="absolute top-[10px] left-[410px] w-[135px] h-[135px] overflow-hidden bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
            <img
              src={student.logo}
              alt="Institute logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}

        {/* LEFT SIDE */}
        <div className="absolute top-[310px] left-[330px]">
          {student.studentName}
        </div>

        <div className="absolute top-[330px] left-[330px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[352px] left-[330px]">
          {student.surname}
        </div>

        <div className="absolute top-[374px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[395px] left-[330px] font-bold">
          {student.course}
        </div>

        <div className="absolute top-[417px] left-[330px] font-bold">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}
        <div className="absolute top-[334px] left-[680px]">
          {student.marksheetNo || student.certificateNo}
        </div>

        <div className="absolute top-[355px] left-[680px]">
          {student.dob
            ? new Date(student.dob)
                .toLocaleDateString("en-GB")
                .replace(/\//g, "-")
            : ""}
        </div>

        <div className="absolute top-[378px] left-[680px] text-[13px]">
          {student.coursePeriod || student.duration}
        </div>

        {qrCode && (
          <img
            src={qrCode}
            alt="Verification QR code"
            className="absolute top-[240px] right-[80px] w-[90px] bg-white p-1"
          />
        )}

        {/* SUBJECT TABLE */}
        <div
          style={{
            position: "absolute",
            top: 540,
            left: 150,
            width: "650px",
            display: "flex",
            flexDirection: "column",
            gap: "7px",
          }}
        >
          {marksArray.map((m, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "280px 60px 60px 60px 60px 70px 70px",
                alignItems: "start",
                minHeight: "20px",
              }}
            >
              {/* SUBJECT */}
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "15px",
                  wordBreak: "break-word",
                  whiteSpace: "normal",
                  paddingRight: "10px",
                }}
              >
                {editingSubjects ? (
                  <input
                    type="text"
                    value={m.subject || ""}
                    onChange={(e) =>
                      updateSubjectName(index, e.target.value)
                    }
                    className="border border-gray-400 px-2 py-1 w-full bg-white text-black rounded"
                  />
                ) : (
                  <>
                    {index + 1}) {m.subject}
                  </>
                )}
              </div>

              {/* OBJECTIVE OUT OF */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                50
              </div>

              {/* OBJECTIVE SCORE */}
              <div style={{ textAlign: "center" }}>
                {m.objective}
              </div>

              {/* PRACTICAL OUT OF */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                50
              </div>

              {/* PRACTICAL SCORE */}
              <div style={{ textAlign: "center" }}>
                {m.practical}
              </div>

              {/* TOTAL OUT OF */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                100
              </div>

              {/* TOTAL SCORE */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {Number(m.objective) + Number(m.practical)}
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div
          style={{
            position: "absolute",
            top: 867,
            left: 150,
            width: "650px",
            display: "grid",
            gridTemplateColumns:
              "280px 60px 60px 60px 60px 70px 70px",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          <div></div>
          <div style={{ textAlign: "center" }}>
            {objectiveOutOf}
          </div>
          <div style={{ textAlign: "center" }}>
            {objectiveTotal}
          </div>
          <div style={{ textAlign: "center" }}>
            {practicalOutOf}
          </div>
          <div style={{ textAlign: "center" }}>
            {practicalTotal}
          </div>
          <div style={{ textAlign: "center" }}>
            {totalOutOf}
          </div>
          <div style={{ textAlign: "center" }}>
            {total}
          </div>
        </div>

        {/* PERCENTAGE */}
        <div className="absolute bottom-[260px] left-[350px] font-bold">
          Percentage: {percentage}%
        </div>

        {/* GRADE */}
        <div className="absolute bottom-[260px] left-[250px] font-bold">
          Grade: {getGrade()}
        </div>

        <div className="absolute bottom-[260px] left-[600px] font-bold">
          Total: {total}/{totalOutOf}
        </div>

        {/* SIGNATURE */}
        {student?.franchiseSignature && (
          <img
            id="sign-img"
            src={student.franchiseSignature + "&mode=admin"}
            crossOrigin="anonymous"
            alt="Franchise signature"
            className="absolute bottom-[95px] left-[100px] w-[100px]"
          />
        )}

        {/* OWNER NAME */}
        {student?.ownerName && (
          <div className="absolute bottom-[60px] left-[100px] text-sm">
            <div className="font-semibold">
              {student.ownerName}
            </div>

            <div className="text-xs text-gray-600 font-bold">
              Controller Of Examination
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
