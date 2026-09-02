'use client'

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account, databases } from '@/lib/appwrite'
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'
import * as htmlToImage from "html-to-image";
import { useRef } from "react";


const BUCKET_ID = "6986e8a4001925504f6b"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const CACHE_KEY = "bnmi-franchise-cache";
const CACHE_TIME = 60 * 60 * 1000; // 1 hour

export default function Dashboard() {

  const router = useRouter()

  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])

  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ NEW STATES
  const [stats, setStats] = useState({})
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})


  const [selectedFranchise, setSelectedFranchise] = useState(null)
  const [showIdCard, setShowIdCard] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  const [logoFile, setLogoFile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [certificateLogoFile, setCertificateLogoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [plans, setPlans] = useState([]);

  const printRef = useRef();
  /* ---------------- LOGIN CHECK ---------------- */

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get()
        if (user.email !== 'bnmiindia123@gmail.com') {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      }
    }
    checkSession()
  }, [])



  /* ---------------- FETCH DATA ---------------- */

const fetchAll = async () => {

  try {

    setLoading(true);

    const response = await fetch("/api/fetch-franchise-data");

    const data = await response.json();

    console.log("FETCH DATA:", data);

    if (data.success) {

      setPending(
        Array.isArray(data.pending)
          ? data.pending
          : []
      );

      setApproved(
        Array.isArray(data.approved)
          ? data.approved
          : []
      );

      setRejected(
        Array.isArray(data.rejected)
          ? data.rejected
          : []
      );

      localStorage.setItem(
  CACHE_KEY,
  JSON.stringify({
    pending: Array.isArray(data.pending) ? data.pending : [],
    approved: Array.isArray(data.approved) ? data.approved : [],
    rejected: Array.isArray(data.rejected) ? data.rejected : [],
    time: Date.now()
  })
);

    } else {

      console.log(data.error);

      setPending([]);
      setApproved([]);
      setRejected([]);

    }

  } catch (err) {

    console.error("FETCH ERROR:", err);

    setPending([]);
    setApproved([]);
    setRejected([]);

  } finally {

    setLoading(false);

  }

};


  const openIdCard = (req) => {
    setSelectedFranchise(req)
    setShowIdCard(true)
  }

  const openPrint = (req) => {
    setSelectedFranchise(req)
    setShowPrint(true)
  }



  /* ---------------- DELETE ---------------- */
  const deleteFranchise = async (req) => {
    try {

      const confirmDelete = confirm("Are you sure you want to delete this franchise?")

      if (!confirmDelete) return

      await databases.deleteDocument(
        DATABASE_ID,
        'franchise_approved',
        req.$id
      )

      alert("Franchise deleted successfully")

      fetchAll()

    } catch (error) {
      console.error(error)
      alert("Delete failed")
    }
  }

  /* ---------------- FETCH STATS ---------------- */

