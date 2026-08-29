"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  UserPlus,
  Wallet,
  ClipboardCheck,
  Layers,
  FileText
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function Dashboard() {

  const [stats, setStats] = useState({
    students: 0,
    certificates: 0,
    attendance: 0,
    wallet: 0,
    courierWallet: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATES
  const [franchiseData, setFranchiseData] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const user = await account.get();

      // =========================
      // STUDENTS
      // =========================
      const studentsRes = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [
          Query.equal("createdById", user.$id),
          Query.orderDesc("createdAt"),
          Query.limit(100),
        ]
      );

      const userStudents = studentsRes.documents;

      // =========================
      // GRAPH DATA
      // =========================
      const last7Days = {};

      userStudents.forEach((s) => {
        if (!s.createdAt) return;

        const date = new Date(s.createdAt).toLocaleDateString("en-GB");
        last7Days[date] = (last7Days[date] || 0) + 1;
      });

      const graph = Object.keys(last7Days).map((date) => ({
        date,
        students: last7Days[date],
      }));

      setChartData(graph);

      // =========================
      // RECENT ACTIVITY
      // =========================
      const recent = userStudents
        .slice(0, 5)
        .map((s) => ({
          text: `New student: ${s.studentName}`,
          time: new Date(s.createdAt).toLocaleString(),
        }));

      setActivities(recent);

      // =========================
      // FRANCHISE DATA
      // =========================
      const franchiseRes = await databases.listDocuments(
  DATABASE_ID,
  "franchise_approved",
  [Query.equal("email", user.email)]
);

const currentFranchise = franchiseRes.documents[0];

      setFranchiseData(currentFranchise);

      const wallet = Number(currentFranchise?.wallet || 0);
      const courierWallet = Number(currentFranchise?.courierWallet || 0);

      // =========================
      // FINAL STATS
      // =========================
      setStats({
        students: userStudents.length,
        certificates: 0,
        attendance: 0,
        wallet,
        courierWallet,
      });

    } catch (err) {
      console.log("DASHBOARD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10">Loading Dashboard...</div>;
  }

  const formatDate = (date) => {
  if (!date) return "N/A";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  return d.toLocaleDateString("en-GB");
};

const getExpiryDate = (data) => {
  const base = new Date(data.issueDate || data.$createdAt);
  if (isNaN(base)) return null;

  base.setFullYear(base.getFullYear() + 1);
  return base;
};

const handleDownload = async () => {
  try {
  let node = document.getElementById("print-area");

if (!node) {
  node = document.createElement("div");

  node.style.position = "fixed";
  node.style.left = "-9999px";
  node.style.top = "0";

  node.innerHTML = `
    <div style="position:relative;width:800px;">
      <img src="/ATC.png" style="width:100%;" />
    </div>
  `;

  document.body.appendChild(node);
}

    if (!node) {
      alert("Certificate not found");
      return;
    }

    const rect = node.getBoundingClientRect();

    await new Promise(resolve => setTimeout(resolve, 500));

    // ✅ Fix images
    const images = node.querySelectorAll("img");

    for (let img of images) {
      if (!img.src.startsWith("data:")) {
        try {
          const res = await fetch(img.src);
          const blob = await res.blob();

          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          img.src = base64;
        } catch (e) {
          console.log("IMG ERROR:", e);
        }
      }
    }

    const dataUrl = await htmlToImage.toPng(node, {
      quality: 1,
      pixelRatio: 3,
      cacheBust: true,
      width: rect.width,
      height: rect.height,
    });

    const link = document.createElement("a");
    link.download = `${franchiseData?.name || "certificate"}.png`;
    link.href = dataUrl;
    link.click();

  } catch (err) {
    console.log("DOWNLOAD ERROR:", err);
  }
};

const handleAdmissionFormDownload = async () => {
  try {
    if (!franchiseData) {
      alert("Franchise information not found.");
      return;
    }

    // =====================================================
    // GET FRANCHISE LOGO
    // =====================================================

    let franchiseLogo =
      franchiseData.logo ||
      franchiseData.franchiseLogo ||
      franchiseData.logoUrl ||
      franchiseData.instituteLogo;

    if (!franchiseLogo) {
      alert("Franchise logo not found.");
      return;
    }

    // =====================================================
    // IF LOGO IS AN OBJECT
    // =====================================================

    if (typeof franchiseLogo === "object") {
      franchiseLogo =
        franchiseLogo.url ||
        franchiseLogo.href ||
        franchiseLogo.fileUrl ||
        franchiseLogo.preview ||
        null;
    }

    if (!franchiseLogo) {
      alert("Invalid franchise logo.");
      return;
    }

    console.log(
      "FRANCHISE LOGO:",
      franchiseLogo
    );

    // =====================================================
    // LOAD IMAGE HELPER
    // =====================================================

    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          resolve(img);
        };

        img.onerror = () => {
          reject(
            new Error(
              `Unable to load image: ${src}`
            )
          );
        };

        img.src = src;
      });
    };

    // =====================================================
    // LOAD ORIGINAL ADMISSION FORM
    // =====================================================

    const formImage = await loadImage(
      "/admi.png"
    );

    console.log(
      "ADMISSION FORM LOADED:",
      formImage.naturalWidth,
      formImage.naturalHeight
    );

    // =====================================================
    // LOAD FRANCHISE LOGO THROUGH OUR API
    // =====================================================

    const logoProxyUrl =
      `/api/franchise-logo?url=${encodeURIComponent(
        franchiseLogo
      )}`;

    console.log(
      "LOGO PROXY:",
      logoProxyUrl
    );

    const logoImage =
      await loadImage(logoProxyUrl);

    console.log(
      "FRANCHISE LOGO LOADED:",
      logoImage.naturalWidth,
      logoImage.naturalHeight
    );

    // =====================================================
    // CREATE CANVAS
    // =====================================================

    const canvas =
      document.createElement("canvas");

    // Keep ORIGINAL admission form dimensions
    canvas.width =
      formImage.naturalWidth;

    canvas.height =
      formImage.naturalHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "Canvas is not supported."
      );
    }

    // =====================================================
    // DRAW ORIGINAL ADMISSION FORM
    // =====================================================

    ctx.drawImage(
      formImage,
      0,
      0,
      canvas.width,
      canvas.height
    );

