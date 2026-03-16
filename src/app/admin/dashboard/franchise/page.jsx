'use client'

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account, databases } from '@/lib/appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function Dashboard() {

  const router = useRouter()

  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])

  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

      setPending(pendingRes.documents)
      setApproved(approvedRes.documents)
      setRejected(rejectedRes.documents)

    } catch (err) {

      console.error('Fetch error:', err)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {
    fetchAll()
  }, [])



  /* ---------------- APPROVE ---------------- */

  const approveFranchise = async (req) => {

    try {

      await databases.createDocument(
        DATABASE_ID,
        'franchise_approved',
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
      alert('Approval failed')

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



  /* ---------------- LOGIN AS FRANCHISE ---------------- */

 const loginAsFranchise = (req) => {

  const email = encodeURIComponent(req.email)
  const password = encodeURIComponent(req.password)

  router.push(`/login/institute?email=${email}&password=${password}`)

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



  if (loading) return <div className="p-10">Loading...</div>



  return (

    <div className="p-10">

      <h1 className="text-2xl font-bold mb-8">
        Franchise Dashboard
      </h1>


      {/* ---------------- TABS ---------------- */}

      <div className="flex gap-6 mb-6">

        <Tab
          label={`Pending (${pending.length})`}
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        />

        <Tab
          label={`Approved (${approved.length})`}
          active={activeTab === 'approved'}
          onClick={() => setActiveTab('approved')}
        />

        <Tab
          label={`Rejected (${rejected.length})`}
          active={activeTab === 'rejected'}
          onClick={() => setActiveTab('rejected')}
        />

      </div>



      {/* ---------------- SEARCH ---------------- */}

      <input
        type="text"
        placeholder="Search by name, email, institute..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-4 py-2 mb-8 w-full rounded-lg"
      />


      {/* ---------------- LIST ---------------- */}

      <div className="space-y-4">

        {getCurrentData().length === 0 && (
          <p>No records found</p>
        )}



        {getCurrentData().map((req) => (

          <div
            key={req.$id}
            className="border p-5 rounded-lg flex justify-between items-center"
          >

            <div>

              <h3 className="font-bold text-lg">
                Name: {req.name}
              </h3>

              <p className="text-sm text-gray-500">
                Email: {req.email}
              </p>

              <p className="text-sm text-gray-500">
                Password: {req.password}
              </p>

              <p className="text-sm text-gray-500">
                Mobile: {req.mobile}
              </p>

              <p className="text-sm text-gray-500">
                State: {req.state}
              </p>

              <p className="text-sm text-gray-500">
                Institute: {req.instituteName}
              </p>

              <p className="text-sm text-gray-500">
                ATC Code: {req.atcCode}
              </p>

              <p className="text-sm text-gray-500">
                Wallet: ₹{req.wallet || "0.00"}
              </p>

              <p className="text-sm text-gray-500">
                Courier Wallet: ₹{req.courierWallet || "0.00"}
              </p>

            </div>



            {/* ---------------- BUTTONS ---------------- */}

            {activeTab === 'pending' && (

              <div className="flex gap-3">

                <button
                  onClick={() => approveFranchise(req)}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectFranchise(req)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Reject
                </button>

              </div>

            )}



            {activeTab === 'approved' && (

              <button
                onClick={() => loginAsFranchise(req)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Login
              </button>

            )}

          </div>

        ))}

      </div>

    </div>

  )

}



/* ---------------- TAB COMPONENT ---------------- */

function Tab({ label, active, onClick }) {

  return (

    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-semibold transition
      ${active
          ? 'bg-black text-white'
          : 'bg-gray-200 hover:bg-gray-300'
        }`}
    >

      {label}

    </button>

  )

}