const fetchStats = async () => {

  try {

    // =========================
    // LOAD ALL TOGETHER
    // =========================

   const [
  admissions,
  enquiries,
  certificates
] = await Promise.all([

  databases.listDocuments(
    DATABASE_ID,
    "student_admissions",
    [
      Query.limit(5000)
    ]
  ),

  databases.listDocuments(
    DATABASE_ID,
    "student_enquiries",
    [
      Query.limit(5000)
    ]
  ),

  databases.listDocuments(
    DATABASE_ID,
    "certificates",
    [
      Query.limit(5000)
    ]
  )

]);

    const data = {};

    // =========================
    // ADMISSIONS COUNT
    // =========================

    admissions.documents.forEach((item) => {

      const email = item.franchiseEmail;

      if (!email) return;

      if (!data[email]) {

        data[email] = {
          admissions: 0,
          enquiries: 0,
          courier: 0
        };

      }

      data[email].admissions++;

    });

    // =========================
    // ENQUIRIES COUNT
    // =========================

    enquiries.documents.forEach((item) => {

      const email = item.franchiseEmail;

      if (!email) return;

      if (!data[email]) {

        data[email] = {
          admissions: 0,
          enquiries: 0,
          courier: 0
        };

      }

      data[email].enquiries++;

    });

    // =========================
    // COURIER WALLET
    // =========================

    certificates.documents.forEach((item) => {

      const email = item.franchiseEmail;

      if (!email) return;

      if (!data[email]) {

        data[email] = {
          admissions: 0,
          enquiries: 0,
          courier: 0
        };

      }

      // ₹50 per certificate
      data[email].courier += 50;

    });

    console.log("FINAL STATS:", data);

    setStats(data);

  } catch (err) {

    console.log("FETCH STATS ERROR:", err);

  }

};

  const fetchPlans = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_plans"
      );

      setPlans(res.documents);
    } catch (err) {
      console.error("Plan fetch error:", err);
    }
  };

 useEffect(() => {

  const cache = localStorage.getItem(CACHE_KEY);

  if (cache) {

    const parsed = JSON.parse(cache);

    if (Date.now() - parsed.time < CACHE_TIME) {

      console.log("Loaded Franchise Cache");

      setPending(parsed.pending);
      setApproved(parsed.approved);
      setRejected(parsed.rejected);

      setLoading(false);

    } else {

      fetchAll();

    }

  } else {

    fetchAll();

  }

  fetchStats();
  fetchPlans();

}, []);

  /* ---------------- APPROVE ---------------- */
  const fixQR = async (req) => {
    try {

     const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.bnmiindia.org";

const verifyUrl =
  `${BASE_URL}/verify/${req.$id}`;

      const qrCode = await QRCode.toDataURL(verifyUrl)

      await databases.updateDocument(
        DATABASE_ID,
        'franchise_approved',
        req.$id,
        { qrCode, verifyUrl }
      )

      alert("QR Updated")

    } catch (err) {
      console.error("FIX QR ERROR:", err)
      alert("QR fix failed")
    }
  }
const approveFranchise = async (req) => {

  try {

    const response = await fetch("/api/approve-franchise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    });

    const data = await response.json();

    console.log("APPROVE RESPONSE:", data);

    // IMPORTANT
    // DO NOT THROW ERROR IF DOC ALREADY CREATED

    if (data.success) {

      alert("Franchise approved successfully");

      fetchAll();

    } else {

      alert(data.error || "Approval failed");

    }

  } catch (err) {

    console.error("APPROVE FRONTEND ERROR:", err);

    alert(err.message);

  }

};

  /* ---------------- REJECT ---------------- */

const rejectFranchise = async (req) => {

  try {

    const res = await fetch("/api/reject-franchise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Reject failed");
    }

    alert("Franchise rejected successfully");

    fetchAll();

  } catch (err) {

    console.error(err);

    alert(err.message);

  }
};

  /* ---------------- LOGIN ---------------- */

  const loginAsFranchise = (req) => {
    router.push(`/login/institute?email=${req.email}&password=${req.password}`)
  }

  /* ---------------- EDIT ---------------- */

  const openEdit = (req) => {
    setEditing(req.$id)
    setEditData(req)
  }

  const uploadFile = async (file) => {

    if (!file) {
      alert("No file selected")
      return null
    }

    try {

      const res = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      )

      console.log("UPLOAD SUCCESS:", res)

      return res.$id

    } catch (err) {
      console.error("UPDATE ERROR:", err);
console.log("FULL ERROR", JSON.stringify(err, null, 2));

alert(
  err?.response?.message ||
  err?.message ||
  JSON.stringify(err)
);
    }
  }