// =====================================================
// FRANCHISE LOGO - ROUND DESIGN
// =====================================================

// Circle diameter
const logoSize = 180;

// Position - TOP CENTER
const logoX =
  (canvas.width - logoSize) / 2;

// Move logo higher/lower here
const logoY = 85;

// =====================================================
// DRAW WHITE CIRCULAR BACKGROUND
// =====================================================

const centerX =
  logoX + logoSize / 2;

const centerY =
  logoY + logoSize / 2;

const radius =
  logoSize / 2;

// White circular background
ctx.beginPath();

ctx.arc(
  centerX,
  centerY,
  radius,
  0,
  Math.PI * 2
);

ctx.fillStyle = "#ffffff";

ctx.fill();

// =====================================================
// ROUND GOLD BORDER
// =====================================================

ctx.beginPath();

ctx.arc(
  centerX,
  centerY,
  radius - 3,
  0,
  Math.PI * 2
);

ctx.lineWidth = 6;

ctx.strokeStyle = "#C9A24B";

ctx.stroke();

// =====================================================
// CLIP LOGO INTO CIRCLE
// =====================================================

ctx.save();

ctx.beginPath();

ctx.arc(
  centerX,
  centerY,
  radius - 7,
  0,
  Math.PI * 2
);

ctx.clip();

// =====================================================
// FIT LOGO INSIDE CIRCLE
// =====================================================

const padding = 12;

const availableSize =
  logoSize - padding * 2;

let logoWidth =
  logoImage.naturalWidth;

