'use client'


import { account, databases } from '@/lib/appwrite'
import { Query } from 'appwrite'
import { Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstituteLogin() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {

  const urlEmail = searchParams.get('email')
  const urlPassword = searchParams.get('password')

  if (urlEmail) setEmail(urlEmail)
  if (urlPassword) setPassword(urlPassword)

}, [searchParams])


  const login = async (e) => {

    e.preventDefault()
    setLoading(true)

    try {

      await account.deleteSession('current').catch(() => {})

      await account.createEmailPasswordSession(email, password)

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

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">

      <div className="bg-white w-[420px] p-10 rounded-2xl shadow-xl">

        <h2 className="text-3xl font-bold text-center mb-2">
          Institute Login
        </h2>

        <p className="text-gray-500 text-center mb-8">
          Access your institute dashboard
        </p>

        <form onSubmit={login} className="space-y-6">

          {/* Email */}

          <div>

            <label className="text-sm text-gray-600 block mb-1">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>


          {/* Password */}

          <div className="relative">

            <label className="text-sm text-gray-600 block mb-1">
              Password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-500"
            >
              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>

          </div>


          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

      </div>

    </div>

  )
}