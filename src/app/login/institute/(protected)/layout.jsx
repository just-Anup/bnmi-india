'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { account, databases } from '@/lib/appwrite'
import Link from 'next/link'
import { Query } from 'appwrite'
import { Menu, X } from 'lucide-react'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstituteLayout({ children }) {

  const router = useRouter()

  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ MOBILE SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  if (loading) {
    return <div className="p-10">Checking access...</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setSidebarOpen(true)}
className="fixed top-4 left-4 z-[100] bg-[#0f172a] text-white p-2 rounded-lg lg:hidden shadow-lg"      >
        <Menu size={22} />
      </button>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
className="fixed inset-0 bg-black/50 z-[80] lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
  fixed lg:static top-0 left-0 h-full
  w-72 bg-[#0f172a] text-white p-6 space-y-4 z-[90]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 overflow-y-auto
        `}
      >

        {/* MOBILE CLOSE */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <h2 className="text-xl font-bold">
            Institute Portal
          </h2>

          <button onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        {/* DESKTOP TITLE */}
        <h2 className="text-xl font-bold mb-6 hidden lg:block">
          Institute Portal
        </h2>

        <button
          onClick={logout}
          className="w-full bg-red-500 py-2 rounded mt-6 hover:bg-red-600 transition"
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
          <NavItem href="/login/institute/student-exam/reset-exam" label="Reset Exam" />
          <NavItem href="/login/institute/student-exam/exam-code" label="Exam Code" />
          <NavItem href="/login/institute/student-exam/offline" label="Exam Marks Update" />
          <NavItem href="/login/institute/student-exam/result" label="All Exam Results" />
          <NavItem href="/login/institute/student-exam/hall-ticket" label="Hall Ticket" />
        </DropdownMenu>

        <DropdownMenu label="Certificates">
          <NavItem href="/login/institute/certificate" label="Apply Certificates" />
          <NavItem href="/login/institute/certificate/view" label="View Certificates" />
          <NavItem href="/login/institute/certificate/order" label="Order Certificates" />
        </DropdownMenu>

        <NavItem href="/login/institute/wallet" label="My Wallet" />
        <NavItem href="/login/institute/courier-wallet" label="Courier Wallet" />
        <NavItem href="/login/institute/background-upload" label="Upload Background" />

        <DropdownMenu label="Manage Attendance">
          <NavItem href="/login/institute/manage-attendance/batch" label="Batches" />
          <NavItem href="/login/institute/manage-attendance/attendance" label="Attendance" />
          <NavItem href="/login/institute/manage-attendance/report" label="Attendance Report" />
          <NavItem href="/login/institute/manage-attendance/student-wise" label="Student Wise Report" />
        </DropdownMenu>

        <NavItem href="/login/institute/installment" label="Installment" />
        <NavItem href="/login/institute/help-support" label="Help Support" />
        <NavItem href="/login/institute/marketing" label="Marketing Material" />
        <NavItem href="/login/institute/recharge-request" label="Recharge Request" />

      </aside>

      {/* MAIN */}
   <div className="flex-1 w-0 min-w-0">

        {/* TOPBAR */}
        <div className="bg-white shadow p-4 flex justify-between items-center pl-16 lg:pl-4">

          <h1 className="font-semibold text-sm sm:text-base">
            Welcome
          </h1>

          <span className="text-xs sm:text-sm text-gray-600 break-all">
            {userEmail}
          </span>

        </div>

        {/* CONTENT */}
        <div className="w-full min-w-0 p-3 sm:p-6">

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
      className="block px-3 py-2 rounded hover:bg-slate-700 transition text-sm sm:text-base"
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
        <span>{label}</span>
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