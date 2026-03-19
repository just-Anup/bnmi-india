'use client'

import Link from 'next/link'
import { Menu, LayoutDashboard, Image } from 'lucide-react'
import { account } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'

export default function AdminSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
  try {
    await account.deleteSession('current')
    router.replace('/login') 
  } catch (error) {
    console.error(error)
  }
}


  return (
    <aside className="w-72 min-h-screen bg-white border-r shadow-sm">

      {/* LOGO */}
      <div className="p-6 border-b flex items-center gap-2">
        <Menu className="text-sky-500" />
        <h1 className="text-xl font-bold text-sky-500">
          BNMI Admin
        </h1>
      </div>

      {/* SWITCH BUTTON */}
      <div className="p-4">
        <Link
          href="/admin/website/navbar"
          className="block text-center bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
        >
          Admin Management
        </Link>
      </div>

      {/* MENU */}
      <nav className="px-4 mt-6 space-y-2">

        <MenuItem
          icon={<Image size={18} />}
          label="Franchise List"
          href="/admin/dashboard/franchise"
        />

  <MenuItem
          icon={<Image size={18} />}
          label="Certificate List"
          href="/admin/dashboard/certificates"
        />
            <MenuItem
                  icon={<Image size={18} />}
                  label="course Section"
                  href="/admin/dashboard/course"
                />
   <MenuItem
          icon={<Image size={18} />}
          label="Single Course Section"
          href="/admin/dashboard/addsingleccourse" 
        />
         <MenuItem
          icon={<Image size={18} />}
          label="Multiple Course Section"
          href="/admin/dashboard/multiple-courses"
        />
         <MenuItem
          icon={<Image size={18} />}
          label="Typing Course Section"
          href="/admin/dashboard/typing-courses"
        />
  <MenuItem
          icon={<Image size={18} />}
          label="Wallet List"
          href="/admin/dashboard/wallet"
        />
       <MenuItem
          icon={<Image size={18} />}
          label="courier-Wallet List"
          href="/admin/dashboard/courier-wallet"
        />
       <MenuItem
          icon={<Image size={18} />}
          label="upload Image"
          href="/admin/dashboard/upload-image"
        />
       <MenuItem
          icon={<Image size={18} />}
          label="Helpdesk List"
          href="/admin/dashboard/helpdesk"
        />
       <MenuItem
          icon={<Image size={18} />}
          label="Marketing List"
          href="/admin/dashboard/marketing-material"
        />
      

    
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="px-4 mt-10">
        <button
          onClick={handleLogout}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

    </aside>
  )
}

function MenuItem({ icon, label, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700
                 hover:bg-sky-50 hover:text-sky-600 transition font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
