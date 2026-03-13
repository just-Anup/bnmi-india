'use client'

import { useState } from 'react'
import { account } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function WebsiteLogin() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = async () => {

    setLoading(true)

    try {

      await account.deleteSession('current').catch(() => {})

      await account.createEmailPasswordSession(email, password)

      if (email !== 'bnmiindia@gmail.com') {
        alert('Not authorized as Website Manager')
        await account.deleteSession('current')
        setLoading(false)
        return
      }

      router.push('/admin')

    } catch (err) {
      alert('Invalid credentials')
      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

      <div className="bg-white w-[420px] p-10 rounded-2xl shadow-xl">

        <h2 className="text-3xl font-bold text-center mb-2">
          Website Manager
        </h2>

        <p className="text-gray-500 text-center mb-8">
          Login to access the admin dashboard
        </p>

        {/* Email */}

        <div className="mb-5">
          <label className="text-sm text-gray-600 mb-1 block">
            Email
          </label>

          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>


        {/* Password */}

        <div className="mb-6 relative">

          <label className="text-sm text-gray-600 mb-1 block">
            Password
          </label>

          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
          onClick={login}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>

    </div>

  )
}