const saveEdit = async () => {
  try {

    let updatedData = {
      name: editData.name,
      email: editData.email,
      password: editData.password,
      mobile: editData.mobile,
      plan: editData.plan,
      state: editData.state,
      city: editData.city,
      pincode: editData.pincode,
      instituteName: editData.instituteName,
      atcCode: editData.atcCode,
      address: editData.address,
      verificationDate: editData.verificationDate,
      expireDate: editData.expireDate,
    };

    // IMPORTANT:
    // Wallet is managed separately from franchise editing.
    // Prevent old wallet data from overwriting latest balance.
    delete updatedData.wallet;
    delete updatedData.courierWallet;
    delete updatedData.lastRecharge;


    // =====================================================
    // LOGO
    // =====================================================

    let oldLogoFileId = null;

    if (logoFile) {

      try {

        console.log("Uploading new logo:", logoFile);

        // ---------------------------------------------
        // 1. Get OLD logo file ID from existing URL
        // ---------------------------------------------
        if (editData.logo) {

          try {

            const oldLogoUrl = new URL(editData.logo);

            const pathParts = oldLogoUrl.pathname.split("/");

            const filesIndex = pathParts.indexOf("files");

            if (filesIndex !== -1 && pathParts[filesIndex + 1]) {
              oldLogoFileId = pathParts[filesIndex + 1];

              console.log(
                "Old logo file ID:",
                oldLogoFileId
              );
            }

          } catch (error) {

            console.log(
              "Could not extract old logo file ID:",
              error
            );

          }

        }


        // ---------------------------------------------
        // 2. Upload NEW logo
        // ---------------------------------------------

        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          logoFile
        );

        console.log(
          "New logo uploaded:",
          res.$id
        );


        // ---------------------------------------------
        // 3. Create NEW logo URL
        // ---------------------------------------------

        const newLogoUrl =
          `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&v=${Date.now()}`;


        // ---------------------------------------------
        // 4. Put NEW logo URL into database update
        // ---------------------------------------------

        updatedData.logo = newLogoUrl;


        // ---------------------------------------------
        // 5. Update database FIRST
        // ---------------------------------------------

        await databases.updateDocument(
          DATABASE_ID,
          "franchise_approved",
          editing,
          updatedData
        );


        // ---------------------------------------------
        // 6. Database successfully updated
        //    NOW delete OLD logo
        // ---------------------------------------------

        if (oldLogoFileId) {

          try {

            await storage.deleteFile(
              BUCKET_ID,
              oldLogoFileId
            );

            console.log(
              "Old logo deleted:",
              oldLogoFileId
            );

          } catch (deleteError) {

            // Don't fail the entire update if
            // old logo deletion fails.

            console.error(
              "OLD LOGO DELETE ERROR:",
              deleteError
            );

          }

        }

      } catch (logoError) {

        console.error(
          "LOGO UPDATE ERROR:",
          logoError
        );

        alert(
          "Logo update failed: " +
          (logoError?.message || "Unknown error")
        );

        return;
      }

    } else {

      // =================================================
      // NO NEW LOGO
      // Just update normal franchise information
      // =================================================

      await databases.updateDocument(
        DATABASE_ID,
        "franchise_approved",
        editing,
        updatedData
      );

    }


    // =====================================================
    // CERTIFICATE LOGO
    // =====================================================

    if (certificateLogoFile) {

      const res = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        certificateLogoFile
      );

      updatedData.certificateLogo =
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&v=${Date.now()}`;

    }


    // =====================================================
    // OWNER PHOTO
    // =====================================================

    if (photoFile) {

      try {

        console.log(
          "Uploading owner photo:",
          photoFile
        );

        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photoFile
        );

        console.log(
          "Photo upload success:",
          res.$id
        );

        updatedData.ownerPhoto =
          `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&v=${Date.now()}`;

      } catch (error) {

        console.error(
          "PHOTO UPLOAD ERROR:",
          error
        );

        alert(
          JSON.stringify(error, null, 2)
        );

        return;
      }

    }


    // =====================================================
    // SIGNATURE
    // =====================================================

    if (signatureFile) {

      const res = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        signatureFile
      );

      updatedData.signature =
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&v=${Date.now()}`;

    }


    // =====================================================
    // CUSTOM PLAN
    // =====================================================

    if (
      editData.newPlanName &&
      editData.newPlanAmount
    ) {

      await databases.createDocument(
        DATABASE_ID,
        "franchise_plans",
        ID.unique(),
        {
          name: editData.newPlanName,
          amount: Number(editData.newPlanAmount),
        }
      );

      updatedData.plan =
        editData.newPlanName;
    }


    delete updatedData.newPlanName;
    delete updatedData.newPlanAmount;


    // =====================================================
    // REMOVE FILE OBJECTS
    // =====================================================

    delete updatedData.logoFile;
    delete updatedData.certificateLogoFile;
    delete updatedData.photoFile;
    delete updatedData.signatureFile;


    // =====================================================
    // IMPORTANT
    // If logo was NOT changed, we already updated DB above.
    // If other files/details were changed, update DB again
    // with the latest values.
    // =====================================================

    await databases.updateDocument(
      DATABASE_ID,
      "franchise_approved",
      editing,
      updatedData
    );


    // =====================================================
    // UPDATE AUTH EMAIL
    // =====================================================

    if (editData.email && editData.userId) {

      await fetch("/api/change-email", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          userId: editData.userId,
          email: editData.email
        })
      });

    }


    // =====================================================
    // UPDATE AUTH PASSWORD
    // =====================================================

    if (editData.password && editData.userId) {

      await fetch("/api/change-password", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          userId: editData.userId,
          newPassword: editData.password
        })
      });

    }


    // =====================================================
    // CLEAR CACHE
    // =====================================================

    localStorage.removeItem(CACHE_KEY);


    alert("Updated successfully");


    setEditing(null);


    // Fetch latest database data
    await fetchAll();


  } catch (err) {

    console.error(
      "UPDATE ERROR:",
      err
    );

    alert(
      err?.message ||
      "Update failed"
    );

  }
};



