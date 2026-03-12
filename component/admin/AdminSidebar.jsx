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
          Website Management
        </Link>
      </div>

      {/* MENU */}
      <nav className="px-4 mt-6 space-y-2">

        <MenuItem
          icon={<LayoutDashboard size={18} />}
          label="Navbar"
          href="/admin/website/navbar"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="Hero Section"
          href="/admin/website/hero"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="Services Section"
          href="/admin/website/services"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="About Section"
          href="/admin/website/about"
        />
        <MenuItem
          icon={<Image size={18} />}
          label="course Section"
          href="/admin/website/course"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="Testimonials Section"
          href="/admin/website/testimonials"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="Team Section"
          href="/admin/website/team"
        />

        <MenuItem
          icon={<Image size={18} />}
          label="Footer Section"
          href="/admin/website/footer"
        />

         <MenuItem
          icon={<Image size={18} />}
          label="Add Course Section"
          href="/admin/website/addsingleccourse"
        />
         <MenuItem
          icon={<Image size={18} />}
          label="Multiple Course Section"
          href="/admin/website/multiple-courses"
        />
         <MenuItem
          icon={<Image size={18} />}
          label="Typing Course Section"
          href="/admin/website/typing-courses"
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
