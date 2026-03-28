'use client'

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account, databases } from '@/lib/appwrite'
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { storage } from '@/lib/appwrite'
import { ID } from 'appwrite'
const BUCKET_ID = "6986e8a4001925504f6b"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

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
  const [signatureFile, setSignatureFile] = useState(null)
  const [plans, setPlans] = useState([]);

  /* ---------------- LOGIN CHECK ---------------- */

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get()
        if (user.email !== 'bnmiindia@gmail.com') {
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
      const pendingRes = await databases.listDocuments(
        DATABASE_ID,
        'franchise_requests'
      )

      const approvedRes = await databases.listDocuments(
        DATABASE_ID,
        'franchise_approved'
      )

      const rejectedRes = await databases.listDocuments(
        DATABASE_ID,
        'franchise_rejected'
      )

      // ✅ latest on top
      setPending(pendingRes.documents.reverse())
      setApproved(approvedRes.documents.reverse())
      setRejected(rejectedRes.documents.reverse())

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }



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

    const admissions = await databases.listDocuments(
      DATABASE_ID,
      "student_admissions"
    )

    const enquiries = await databases.listDocuments(
      DATABASE_ID,
      "student_enquiries"
    )

    const data = {}

    admissions.documents.forEach(item => {
      const email = item.franchiseEmail
      data[email] = data[email] || { admissions: 0, enquiries: 0 }
      data[email].admissions++
    })

    enquiries.documents.forEach(item => {
      const email = item.franchiseEmail
      data[email] = data[email] || { admissions: 0, enquiries: 0 }
      data[email].enquiries++
    })

    setStats(data)
  }

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
    fetchAll()
    fetchStats()
    fetchPlans();
  }, [])

  /* ---------------- APPROVE ---------------- */
  const fixQR = async (req) => {
    try {

      const verifyUrl = `https://www.bnmiindia.org/verify/${req.$id}`

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

      // ✅ Always use LIVE DOMAIN
      const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${req.$id}`

      // ✅ Generate QR
      const qrCode = await QRCode.toDataURL(verifyUrl)

      // ✅ Create approved document
      await databases.createDocument(
        DATABASE_ID,
        'franchise_approved',
        req.$id,
        {
          ...req,
          qrCode,
          verifyUrl,
          wallet: req.wallet || "0.00",
          courierWallet: req.courierWallet || "0.00"
        }
      )

      // ✅ Delete from pending
      await databases.deleteDocument(
        DATABASE_ID,
        'franchise_requests',
        req.$id
      )

      fetchAll()

    } catch (error) {
      console.error("APPROVE ERROR:", error)
      alert(error.message)
    }
  }
  /* ---------------- REJECT ---------------- */

  const rejectFranchise = async (req) => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        'franchise_rejected',
        req.$id,
        { ...req }
      )

      await databases.deleteDocument(
        DATABASE_ID,
        'franchise_requests',
        req.$id
      )

      fetchAll()
    } catch (error) {
      console.error(error)
      alert('Reject failed')
    }
  }

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
      console.log("FULL ERROR:", err)
      alert(err?.message || "Update failed")
    }
  }


  const saveEdit = async () => {

    try {

      let updatedData = { ...editData }

      // -------- LOGO --------
      if (logoFile) {
        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          logoFile
        )

        updatedData.logo = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
      }

      // -------- OWNER PHOTO --------
      if (photoFile) {
        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photoFile
        )

        updatedData.ownerPhoto = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
      }

      // -------- SIGNATURE --------
      if (signatureFile) {
        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          signatureFile
        )

        updatedData.signature = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
      }

      if (editData.newPlanName && editData.newPlanAmount) {

  // ✅ Save new plan
  await databases.createDocument(
    DATABASE_ID,
    "franchise_plans",
    ID.unique(),
    {
      name: editData.newPlanName,
      amount: Number(editData.newPlanAmount),
    }
  );

  // ✅ Use it immediately
  updatedData.plan = editData.newPlanName;
}
delete updatedData.newPlanName;
delete updatedData.newPlanAmount;
      // ✅ VERY IMPORTANT → REMOVE FILE OBJECTS
      delete updatedData.logoFile
      delete updatedData.photoFile
      delete updatedData.signatureFile

      // -------- UPDATE DOCUMENT --------
      await databases.updateDocument(
        DATABASE_ID,
        "franchise_approved",
        editing, // make sure this is ID
        updatedData
      )

      alert("Updated successfully")

      setEditing(null)
      fetchAll()

    } catch (err) {

      console.error("UPDATE ERROR:", err)

      alert(err?.message || "Update failed")

    }
  }
  /* ---------------- FILTER ---------------- */

  const getCurrentData = () => {
    let data = []

    if (activeTab === 'pending') data = pending
    if (activeTab === 'approved') data = approved
    if (activeTab === 'rejected') data = rejected

    return data.filter(item =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.instituteName?.toLowerCase().includes(search.toLowerCase())
    )
  }

  /*...franchise plan ..*/
  const institutePlans = {
    "HOJAI": 400,
    "BIHAR": 499,
    "ARUNACHAL PRADESH": 499,
    "BEAUTY": 500
  }

  const downloadCertificate = async () => {

    const element = document.getElementById("print-area");

    const canvas = await html2canvas(element, {
      scale: 2, // better quality
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "mm", "a4");

    const imgWidth = 297; // A4 landscape width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save("BNMI_Certificate.pdf");
  };

  if (loading) return <div className="p-10">Loading...</div>

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Franchise Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Tab label={`Pending (${pending.length})`} active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
          <Tab label={`Approved (${approved.length})`} active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} />
          <Tab label={`Rejected (${rejected.length})`} active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')} />
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name, email, institute..."
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
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6 flex flex-col md:flex-row justify-between gap-6"
            >

              {/* LEFT */}
              <div className="space-y-1 text-sm text-gray-700">

                <h3 className="text-lg font-semibold text-gray-900">
                  {req.name}
                </h3>

                <p><b>Email:</b> {req.email}</p>
                <p><b>Password:</b> {req.password}</p>
                <p><b>Mobile:</b> {req.mobile}</p>
                <p><b>State:</b> {req.state}</p>
                <p><b>City:</b> {req.city}</p>
                <p><b>Institute:</b> {req.instituteName}</p>
                <p><b>ATC Code:</b> {req.atcCode}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    Admissions: {stats[req.email]?.admissions || 0}
                  </span>
                  <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                    Enquiries: {stats[req.email]?.enquiries || 0}
                  </span>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full">
                    Wallet: ₹{req.wallet || "0.00"}
                  </span>
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                    Courier: ₹{req.courierWallet || "0.00"}
                  </span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col justify-center gap-3">

                {/* Pending */}
                {activeTab === 'pending' && (
                  <div className="flex flex-wrap gap-3">
                    <ActionBtn label="Edit" color="yellow" onClick={() => openEdit(req)} />
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
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    )}

                    <ActionBtn label="Fix QR" color="purple" onClick={() => fixQR(req)} />
                    <ActionBtn label="Login" color="blue" onClick={() => loginAsFranchise(req)} />
                    <ActionBtn label="Edit" color="yellow" onClick={() => openEdit(req)} />
                    <ActionBtn label="ID Card" color="indigo" onClick={() => openIdCard(req)} />
                    <ActionBtn label="Print" color="dark" onClick={() => openPrint(req)} />
                    <ActionBtn label="Delete" color="red" onClick={() => deleteFranchise(req)} />
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

          <div className="bg-white p-8 w-[650px] rounded-xl shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">

            <h2 className="text-2xl font-bold text-center border-b pb-3">
              Edit Franchise Details
            </h2>

            {/* -------- BASIC DETAILS -------- */}

            <div className="grid grid-cols-2 gap-4">

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

              <div className="grid grid-cols-3 gap-4">

                <div>
                  <label className="text-sm">Owner Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">

          <div className="bg-white p-4 relative">

            <button
              onClick={() => setShowIdCard(false)}
              className="absolute top-2 right-3 text-xl"

            >
              ✖
            </button>

            {/* PRINT AREA */}
            <div id="print-area" className="relative w-[800px]">

              {/* Background Image */}
              <img
                src="/ATC.png"
                alt="certificate"
                className="w-full"
              />
              <img
                src={selectedFranchise.qrCode}
                className="absolute top-[510px] left-[130px] w-[100px]"
              />
              {/* ----------- DYNAMIC TEXT ----------- */}

              {/* Institute Name (RED CENTER) */}
              <div className="absolute top-[470px] w-full text-center">
                <h1 className="text-red-600 text-2xl font-bold">
                  {selectedFranchise.instituteName}
                </h1>
              </div>

              {/* ATC Code */}
              <div className="absolute top-[580px] left-[304px] font-bold">
                ATC Code: {selectedFranchise.atcCode}
              </div>

              {/* Owner Name */}
              <div className="absolute top-[540px] w-full text-center font-semibold">
                Applicant Name :  {selectedFranchise.name}
              </div>

              {/* Address */}
              <div className="absolute top-[520px] w-full text-center text-sm px-10">
                {selectedFranchise.address}{selectedFranchise.city}, {selectedFranchise.state} - {selectedFranchise.pincode}
              </div>

            </div>

            {/* PRINT BUTTON */}
            <button
              onClick={() => window.print()}
              className="mt-4 bg-black text-white px-4 py-2 w-full"
            >
              Print Certificate
            </button>

            <button
              onClick={downloadCertificate}
              className="mt-2 bg-green-600 text-white px-4 py-2 w-full"
            >
              Download PDF
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

              <p><strong>ATC Code:</strong> {selectedFranchise.atcCode}</p>

              <h2 className="font-bold text-lg">
                {selectedFranchise.instituteName}
              </h2>
              <p>{selectedFranchise.name}</p>


              <p>{selectedFranchise.address}</p>

              <p>Mobile: {selectedFranchise.mobile}</p>


              <p>
                {selectedFranchise.city}, {selectedFranchise.state} - {selectedFranchise.pincode}
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