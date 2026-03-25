'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account, databases } from '@/lib/appwrite'
import Link from 'next/link'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstituteLayout({ children }) {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const checkAccess = async () => {
    try {
      const user = await account.get()
      setUserEmail(user.email)

      if (user.email === 'bnmiindia@gmail.com') {
        setLoading(false)
        return
      }

      const res = await databases.listDocuments(
        DATABASE_ID,
        'franchise_approved',
        [Query.equal('email', user.email)]
      )

      if (!res.documents.length) {
        await account.deleteSession('current')
        router.replace('/login/institute')
        return
      }

      setLoading(false)

    } catch {
      router.replace('/login/institute')
    }
  }

  checkAccess()
}, [router])

 const logout = async () => {
  await account.deleteSessions()
  router.replace('/login/institute')
}

  if (loading) return <div className="p-10">Checking access...</div>

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white p-6 space-y-4">

        <h2 className="text-xl font-bold mb-6">Institute Portal</h2>
        
        <button
          onClick={logout}
          className="w-full bg-red-500 py-2 rounded mt-6 hover:bg-red-600"  
        >
          Logout
        </button>

        <NavItem href="/login/institute/dashboard" label="Dashboard" />
        <NavItem href="/login/institute/add-course" label="Add New Course" />

     <DropdownMenu label="Manage Students">

  <NavItem href="/login/institute/manage-student/enquiry" label="Enquiry" />
  <NavItem href="/login/institute/manage-student/admission" label="Admission" />   
  <NavItem href="/login/institute/manage-student/readmission" label="Readmission" />
  <NavItem href="/login/institute/manage-student/fees" label="Fees" />

</DropdownMenu>
<DropdownMenu label="Student Exams">
        <NavItem href="/login/institute/student-exam/reset-exam" label="Reset Exam " />
        <NavItem href="/login/institute/student-exam/exam-code" label="Exam Code" />
        <NavItem href="/login/institute/student-exam/offline" label="Offline Exam Marks Update" />
        <NavItem href="/login/institute/student-exam/result" label="All Exam Results" />
        <NavItem href="/login/institute/student-exam/hall-ticket" label="Hall Ticket" />
        </DropdownMenu>

        
        <NavItem href="/login/institute/certificate" label="Certificates" />
        <NavItem href="/login/institute/wallet" label="My Wallet" />
        <NavItem href="/login/institute/courier-wallet" label="Courier Wallet" />
        <NavItem href="/login/institute/background-upload" label="Upload Background" />


<DropdownMenu label="Manage Attendance">
  <NavItem href="/login/institute/manage-attendance/batch" label="Batches" />
  <NavItem href="/login/institute/manage-attendance/attendance" label="Attendance" />
  <NavItem href="/login/institute/manage-attendance/report" label="Attendance Report" />
  <NavItem href="/login/institute/manage-attendance/student-wise" label="Student Wise Report" />
</DropdownMenu>

        <NavItem href="/login/institute/help-support" label="Help Support" />
        <NavItem href="/login/institute/marketing" label="Marketing Material" />
        <NavItem href="/login/institute/recharge-request" label="Recharge Request" />


      </aside>

      {/* Main Area */}
      <div className="flex-1">

        {/* Top Bar */}
        <div className="bg-white shadow p-4 flex justify-between">
          <h1 className="font-semibold">Welcome</h1>
          <span className="text-sm text-gray-600">
            {userEmail}
          </span>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  )
}

function NavItem({ href, label }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded hover:bg-slate-700 transition"
    >
      {label}
    </Link>
  )
}
function DropdownMenu({ label, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 transition flex justify-between items-center"
      >
        {label}
        <span>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="ml-4 mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}