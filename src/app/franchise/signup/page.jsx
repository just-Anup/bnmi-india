'use client'

import { useState } from 'react'
import { account, databases } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { useRouter } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'franchise_requests'

export default function FranchiseSignup() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    instituteName: '',
    email: '',
    password: '',
    designation: '',
    dob: '',
    address: '',
    pincode: '',
    state: '',
    city: ''
  })

  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1️⃣ Create Appwrite Auth User
      await account.create(
        ID.unique(),
        form.email,
        form.password,
        form.name
      )

      // 2️⃣ Create Database Entry
    await databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  {
    ...form,
    franchiseEmail: form.email,   // added
    instituteName: form.instituteName, // ensure stored
    status: 'pending'
  }
)

      alert('Signup successful! Wait for admin approval.')
      router.push('/login')

    } catch (error) {
      alert(error.message)
      console.error(error)
    }

    setLoading(false)
  }

  /* ---------------- KEEP YOUR DESIGN BELOW ---------------- */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-10 w-[500px] shadow-lg space-y-4"
      >

        <h2 className="text-2xl font-bold text-center mb-6">
          Franchise Signup
        </h2>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Institute Name"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Designation"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
        />

        <input
          type="date"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />

        <input
          type="text"
          placeholder="Address"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <input
          type="text"
          placeholder="Pincode"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
        />

        <input
          type="text"
          placeholder="State"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        />

        <input
          type="text"
          placeholder="City"
          className="w-full border p-3"
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 font-semibold"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>

      </form>
    </div>
  )
}
