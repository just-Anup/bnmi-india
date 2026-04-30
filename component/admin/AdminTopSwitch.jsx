"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Image,
  FileText,
  Users,
  Wallet,
  HelpCircle,
  Megaphone,
  LogOut
} from "lucide-react";

import { account } from "@/lib/appwrite";

export default function AdminSidebar() {

  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.replace("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 🔥 MOBILE TOGGLE BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 bg-black text-white p-2 rounded-lg lg:hidden shadow"
      >
        <Menu size={22} />
      </button>

      {/* 🔲 OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* 📌 SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50
          transform ${open ? "translate-x-0" : "-translate-x-full"}
          transition duration-300 ease-in-out
          lg:translate-x-0
          flex flex-col
        `}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <h1 className="text-xl font-bold text-sky-600">
            BNMI Admin
          </h1>

          {/* CLOSE BUTTON (mobile) */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X />
          </button>
        </div>

        {/* SWITCH BUTTON */}
        <div className="p-4">
          <Link
            href="/admin/website/navbar"
            className="block text-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Website Management
          </Link>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">

          <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" href="/admin/dashboard" pathname={pathname} />

          <MenuItem icon={<Users size={18} />} label="Franchise List" href="/admin/dashboard/franchise" pathname={pathname} />

          <MenuItem icon={<FileText size={18} />} label="Certificate List" href="/admin/dashboard/certificates" pathname={pathname} />

          <MenuItem icon={<Image size={18} />} label="Course Section" href="/admin/dashboard/course" pathname={pathname} />

          <MenuItem icon={<Image size={18} />} label="Single Course Section" href="/admin/dashboard/addsingleccourse" pathname={pathname} />

          <MenuItem icon={<Image size={18} />} label="Multiple Course Section" href="/admin/dashboard/multiple-courses" pathname={pathname} />

          <MenuItem icon={<Image size={18} />} label="Beauty Course Section" href="/admin/dashboard/beauty-course" pathname={pathname} />

          <MenuItem icon={<FileText size={18} />} label="Upload Question Bank" href="/admin/dashboard/upload-questions" pathname={pathname} />

          <MenuItem icon={<Wallet size={18} />} label="Wallet Recharge" href="/admin/dashboard/wallet" pathname={pathname} />

          <MenuItem icon={<Wallet size={18} />} label="Courier Wallet Recharge" href="/admin/dashboard/courier-wallet" pathname={pathname} />

          <MenuItem icon={<FileText size={18} />} label="View Installment" href="/admin/dashboard/installment" pathname={pathname} />

          <MenuItem icon={<Image size={18} />} label="Upload Image" href="/admin/dashboard/upload-image" pathname={pathname} />

          <MenuItem icon={<HelpCircle size={18} />} label="Helpdesk" href="/admin/dashboard/helpdesk" pathname={pathname} />

          <MenuItem icon={<Megaphone size={18} />} label="Marketing" href="/admin/dashboard/marketing-material" pathname={pathname} />

        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </aside>
    </>
  );
}

/* 🔹 MENU ITEM */
function MenuItem({ icon, label, href, pathname }) {

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium
        ${isActive
          ? "bg-sky-100 text-sky-600"
          : "text-gray-700 hover:bg-gray-100"}
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}