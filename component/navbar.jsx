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
        className={`bg-black text-white text-sm transition-all duration-300
        ${scrolled ? 'opacity-100 py-2' : 'opacity-0 h-0 overflow-hidden'}`}
      >
        <div className="flex justify-between px-16">
          <span>
            {navbarData?.topBarText ||
              'Welcome To Bharat National Multimedia Institute'}
          </span>

          <div className="flex gap-8">
            <span>
              {navbarData?.dateText || 'MON - SAT 10AM - 6PM'}
            </span>

            <span>
              CALL ANYTIME : {navbarData?.phone || '000 888 0000'}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- NAVBAR ---------------- */}
      <div className="relative w-full flex">
        <div
          className={`bg-[#19b9f1] h-[90px] flex items-center px-16 relative
          transition-all duration-500 ease-in-out
          ${scrolled ? 'w-full' : 'w-[60%]'}`}
        >
          {/* ---------------- LOGO FROM CMS ---------------- */}
          {navbarData?.logoUrl ? (
            <img
              src={navbarData.logoUrl}
              alt="Website Logo"
              className="h-12 object-contain"
            />
          ) : (
            <div className="text-white font-bold text-xl">
              {navbarData?.siteName || 'LOGO'}
            </div>
          )}

          {/* ---------------- STATIC MENU ---------------- */}
      <nav className="ml-auto hidden lg:flex gap-10 text-white font-semibold">

  <Link href="/">HOME</Link>
  <Link href="/about">ABOUT US</Link>
  <Link href="/courses">COURSES</Link>
  <Link href="/certificate-demo">CERTIFICATION</Link>
  <Link href="/verify/verification">VERIFICATION</Link>

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
