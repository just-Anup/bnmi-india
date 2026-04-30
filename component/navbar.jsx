'use client'

import { useEffect, useState } from 'react'
import Dropdown from '../component/dropdown'
import { databases } from '@/lib/appwrite'
import Link from 'next/link'
import { Query } from 'appwrite'
import { Menu, X } from 'lucide-react'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const WEBSITE_COLLECTION = 'website'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [navbarData, setNavbarData] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  /* ---------------- SCROLL EFFECT ---------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---------------- FETCH CMS DATA ---------------- */
  useEffect(() => {
    const fetchNavbar = async () => {
      try {
        if (!databases) return

        const res = await databases.listDocuments(
          DATABASE_ID,
          WEBSITE_COLLECTION,
          [Query.limit(1)]
        )

        if (res.documents.length) {
          setNavbarData(res.documents[0])
        }
      } catch (error) {
        console.error('Navbar CMS load failed:', error)
      }
    }

    fetchNavbar()
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-lg">
      <div className=" px-4 md:px-10 py-4">
        
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            {navbarData?.logoUrl ? (
              <img
                src={navbarData.logoUrl}
                alt="Logo"
                className="h-10 md:h-14 object-contain"
              />
            ) : (
              <div className="text-white font-bold text-lg md:text-xl">
                {navbarData?.siteName || 'LOGO'}
              </div>
            )}
          </div>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex gap-8 text-white font-semibold">
            <Link href="/">HOME</Link>
            <Link href="/about">ABOUT US</Link>
            <Link href="/courses">COURSES</Link>
            <Link href="/certificate-demo">CERTIFICATION</Link>
            <Link href="/verify/verification">VERIFICATION</Link>
          </nav>

          {/* DESKTOP BUTTONS */}
          <div className="hidden lg:flex gap-3">
            <Link href="/contact"><CTAButton text="CONTACT" /></Link>
            <Link href="/franchise/signup"><CTAButton text="FRANCHISE" /></Link>
            <Link href="/login/institute"><CTAButton text="LOGIN" /></Link>
            <Link href="/student/login"><CTAButton text="STUDENT LOGIN" /></Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="lg:hidden text-white">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="lg:hidden mt-4 bg-white rounded-xl p-4 flex flex-col gap-4 shadow-lg">
            
            <Link href="/" onClick={() => setMenuOpen(false)}>HOME</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>ABOUT US</Link>
            <Link href="/courses" onClick={() => setMenuOpen(false)}>COURSES</Link>
            <Link href="/certificate-demo" onClick={() => setMenuOpen(false)}>CERTIFICATION</Link>
            <Link href="/verify/verification" onClick={() => setMenuOpen(false)}>VERIFICATION</Link>

            <div className="flex flex-col gap-3 mt-3">
              <Link href="/contact"><CTAButton text="CONTACT" /></Link>
              <Link href="/franchise/signup"><CTAButton text="FRANCHISE" /></Link>
              <Link href="/login/institute"><CTAButton text="LOGIN" /></Link>
              <Link href="/login/student/login"><CTAButton text="STUDENT LOGIN" /></Link>
            </div>

          </div>
        )}
      </div>
    </header>
  )
}

/* ---------------- CTA BUTTON ---------------- */
function CTAButton({ text }) {
  return (
    <div className="relative w-full">
      <div className="absolute -bottom-2 -left-2 w-full h-full bg-gray-600"></div>
      <button
        className="relative w-full text-center bg-white text-black px-4 py-2 md:px-6 md:py-3 font-semibold
        hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap"
      >
        {text}
      </button>
    </div>
  )
}