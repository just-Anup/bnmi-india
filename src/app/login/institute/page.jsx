'use client'

import { useState, useEffect } from 'react'
import { account, databases } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'
import { Query } from 'appwrite'
import { Eye, EyeOff } from 'lucide-react'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstituteLogin() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  /* ---------------- AUTO FILL FROM URL ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlEmail = params.get('email')
    const urlPassword = params.get('password')

    if (urlEmail) setEmail(urlEmail)
    if (urlPassword) setPassword(urlPassword)
  }, [])

  /* ---------------- LOGIN ---------------- */
  const login = async (e) => {

    e.preventDefault()
    setLoading(true)

    try {

      await account.deleteSession('current').catch(() => {})

      await account.createEmailPasswordSession(email, password)

      if (email === 'bnmiindia@gmail.com') {
        localStorage.setItem("adminAuth", "true")
        router.push('/admin')
        setLoading(false)
        return
      }

      const res = await databases.listDocuments(
        DATABASE_ID,
        'franchise_approved',
        [Query.equal('email', email)]
      )

      if (!res.documents.length) {
        alert('Your franchise is not approved yet')
        await account.deleteSession('current')
        setLoading(false)
        return
      }

      router.push('/login/institute/dashboard')

    } catch (error) {
      console.error(error)
      alert(error?.message || 'Invalid credentials')
    }

    setLoading(false)
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">

      <div className="w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row">

        {/* LEFT SIDE */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#2b4ea2] to-[#5fa0ff] items-center justify-center relative p-10">

          {/* circles */}
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-52 h-52 bg-white/10 rounded-full"></div>

          {/* logo */}
          <div className="z-10 text-center">
            <img
              src="/logo.png"   
              alt="logo"
              className="w-64 mx-auto"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">

          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Welcome Back
          </h2>

          <p className="text-gray-500 mb-8">
            Please login to your account to continue
          </p>

          <form onSubmit={login} className="space-y-6">

            {/* Email */}
            <div>
              <label className="text-sm text-gray-600 block mb-2">
                Email Address
              </label>

              <input
                type="email"
                placeholder="youremail@gmail.com"
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-sm text-gray-600 block mb-2">
                Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={()=>setShowPassword(!showPassword)}
                className="absolute right-3 top-[42px] text-gray-500"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              {loading ? 'Logging in...' : 'SIGN IN'}
            </button>

          </form>

          {/* Divider */}
          <div className="my-8 border-t border-dashed"></div>

          {/* PWA SECTION */}
          <div className="text-center">
            <p className="font-semibold text-gray-700 mb-2">
              📱 Install as Progressive Web App (Mobile App) for Students
            </p>

            <p className="text-sm text-gray-500 mb-4">
              Access your courses anytime, anywhere with our mobile app experience
            </p>

            <button className="w-full border border-blue-500 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 transition">
              📲 App is under progress (Coming soon)
            </button>
          </div>

        </div>

      </div>

    </div>

  )
}