let logoHeight =
  logoImage.naturalHeight;

const scale =
  Math.min(
    availableSize / logoWidth,
    availableSize / logoHeight
  );

logoWidth *= scale;
logoHeight *= scale;

// Center the actual logo
const logoDrawX =
  centerX - logoWidth / 2;

const logoDrawY =
  centerY - logoHeight / 2;

// Draw logo
ctx.drawImage(
  logoImage,
  logoDrawX,
  logoDrawY,
  logoWidth,
  logoHeight
);

ctx.restore();

// =====================================================
// INSTITUTE NAME
// =====================================================

const instituteName =
  franchiseData.instituteName ||
  franchiseData.name ||
  "Institute";

ctx.save();

ctx.textAlign = "center";
ctx.textBaseline = "middle";

let fontSize = 42;

// Reduce font size for long institute names
if (instituteName.length > 35) {
  fontSize = 36;
}

if (instituteName.length > 50) {
  fontSize = 30;
}

if (instituteName.length > 65) {
  fontSize = 26;
}

ctx.font =
  `bold ${fontSize}px Arial, sans-serif`;

ctx.fillStyle = "#111827";

// Position directly below logo
const nameY =
  logoY + logoSize + 25;

ctx.fillText(
  instituteName,
  canvas.width / 2,
  nameY
);