const fixUser = async (req) => {
  try {
    // ✅ 1. Create / Get user
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: req.email,
        password: req.password
      })
    });

    const data = await res.json();

    if (!data.userId) {
      throw new Error(data.error || "User creation failed");
    }

    const userId = data.userId;

    // ✅ 2. FORCE UPDATE PASSWORD IN AUTH (IMPORTANT)
    await fetch("/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        newPassword: req.password
      })
    });

    // ✅ 3. Save userId in DB
    await databases.updateDocument(
      DATABASE_ID,
      "franchise_approved",
      req.$id,
      { userId }
    );

    alert("User fixed successfully ✅");

    fetchAll();

  } catch (err) {
    console.error(err);
    alert("Fix failed: " + err.message);
  }
};
  /* ---------------- FILTER ---------------- */

 const getCurrentData = () => {

  let data = [];

  // =========================
  // PENDING
  // =========================

  if (activeTab === "pending") {

    // REMOVE ALREADY APPROVED REQUESTS
    data = pending.filter((item) => {

      if (!item) return false;

      const alreadyApproved = approved.some(
        (a) => a.requestId === item.$id
      );

      return !alreadyApproved;
    });

  }

  // =========================
  // APPROVED
  // =========================

  if (activeTab === "approved") {
    data = approved;
  }

  // =========================
  // REJECTED
  // =========================

  if (activeTab === "rejected") {
    data = rejected;
  }

  // =========================
  // SEARCH FILTER
  // =========================

  return data.filter((item) => {

    if (!item) return false

    const searchText = search.toLowerCase();

  return (
  (item.name || "").toLowerCase().includes(searchText) ||
  (item.email || "").toLowerCase().includes(searchText) ||
  (item.instituteName || "").toLowerCase().includes(searchText) ||
  (item.amcCode || "").toLowerCase().includes(searchText) ||
  (item.atcCode || "").toLowerCase().includes(searchText) ||
  (item.mobile || "").toLowerCase().includes(searchText) ||
  (item.state || "").toLowerCase().includes(searchText) ||
  (item.city || "").toLowerCase().includes(searchText) ||
  (item.pincode || "").toLowerCase().includes(searchText)
);

  });

};

  

  const toBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

  const handleDownload = async () => {
  try {
    const node = document.getElementById("print-area");

    if (!node) {
      alert("ID Card not found");
      return;
    }

    const rect = node.getBoundingClientRect();

    await new Promise(resolve => setTimeout(resolve, 500));

    // ✅ FIX IMAGE ISSUE
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
      style: {
        width: rect.width + "px",
        height: rect.height + "px"
      }
    });

    const link = document.createElement("a");
    link.download = `${selectedFranchise?.name || "id-card"}.png`;
    link.href = dataUrl;
    link.click();

  } catch (err) {
    console.log("DOWNLOAD ERROR:", err);
  }
};


const formatDate = (date) => {
  if (!date) return "N/A"

  const d = new Date(date)

  if (isNaN(d.getTime())) return "N/A"

  return d.toLocaleDateString("en-GB") // DD/MM/YYYY
}


const getIssueDate = () => {
  return selectedFranchise?.issueDate || selectedFranchise?.$createdAt;
};

