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
    <header
      className={`${scrolled ? 'fixed' : 'absolute'} top-0 left-0 w-full z-50`}
    >
      {/* ---------------- TOP INFO BAR ---------------- */}
      <div
  className={`bg-gradient-to-r from-[#0f4c75] via-[#0a6fa5] to-[#19b9f1]
  h-[95px] flex items-center px-16 relative
  transition-all duration-500 ease-in-out
  ${scrolled ? 'w-full shadow-lg' : 'w-[60%]'}`}
>
  {/* ---------------- LOGO FROM CMS ---------------- */}
  {navbarData?.logoUrl ? (
    <img
      src={navbarData.logoUrl}
      alt="Website Logo"
      className="h-16 object-contain transition-all duration-300"
    />
  ) : (
    <div className="text-white font-bold text-2xl">
      {navbarData?.siteName || 'LOGO'}
    </div>
  )}

  {/* ---------------- STATIC MENU ---------------- */}
  <nav className="ml-auto hidden lg:flex gap-10 text-white font-semibold tracking-wide">

    <Link href="/" className="hover:text-gray-200 transition">HOME</Link>
    <Link href="/about" className="hover:text-gray-200 transition">ABOUT US</Link>
    <Link href="/courses" className="hover:text-gray-200 transition">COURSES</Link>
    <Link href="/certificate-demo" className="hover:text-gray-200 transition">CERTIFICATION</Link>
    <Link href="/verify/verification" className="hover:text-gray-200 transition">VERIFICATION</Link>

  </nav>

  {/* ---------------- CTA BUTTONS ---------------- */}
  <div
    className={`absolute top-1/2 -translate-y-1/2 flex gap-4
    transition-all duration-500
    ${scrolled ? 'right-250' : '-right-[520px]'}`}
  >
    <Link href="/contact">
      <CTAButton text="CONTACT NOW" />
    </Link>
    <Link href="/franchise/signup">
      <CTAButton text="FRANCHISE FORM" />
    </Link>
    <Link href="/login/institute">
      <CTAButton text="LOGIN" />
    </Link>
  </div>
</div>


        {!scrolled && <div className="w-[40%]" />}
   
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
