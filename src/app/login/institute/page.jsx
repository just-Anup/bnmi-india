'use client'

import { useState } from 'react'
import { account, databases } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'
import { Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstituteLogin() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 🔹 Clear old session if exists
      await account.deleteSession('current').catch(() => {})

      // 🔹 Step 1: Auth Login
      await account.createEmailPasswordSession(email, password)
      
      // 🔹 Step 2: Check if approved
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

      // ✅ Approved → Allow login
      router.push('/login/institute/dashboard')

    } catch (error) {
      console.error(error)
      alert(error?.message || 'Invalid credentials')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-[420px]">

        <h2 className="text-2xl font-bold text-center mb-8">
          Institute Login
        </h2>

        <form onSubmit={login} className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-400 px-4 py-3 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-400 px-4 py-3 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 font-semibold hover:bg-gray-800 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

      </div>
    </div>
  )
}
