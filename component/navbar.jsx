'use client'

import { useEffect, useState } from 'react'
import Dropdown from '../component/dropdown'
import { databases } from '@/lib/appwrite'
import Link from 'next/link'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const WEBSITE_COLLECTION = 'website'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [navbarData, setNavbarData] = useState(null)

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

      if (!databases) return   // IMPORTANT FIX

      const res = await databases.listDocuments(
        DATABASE_ID,
        WEBSITE_COLLECTION,
        [Query.limit(1)]
      )


console.log("NAVBAR DATA:", res)

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
    
    <div className="bg-gradient-to-r from-[#0f4c75] via-[#0a6fa5] to-[#19b9f1] px-10 py-4">
      
      <div className="flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-3">
          {navbarData?.logoUrl ? (
            <img
              src={navbarData.logoUrl}
              alt="Logo"
              className="h-14 object-contain"
            />
          ) : (
            <div className="text-white font-bold text-xl">
              {navbarData?.siteName || 'LOGO'}
            </div>
          )}
        </div>

        {/* MENU */}
        <nav className="hidden lg:flex gap-8 text-white font-semibold">
          <Link href="/">HOME</Link>
          <Link href="/about">ABOUT US</Link>
          <Link href="/courses">COURSES</Link>
          <Link href="/certificate-demo">CERTIFICATION</Link>
          <Link href="/verify/verification">VERIFICATION</Link>
          <Link href="/verify/verification">VERIFICATION</Link>
        </nav>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <Link href="/contact">
            <CTAButton text="CONTACT" />
          </Link>
          <Link href="/franchise/signup">
            <CTAButton text="FRANCHISE" />
          </Link>
          <Link href="/login/institute">
            <CTAButton text="LOGIN" />
          </Link>
          <Link href="/login/student/login">
            <CTAButton text="STUDENT LOGIN" />
          </Link>
        </div>

      </div>
    </div>
  </header>
)
}

/* ---------------- CTA BUTTON ---------------- */
function CTAButton({ text }) {
  return (
    <div className="relative">
      <div className="absolute -bottom-2 -left-2 w-full h-full bg-gray-600"></div>
      <button
        className="relative bg-white text-black px-6 py-3 font-semibold
        hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap"
      >
        {text}
      </button>
    </div>
  )
}
