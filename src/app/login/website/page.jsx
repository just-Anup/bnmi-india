'use client'

import { useState } from 'react'
import { account } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'

export default function WebsiteLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = async () => {
    try {
      await account.deleteSession('current').catch(() => {})

      await account.createEmailPasswordSession(email, password)

      if (email !== 'bnmiindia@gmail.com') {
        alert('Not authorized as Website Manager')
        await account.deleteSession('current')
        return
      }

      router.push('/admin')

    } catch (err) {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[400px]">
        <h2 className="text-2xl font-bold mb-6">Website Manager Login</h2>

        <input
          className="border p-3 w-full mb-4"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-3 w-full mb-6"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-black text-white py-3"
        >
          Login
        </button>
      </div>
    </div>
  )
}
