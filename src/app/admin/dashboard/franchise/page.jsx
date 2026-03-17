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

  useEffect(() => {
    fetchAll()
    fetchStats()
  }, [])

  /* ---------------- APPROVE ---------------- */

 const approveFranchise = async (req) => {
  try {

    const verifyUrl = `${window.location.origin}/verify/${req.$id}`

    const qrCode = await QRCode.toDataURL(verifyUrl)

    await databases.createDocument(
      DATABASE_ID,
      'franchise_approved',
      req.$id,
      {
        ...req,
        qrCode: qrCode, // ✅ save QR image
        verifyUrl: verifyUrl // optional
      }
    )

    await databases.deleteDocument(
      DATABASE_ID,
      'franchise_requests',
      req.$id
    )

    fetchAll()

  } catch (error) {
    console.error(error)
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

  }catch (err) {
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
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-8">
        Franchise Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-6 mb-6">
        <Tab label={`Pending (${pending.length})`} active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
        <Tab label={`Approved (${approved.length})`} active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} />
        <Tab label={`Rejected (${rejected.length})`} active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')} />
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email, institute..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-4 py-2 mb-8 w-full rounded-lg"
      />

      {/* List */}
      <div className="space-y-4">

        {getCurrentData().length === 0 && <p>No records found</p>}

        {getCurrentData().map((req) => (

          <div key={req.$id} className="border p-5 rounded-lg flex justify-between items-center">

            <div>
              <h3 className="font-bold text-lg">Name: {req.name}</h3>
              <p>UserName: {req.email}</p>
              <p>Password: {req.password}</p>
              <p>Mobile: {req.mobile}</p>
              <p>State: {req.state}</p>
              <p>Institute: {req.instituteName}</p>
              <p>City: {req.city}</p>
              <p>Pincode: {req.pincode}</p>
              <p>ATC Code: {req.atcCode}</p>

              {/* ✅ NEW STATS */}
              <p>Admissions: {stats[req.email]?.admissions || 0}</p>
              <p>Enquiries: {stats[req.email]?.enquiries || 0}</p>

              <p>Wallet: ₹{req.wallet || "0.00"}</p>
              <p>Courier Wallet: ₹{req.courierWallet || "0.00"}</p>
            </div>

            {/* Buttons */}

            {activeTab === 'pending' && (
              <div className="flex gap-3">

                {/* ✅ EDIT */}
                <button
                  onClick={() => openEdit(req)}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => approveFranchise(req)}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectFranchise(req)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white"
                >
                  Reject
                </button>
              </div>
            )}

      {activeTab === 'approved' && (
  <div className="flex gap-3 flex-wrap">
{req.logo && (
  <img
    src={req.logo}
    className="h-30 w-20 object-cover rounded mb-2"
  />
)}
    <button
      onClick={() => loginAsFranchise(req)}
      className="px-4 py-2 rounded-lg bg-blue-500 text-white h-16"
    >
      Login
    </button>

    <button
      onClick={() => openEdit(req)}
      className="px-4 py-2 rounded-lg bg-yellow-500 text-white  h-16"
    >
      Edit
    </button>

    <button
      onClick={() => openIdCard(req)}
      className="px-4 py-2 rounded-lg bg-purple-600 text-white  h-16"
    >
      ID Card
    </button>

    <button
      onClick={() => openPrint(req)}
      className="px-4 py-2 rounded-lg bg-gray-800 text-white  h-16"
    >
      Print Address
    </button>

    <button
      onClick={() => deleteFranchise(req)}
      className="px-4 py-2 rounded-lg bg-red-600 text-white  h-16"
    >
      Delete
    </button>

  </div>
)}
          </div>

        ))}

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
            onChange={(e)=>setEditData({...editData, name:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="text"
            value={editData.email || ""}
            onChange={(e)=>setEditData({...editData, email:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="text"
            value={editData.password || ""}
            onChange={(e)=>setEditData({...editData, password:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mobile</label>
          <input
            type="text"
            value={editData.mobile || ""}
            onChange={(e)=>setEditData({...editData, mobile:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">State</label>
          <input
            type="text"
            value={editData.state || ""}
            onChange={(e)=>setEditData({...editData, state:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">City</label>
          <input
            type="text"
            value={editData.city || ""}
            onChange={(e)=>setEditData({...editData, city:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Pincode</label>
          <input
            type="text"
            value={editData.pincode || ""}
            onChange={(e)=>setEditData({...editData, pincode:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Institute</label>
          <input
            type="text"
            value={editData.instituteName || ""}
            onChange={(e)=>setEditData({...editData, instituteName:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">ATC Code</label>
          <input
            type="text"
            value={editData.atcCode || ""}
            onChange={(e)=>setEditData({...editData, atcCode:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium">Address</label>
          <textarea
            value={editData.address || ""}
            onChange={(e)=>setEditData({...editData, address:e.target.value})}
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
  onChange={(e)=>setLogoFile(e.target.files[0])}
    className="w-full border p-2 rounded-lg"
/>
          </div>

          <div>
            <label className="text-sm">Signature</label>
            <input
  type="file"
  accept="image/*"
  onChange={(e)=>setSignatureFile(e.target.files[0])}
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
            onChange={(e)=>setEditData({...editData, verificationDate:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Expire Date</label>
          <input
            type="date"
            value={editData.expireDate || ""}
            onChange={(e)=>setEditData({...editData, expireDate:e.target.value})}
            className="w-full border p-3 rounded-lg"
          />
        </div>

      </div>

      {/* -------- ACTION BUTTONS -------- */}

      <div className="flex justify-end gap-4 pt-4 border-t">

        <button
          onClick={()=>setEditing(null)}
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
  className="absolute top-[520px] left-[130px] w-[100px]"
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


    </div>
  )
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-semibold transition
        ${active ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'}
      `}
    >
      {label}
    </button>
  )
}