ctx.restore();


    // =====================================================
    // CREATE PNG
    // =====================================================

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert(
            "Unable to create admission form."
          );
          return;
        }

        const downloadUrl =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        const franchiseName =
          franchiseData.instituteName ||
          franchiseData.name ||
          "Franchise";

        const safeName =
          franchiseName
            .toString()
            .replace(
              /[^a-zA-Z0-9]/g,
              "_"
            );

        link.download =
          `${safeName}_Admission_Form.png`;

        link.href = downloadUrl;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(
            downloadUrl
          );
        }, 1000);
      },
      "image/png"
    );

  } catch (error) {
    console.error(
      "ADMISSION FORM DOWNLOAD ERROR:",
      error
    );

    alert(
      "Unable to download admission form."
    );
  }
};

  return (
<div className="p-3 sm:p-6 space-y-6">
      {/* 🔥 TOP ACTION BUTTONS */}
      <div className="flex flex-wrap justify-end gap-3">

  <ActionButton
          icon={<UserPlus size={18} />}
          label="Make Payment"
          color="bg-[#0f172a]"
          onClick={() =>
            router.push("/login/institute/manage-student/payment")
          }
        />
        <ActionButton
          icon={<UserPlus size={18} />}
          label="Direct Admission"
          color="bg-[#0f172a]"
          onClick={() =>
            router.push("/login/institute/manage-student/admission/add")
          }
        />

        <ActionButton
          icon={<Wallet size={18} />}
          label="Fees Details"
          color="bg-red-500"
          onClick={() =>
            router.push("/login/institute/manage-student/fees")
          }
        />

        <ActionButton
          icon={<ClipboardCheck size={18} />}
          label="Take Attendance"
          color="bg-lime-500"
          onClick={() =>
            router.push("/login/institute/manage-attendance/attendance")
          }
        />

        <ActionButton
          icon={<Layers size={18} />}
          label="Batch Details"
          color="bg-red-400"
          onClick={() =>
            router.push("/login/institute/manage-attendance/batch")
          }
        />

        <ActionButton
  icon={<FileText size={18} />}
  label="Admission Form"
  color="bg-blue-600"
  onClick={handleAdmissionFormDownload}
/>

        {/* ✅ ID CARD BUTTON */}
       <ActionButton
  icon={<Layers size={18} />}
  label="ATC Certificate"
  color="bg-indigo-600"
  onClick={() => {
    if (window.innerWidth < 768) {
      setTimeout(() => {
        handleDownload();
      }, 300);
    } else {
      setShowIdCard(true);
    }
  }}
/>

      </div>

      {/* CARDS */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card title="Students" value={stats.students} />
        <Card title="Certificates" value={stats.certificates} />
        <Card title="Attendance Today" value={stats.attendance} />
        <Card title="Wallet" value={`₹ ${stats.wallet}`} />
        <Card title="Courier Wallet" value={`₹ ${stats.courierWallet}`} />
      </div>

      {/* GRAPH */}
<div className="bg-white p-4 sm:p-6 rounded-xl shadow overflow-x-auto">
          <h2 className="font-semibold mb-4">
          Admissions (Last Days)
        </h2>

        {chartData.length === 0 ? (
          <p className="text-gray-400">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ACTIVITY */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Recent Activity</h2>

        {activities.length === 0 ? (
          <p className="text-gray-400">No activity</p>
        ) : (
          activities.map((a, i) => (
            <div
              key={i}
              className="flex justify-between border-b py-2 text-sm"
            >
              <span>{a.text}</span>
              <span className="text-gray-400">{a.time}</span>
            </div>
          ))
        )}
      </div>

      {/* LOW WALLET ALERT */}
      {stats.wallet < 100 && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">
          ⚠ Low Wallet Balance! Please recharge.
        </div>
      )}
{showIdCard && franchiseData && (
  <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto">

    <div className="min-h-screen flex justify-center items-start sm:items-center p-2 sm:p-6">

      <div className="bg-white relative rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden">

        {/* TOP BAR */}
        <div className="sticky top-0 z-20 bg-white border-b flex items-center justify-between p-3 sm:p-4">

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg shadow hover:scale-105 transition-all"
          >
            Download Certificate
          </button>

          {/* CLOSE */}
          <button
            onClick={() => setShowIdCard(false)}
            className="text-2xl font-bold text-black"
          >
            ✖
          </button>
        </div>

        {/* CERTIFICATE CONTAINER */}
        <div className="flex justify-center items-center bg-gray-100 p-2 sm:p-6 overflow-auto">

          <div
            id="print-area"
            className="relative w-full max-w-[850px]"
          >

            {/* BACKGROUND */}
            <img
              src="/ATC.png"
              className="w-full h-auto block"
            />

            {/* QR */}
            {franchiseData.qrCode && (
              <img
                src={franchiseData.qrCode}
                className="absolute top-[590px] left-[130px] w-[100px]"
              />
            )}

            {/* INSTITUTE NAME */}
            <div className="absolute top-[500px] w-full text-center">
              <h1 className="text-red-600 text-2xl font-bold">
                {franchiseData.instituteName}
              </h1>
            </div>

            {/* ADDRESS */}
            <div className="absolute top-[550px] w-full text-center text-sm px-10">
              {franchiseData.address}, {franchiseData.city},{" "}
              {franchiseData.state} - {franchiseData.pincode}
            </div>

            {/* APPLICANT NAME */}
            <div className="absolute top-[580px] w-full text-center font-semibold">
              Applicant Name: {franchiseData.name}
            </div>

            {/* ATC CODE TOP */}
            <div className="absolute top-[620px] text-center w-full font-bold">
              ATC Code: {franchiseData.atcCode}
            </div>

            {/* ATC CODE BOTTOM */}
            <div className="absolute bottom-[90px] left-[220px] font-bold">
              ATC Code: {franchiseData.atcCode}
            </div>

            {/* ISSUE DATE */}
            <div className="absolute bottom-[70px] left-[220px] font-semibold">
              Issue Date:{" "}
              {formatDate(
                franchiseData.issueDate ||
                  franchiseData.$createdAt
              )}
            </div>

            {/* EXPIRY DATE */}
            <div className="absolute bottom-[50px] left-[220px] font-semibold">
              Expiry Date:{" "}
              {formatDate(getExpiryDate(franchiseData))}
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
)}
</div>
    
  );
}

function ActionButton({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-all`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition border">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold mt-2 text-blue-600">
        {value}
      </h2>
    </div>
  );
}