const getExpiryDate = () => {
  const base = new Date(getIssueDate());
  if (isNaN(base)) return null;

  base.setFullYear(base.getFullYear() + 1);
  return base;
};

const toggleStatus = async (req) => {
  try {

    const newStatus = !(req.isActive ?? true);

    await databases.updateDocument(
      DATABASE_ID,
      "franchise_approved",
      req.$id,
      {
        isActive: newStatus
      }
    );

    alert(
      newStatus
        ? "Franchise Activated Successfully"
        : "Franchise Deactivated Successfully"
    );

    fetchAll();

  } catch (error) {
    console.error(error);
    alert("Status update failed");
  }
};
  if (loading) return <div className="p-10">Loading...</div>



  return (
    <>
  <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">

        {/* Header */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-6 md:mb-8">
          Franchise Dashboard
        </h1>
        <button
  onClick={() => {
    localStorage.removeItem(CACHE_KEY);
    fetchAll();
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-5"
>
  🔄 Refresh Data
</button>

        {/* Tabs */}
   <div className="flex flex-wrap gap-3 mb-6">
         <Tab
  label={`Pending (${
    pending.filter((item) => {

      if (!item) return false;

      const alreadyApproved = approved.some(
        (a) => a.requestId === item.$id
      );

      return !alreadyApproved;

    }).length
  })`}
  active={activeTab === 'pending'}
  onClick={() => setActiveTab('pending')}
/>
          <Tab label={`Approved (${approved.length})`} active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} />
          <Tab label={`Rejected (${rejected.length})`} active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')} />
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
placeholder="Search by institute, name, ATC/AMC code, mobile, state, city, pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* List */}
        <div className="grid gap-6">

          {getCurrentData().length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No records found
            </div>
          )}

       {getCurrentData().map((req) => (
            <div
              key={req.$id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 md:p-6 flex flex-col lg:flex-row justify-between gap-4 md:gap-6"
            >

              {/* LEFT */}
             <div className="flex-1 min-w-[250px] space-y-1 text-sm text-gray-700">

                <h3 className="text-lg font-semibold text-gray-900">
                  
                   Institute: {req?.instituteName}
                </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
  <p><b>Name:</b> {req.name}</p>
  <p><b>Email:</b> {req.email}</p>
  <p><b>Password:</b> {req.password}</p>
  <p><b>Mobile:</b> {req.mobile}</p>
  <p><b>State:</b> {req.state}</p>
  <p><b>City:</b> {req.city}</p>
  <p><b>Pincode:</b> {req.pincode}</p>
  <p><b>ATC Code:</b> {req.atcCode}</p>
  <p><b>Address:</b> {req.address}</p>
  <p><b>Amc Code:</b> {req.amcCode}</p>
</div>
                {/* Stats */}
               
               <div className="flex flex-wrap gap-4 mt-4">

  <span className="bg-blue-100 text-blue-700 px-5 py-3 rounded-xl text-base font-bold shadow-sm">
    Admissions: {stats[req.email]?.admissions || 0}
  </span>

  <span className="bg-purple-100 text-purple-700 px-5 py-3 rounded-xl text-base font-bold shadow-sm">
    Enquiries: {stats[req.email]?.enquiries || 0}
  </span>

  <span className="bg-green-100 text-green-700 px-5 py-3 rounded-xl text-base font-bold shadow-sm">
    Wallet: ₹{req.wallet || "0.00"}
  </span>

  <span className="bg-orange-100 text-orange-700 px-5 py-3 rounded-xl text-base font-bold shadow-sm">
    Courier Wallet: ₹{req.courierWallet || "0.00"}
  </span>

</div>
              </div>
                      {/* RIGHT */}
            <div className="w-full lg:w-auto flex flex-wrap items-center gap-3 justify-start lg:justify-end">

                {/* Pending */}
                {activeTab === 'pending' && (
                <div className="flex flex-wrap gap-2 md:gap-3">
                 
                    <ActionBtn label="Approve" color="green" onClick={() => approveFranchise(req)} />
                    <ActionBtn label="Reject" color="red" onClick={() => rejectFranchise(req)} />
                  </div>
                )}

                {/* Approved */}
                {activeTab === 'approved' && (
                  <div className="flex flex-wrap gap-3 items-center">

                    {req.logo && (
                      <img
                        src={req.logo}
                      className="h-12 w-12 md:h-14 md:w-14 rounded-lg object-cover border"
                      />
                    )}

                    <ActionBtn label="Fix QR" color="purple" onClick={() => fixQR(req)} />
                      <ActionBtn label="Fix User" color="purple" onClick={() => fixUser(req)} />
                    <ActionBtn label="Login" color="blue" onClick={() => loginAsFranchise(req)} />
                    <ActionBtn label="Edit" color="yellow" onClick={() => openEdit(req)} />
                    <ActionBtn
  label="ATC"
  color="indigo"
  onClick={() => req && openIdCard(req)}
/>
                    <ActionBtn
  label="Print"
  color="dark"
  onClick={() => req && openPrint(req)}
/>
                    <ActionBtn label="Delete" color="red" onClick={() => deleteFranchise(req)} />
                      <ActionBtn
  label={req.isActive === false ? "Activate" : "Deactivate"}
  color={req.isActive === false ? "green" : "red"}
  onClick={() => toggleStatus(req)}
/>
                  </div>
                )}

              </div>

            </div>
          ))}

        </div>
      </div>

      {/* ✅ EDIT MODAL */}

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white p-4 md:p-6 w-full max-w-2xl rounded-xl shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">

            <h2 className="text-2xl font-bold text-center border-b pb-3">
              Edit Franchise Details
            </h2>

            {/* -------- BASIC DETAILS -------- */}

   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="text"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="text"
                  value={editData.password || ""}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mobile</label>
                <input
                  type="text"
                  value={editData.mobile || ""}
                  onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Plan</label>
                <select
                  value={editData.plan || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, plan: e.target.value })
                  }
                  className="w-full border p-3 rounded-lg"
                >
                  <option value="">--Select Plan--</option>

                  {plans.map((plan) => (
                    <option key={plan.$id} value={plan.name}>
                      {plan.name} (₹{plan.amount})
                    </option>
                  ))}
                </select>
              </div>
              <input
  type="text"
  placeholder="Custom Plan Name"
  value={editData.newPlanName || ""}
  onChange={(e) =>
    setEditData({ ...editData, newPlanName: e.target.value })
  }
  className="w-full border p-3 rounded-lg"
/>

<input
  type="number"
  placeholder="Custom Plan Amount"
  value={editData.newPlanAmount || ""}
  onChange={(e) =>
    setEditData({ ...editData, newPlanAmount: e.target.value })
  }
  className="w-full border p-3 rounded-lg mt-2"
/>

              <div>
                <label className="text-sm font-medium">State</label>
                <input
                  type="text"
                  value={editData.state || ""}
                  onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">City</label>


                <input
                  type="text"
                  value={editData.city || ""}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Pincode</label>
                <input
                  type="text"
                  value={editData.pincode || ""}
                  onChange={(e) => setEditData({ ...editData, pincode: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Institute</label>
                <input
                  type="text"
                  value={editData.instituteName || ""}
                  onChange={(e) => setEditData({ ...editData, instituteName: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">ATC Code</label>
                <input
                  type="text"
                  value={editData.atcCode || ""}
                  onChange={(e) => setEditData({ ...editData, atcCode: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                  rows={3}
                />
              </div>

            </div>

            {/* -------- FILE UPLOAD SECTION -------- */}

            <div className="border-t pt-4 space-y-3">

              <h3 className="font-semibold text-gray-700">
                Upload Documents
              </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="text-sm">Owner Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}

                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm">Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>             

                <div>
  <label className="text-sm">Certificate Logo</label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setCertificateLogoFile(e.target.files[0])
    }
    className="w-full border p-2 rounded-lg"
  />
</div>                    
              
                <div>
                  <label className="text-sm">Signature</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSignatureFile(e.target.files[0])}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

              </div>

            </div>

            {/* -------- DATE SECTION -------- */}

            <div className="border-t pt-4 grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm font-medium">Verification Date</label>
                <input
                  type="date"
                  value={editData.verificationDate || ""}
                  onChange={(e) => setEditData({ ...editData, verificationDate: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Expire Date</label>
                <input
                  type="date"
                  value={editData.expireDate || ""}
                  onChange={(e) => setEditData({ ...editData, expireDate: e.target.value })}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

            </div>

            {/* -------- ACTION BUTTONS -------- */}

            <div className="flex justify-end gap-4 pt-4 border-t">

              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-5 py-2 bg-green-600 text-white rounded-lg"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>
      )}


      {showIdCard && selectedFranchise && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start overflow-y-auto z-50 p-6">

          <div className="bg-white p-4 md:p-6 relative max-w-full overflow-auto">

            <button
              onClick={() => setShowIdCard(false)}
              className="absolute top-2 right-3 text-xl"

            >
              ✖
            </button>

            {/* PRINT AREA */}
            <div id="print-area" style={{ width: "800px", position: "relative" }}>

              {/* Background Image */}
              <img
                src="/ATC.png"
                alt="certificate"
                className="w-full"
              />
              <img
                src={selectedFranchise?.qrCode}
                className="absolute top-[555px] left-[100px] w-[100px]"
              />
              {/* ----------- DYNAMIC TEXT ----------- */}

              {/* Institute Name (RED CENTER) */}
          
<div className="absolute top-[460px] left-0 w-full flex justify-center px-20">
  <h1 className="text-red-600 text-2xl font-bold text-center break-words leading-tight max-w-[650px]">
    {selectedFranchise?.instituteName}
  </h1>
</div>

              {/* ATC Code */}
              <div className="absolute top-[590px] left-[304px] font-bold">
                ATC Code: {selectedFranchise?.atcCode}
              </div>

              {/* Owner Name */}
              <div className="absolute top-[564px] w-full text-center font-semibold">
                Applicant Name :  {selectedFranchise?.name}
              </div>

              {/* Address */}
              <div className="absolute top-[520px] w-full text-center text-sm px-20">
                {selectedFranchise?.address}  {selectedFranchise?.city}, {selectedFranchise?.state} - {selectedFranchise?.pincode}
              </div>

                <div className="absolute bottom-[90px] left-[220px] font-bold">
                ATC Code: {selectedFranchise?.atcCode}
              </div>

              {/* Issue Date */}
<div className="absolute bottom-[70px] left-[220px] font-semibold">
  Issue Date: {formatDate(getIssueDate())}
</div>

{/* Expiry Date */}
<div className="absolute bottom-[50px] left-[220px] font-semibold">
Expiry Date: {formatDate(getExpiryDate())}
</div>

            </div>

            {/* PRINT BUTTON */}
           <button
  onClick={handleDownload}
  className="bg-green-600 text-white px-6 py-2 mb-6 ml-4"
>
  Download Certificate
</button>

          </div>

        </div>
      )}

      {showPrint && selectedFranchise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

          <div className="bg-white p-6 w-[600px] relative">

            <button
              onClick={() => setShowPrint(false)}
              className="absolute top-2 right-3 text-xl"
            >
              ✖
            </button>

            <div className="space-y-2">

              <p><strong>To,</strong></p>

              <p><strong>ATC Code:</strong> {selectedFranchise?.atcCode}</p>

              <h2 className="font-bold text-lg">
                {selectedFranchise?.instituteName}
              </h2>
              <p>{selectedFranchise?.name}</p>


              <p>{selectedFranchise?.address}</p>

              <p>Mobile: {selectedFranchise?.mobile}</p>


              <p>
                {selectedFranchise?.city}, {selectedFranchise?.state} - {selectedFranchise?.pincode}
              </p>

            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 bg-black text-white px-4 py-2"
            >
              Print
            </button>

          </div>

        </div>
      )}


    </>

  )
}


function ActionBtn({ label, color, onClick }) {

  const colors = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-pink-500",
    yellow: "from-yellow-400 to-orange-500",
    purple: "from-purple-500 to-indigo-500",
    indigo: "from-indigo-500 to-purple-600",
    dark: "from-gray-700 to-gray-900",
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r ${colors[color]} shadow hover:scale-105 hover:shadow-lg transition`}
    >
      {label}
    </button>
  )
}
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition
        ${active
          ? 'bg-blue-600 text-white shadow'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'}
      `}
    >
      {label}
    </button>
  )
}