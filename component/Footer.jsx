'use client'
import { useEffect, useRef, useState } from 'react'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'website'

export default function Footer() {
  const footerRef = useRef(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!databases || !DATABASE_ID) return

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.limit(1)]
        )

        if (res.documents.length) {
          setData(res.documents[0])
        }
      } catch (error) {
        console.error('Footer fetch failed:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!footerRef.current) return

    gsap.fromTo(
      footerRef.current.querySelectorAll('.footer-anim'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
        },
      }
    )
  }, [data])

  if (!data) return null

  return (
    <footer ref={footerRef} className="bg-[#111] text-white relative">

      <div className="bg-[#19b9f1] py-12 px-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h3 className="text-3xl font-bold text-black">
           BHARAT NATIONAL MULTIMEDIA INSTITUTE
          </h3>

          <div className="relative">
            <div className="absolute -bottom-2 -left-2 w-full h-full bg-black" />
            <button className="relative bg-[#222] text-white px-8 py-4 font-semibold">
              CONTACT NOW
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] py-20 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">

          <div className="footer-anim">
            <h2 className="text-3xl font-bold mb-6">
              <span className="text-[#19b9f1]">B</span>NMI
              <span className="block text-sm text-[#19b9f1]">
                Franchise Provider
              </span>
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed">
              {data.footerAboutText}
            </p>

            <div className="flex gap-4 mt-6 text-gray-400">
              <span>f</span>
              <span>t</span>
              <span>p</span>
              <span>◯</span>
            </div>
          </div>

          <div className="footer-anim">
            <h4 className="font-bold text-lg mb-6">LINKS EXPLORE</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>» About us</li>
              <li>» Meet Our Team</li>
              <li>» Latest News</li>
              <li>» Contact Us</li>
              <li>» Our Service</li>
            </ul>
          </div>

          <div className="footer-anim">
            <h4 className="font-bold text-lg mb-6">CONTACT</h4>

            <p className="text-[#19b9f1] font-semibold">Address</p>
            <p className="text-gray-400 mb-6 text-sm">
              {data.footerAddress}
            </p>

            <p className="text-[#19b9f1] font-semibold">
              CALL ANYTIME :
            </p>
            <p className="text-gray-400 mb-6">
              {data.footerPhone}
            </p>

            <p className="text-[#19b9f1] font-semibold">
              Email Address
            </p>
            <p className="text-gray-400">
              {data.footerEmail}
            </p>
          </div>

          <div className="footer-anim">
            <h4 className="font-bold text-lg mb-6">Newsletter</h4>

            <p className="text-gray-400 text-sm mb-6">
              Sign up for our latest news & articles. We won't give you spam mails.
            </p>

            <input
              type="email"
              placeholder="Your Email"
              className="w-full bg-transparent border border-gray-500 px-4 py-3 mb-4 text-sm"
            />

            <button className="bg-[#19b9f1] text-black px-6 py-3 font-semibold">
              Send Now
            </button>
          </div>

        </div>
      </div>

      <div className="bg-[#111] py-6 text-center text-gray-500 text-sm">
        © Copyright 2026 BNMI
      </div>

    </footer>
  )
}