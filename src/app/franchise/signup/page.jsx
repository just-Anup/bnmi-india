'use client'

import { useState } from 'react'
import { account, databases } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { useRouter } from 'next/navigation'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'franchise_requests'

/* ---------------- STATE + CITY LIST ---------------- */

const statesAndCities = {
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat"],
  "Meghalaya": ["Shillong", "Tura"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Manipur": ["Imphal"],
  "Mizoram": ["Aizawl"],
  "Tripura": ["Agartala"],
  "West Bengal": ["Kolkata", "Siliguri", "Durgapur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi"],
  "Delhi": ["New Delhi"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  "Karnataka": ["Bangalore", "Mysore"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Kerala": ["Kochi", "Trivandrum"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"]
}

/* ---------------- SAFE ATC GENERATOR ---------------- */

const getStateCode = (state) => {
  if (!state || typeof state !== "string") return "NA"
  return state.substring(0, 2).toUpperCase()
}

const generateATCCode = (state) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${getStateCode(state)}-${code}`
}

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
    city: '',
    mobile: ''
  })

  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)

  /* ---------------- STATE CHANGE ---------------- */

  const handleStateChange = (state) => {
    setForm((prev) => ({
      ...prev,
      state,
      city: ''
    }))
    setCities(statesAndCities[state] || [])
  }

  /* ---------------- SIGNUP ---------------- */

  const handleSignup = async (e) => {
    e.preventDefault()

    console.log("FORM DATA:", form)

    // ✅ Strong validation
    if (!form.state) {
      alert("Please select a state ❌")
      return
    }

    if (!form.city) {
      alert("Please select a city ❌")
      return
    }

    setLoading(true)

    try {

      const atcCode = generateATCCode(form.state)

      /* Create Appwrite Auth User */
      await account.create(
        ID.unique(),
        form.email,
        form.password,
        form.name
      )

      /* Save Franchise Request */
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...form,
          franchiseEmail: form.email,
          atcCode,
          wallet: "0.00",
          courierWallet: "0.00",
          status: "pending"
        }
      )

      alert('Signup successful! Wait for admin approval.')
      router.push('/login')

    } catch (error) {
      console.error("ERROR:", error)
      alert(error.message || "Something went wrong")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSignup}
        className="bg-white p-10 w-[900px] shadow-lg space-y-6"
      >

        <h2 className="text-2xl font-bold text-center">
          Franchise Form
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <input placeholder="Full Name" className="border p-3"
            onChange={(e)=>setForm({...form,name:e.target.value})} required />

          <input placeholder="Institute Name" className="border p-3"
            onChange={(e)=>setForm({...form,instituteName:e.target.value})} required />

          <input type="email" placeholder="Email" className="border p-3"
            onChange={(e)=>setForm({...form,email:e.target.value})} required />

          <input type="password" placeholder="Password" className="border p-3"
            onChange={(e)=>setForm({...form,password:e.target.value})} required />

          <input placeholder="Mobile" className="border p-3"
            onChange={(e)=>setForm({...form,mobile:e.target.value})} />

          <select className="border p-3"
            value={form.designation}
            onChange={(e)=>setForm({...form,designation:e.target.value})}>
            <option value="">Select Designation</option>
            <option>Director</option>
            <option>Employee</option>
            <option>Partner</option>
            <option>Proprietor</option>
            <option>Trustee</option>
            <option>Other</option>
          </select>

          <input type="date" className="border p-3"
            onChange={(e)=>setForm({...form,dob:e.target.value})} />

          <input placeholder="Address" className="border p-3 col-span-2"
            onChange={(e)=>setForm({...form,address:e.target.value})} />

          <input placeholder="Pincode" className="border p-3"
            onChange={(e)=>setForm({...form,pincode:e.target.value})} />

          {/* ✅ STATE */}
          <select
            value={form.state}
            className="border p-3"
            onChange={(e)=>handleStateChange(e.target.value)}
          >
            <option value="">Select State</option>
            {Object.keys(statesAndCities).map((state)=>(
              <option key={state}>{state}</option>
            ))}
          </select>

          {/* ✅ CITY */}
          <select
            value={form.city}
            className="border p-3"
            onChange={(e)=>setForm({...form,city:e.target.value})}
          >
            <option value="">Select City</option>
            {cities.map((city)=>(
              <option key={city}>{city}</option>
            ))}
          </select>

        </div>

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