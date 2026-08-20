'use client'

import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { account, databases } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { useRouter } from 'next/navigation'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID = 'franchise_requests'

/* ---------------- STATE + CITY LIST ---------------- */

const statesAndCities = {
  Assam: ['GUWAHATI', 'DIBRUGARH', 'SILCHAR', 'JORHAT'],
  'Arunachal Pradesh': [
    'ITANAGAR',
    'TAWANG',
    'PASIGHAT',
  ],
  Meghalaya: ['SHILLONG', 'TURA'],
  Nagaland: ['KOHIMA', 'DIMAPUR'],
  Manipur: ['IMPHAL'],
  Mizoram: ['AIZAWL'],
  Tripura: ['AGARTALA'],
  'West Bengal': [
    'KOLKATA',
    'SILIGURI',
    'DURGAPUR',
  ],
  Bihar: ['PATNA', 'GAYA', 'MUZAFFARPUR'],
  'Uttar Pradesh': [
    'LUCKNOW',
    'KANPUR',
    'VARANASI',
  ],
  Delhi: ['NEW DELHI'],
  Maharashtra: ['MUMBAI', 'PUNE', 'NAGPUR'],
  Karnataka: ['BANGALORE', 'MYSORE'],
  'Tamil Nadu': [
    'CHENNAI',
    'COIMBATORE',
    'MADURAI',
  ],
  Chattisgarh:['DILASPUR'],
  Kerala: ['KOCHI', 'TRIVANDRUM'],
  Rajasthan: ['JAIPUR', 'UDAIPUR', 'JODHPUR'],
  Gujarat: ['AHMEDABAD', 'SURAT', 'VADODARA'],
  Punjab: ['LUDHIANA', 'JALANDHAR', 'BATHINDA'],
  Haryana: ['CHANDIGARH'],
  Himachal: ['SHIMLA'],
  Chhattisgarh: ['RAIPUR', 'BHILAI', 'DURG'],
  Odisha: ['BHUBANESWAR', 'CUTTACK'],
  Jharkhand: ['RANCHI', 'JAMSHEDPUR'],
  Uttarakhand: ['DEHRADUN', 'HARIDWAR'],
  'jammu & kashmir': ['SRINAGAR', 'JAMMU'],
  'Madhya Pradesh': ['INDORE', 'BHOPAL', 'GWALIOR'],
  Goa: ['PANAJI'],
  'Andhra Pradesh': [
    'VIJAYAWADA',
    'VISAKHAPATNAM',
    'GUNTUR',
  ],
  Telangana: ['HYDERABAD', 'SECUNDERABAD', 'WARANGAL'],
}

/* ---------------- SAFE ATC GENERATOR ---------------- */

const getStateCode = (state) => {
  if (!state || typeof state !== 'string')
    return 'NA'

  return state.substring(0, 2).toUpperCase()
}

const generateATCCode = (state) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  let code = ''

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length)
    )
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
    amcCode: '',
    state: '',
    city: '',
    mobile: '',
  })

  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [customCity, setCustomCity] =
    useState('')

  /* ---------------- STATE CHANGE ---------------- */

  const handleStateChange = (state) => {
    setForm((prev) => ({
      ...prev,
      state,
      city: '',
    }))
    setCustomCity('') 

    setCities(statesAndCities[state] || [])
  }

  const normalizeUpperCase = (value) =>
    typeof value === 'string'
      ? value.trim().toUpperCase()
      : ''

  /* ---------------- SIGNUP ---------------- */

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!form.state) {
      alert('Please select a state ❌')
      return
    }

    if (!form.city) {
      alert('Please select a city ❌')
      return
    }

    const finalCity =
      form.city === 'Other'
        ? normalizeUpperCase(customCity)
        : normalizeUpperCase(form.city)

    if (form.city === 'Other' && !finalCity) {
      alert('Please enter your city ❌')
      return
    }

    setLoading(true)

    try {
      const atcCode = generateATCCode(
        form.state
      )

      /* CREATE AUTH USER */
      await account.create(
        ID.unique(),
        form.email,
        form.password,
        form.name
      )

      /* SAVE DATA */
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...form,

          city: finalCity,

          franchiseEmail: form.email,

          atcCode,

          wallet: '0.00',

          courierWallet: '0.00',

          status: 'pending',
        }
      )

      alert(
        'Signup successful! Wait for admin approval.'
      )

      router.push('/login/institute')
    } catch (error) {
      console.error(error)

      alert(
        error.message || 'Something went wrong'
      )
    }

    setLoading(false)
  }

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gradient-to-br
        from-[#0f172a]
        via-[#394d6e]
        to-[#020617]
        p-6
      "
    >
      <form
        onSubmit={handleSignup}
        className="
          w-full
          max-w-5xl
          bg-white/10
          backdrop-blur-lg
          border
          border-white/20
          rounded-3xl
          shadow-2xl
          p-10
          space-y-6
          text-white
        "
      >
        <h2 className="text-3xl font-bold text-center tracking-wide">
          Franchise Registration
        </h2>

        <p className="text-center text-gray-300 text-sm">
          Fill in your details to apply for
          franchise
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

         

          {/* INSTITUTE */}
          <input
            placeholder="Institute Name"
            className="input"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                instituteName:
                  e.target.value.toUpperCase(),
              })
            }
            required
          />

           {/* NAME */}
          <input
            placeholder="Owner's Name"
            className="input"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target.value.toUpperCase(),
              })
            }
            required
          />


          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            className="input"
            style={{
              textTransform: 'lowercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                email:
                  e.target.value.toLowerCase(),
              })
            }
            required
          />

          {/* PASSWORD */}
 <div className="relative w-full">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    className="input w-full pr-12"
    value={form.password}
    onChange={(e) =>
      setForm({
        ...form,
        password: e.target.value,
      })
    }
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-300 z-10"
  >
    {showPassword ? (
      <EyeOff size={20} />
    ) : (
      <Eye size={20} />
    )}
  </button>
</div>

          {/* MOBILE */}
          <input
            placeholder="Mobile"
            className="input"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                mobile:
                  e.target.value.toUpperCase(),
              })
            }
          />

          {/* AMC */}
          <input
            placeholder="AMC Code"
            className="input"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                amcCode:
                  e.target.value.toUpperCase(),
              })
            }
          />

          {/* DESIGNATION */}
<select
  className="input text-black border border-gray-300"
  value={form.designation}
  onChange={(e) =>
    setForm({
      ...form,
      designation: e.target.value,
    })
  }
>
  <option value="">
    Select Designation
  </option>

  <option value="DIRECTOR">Director</option>
  <option value="EMPLOYEE">Employee</option>
  <option value="PARTNER">Partner</option>
  <option value="PROPRIETOR">Proprietor</option>
  <option value="TRUSTEE">Trustee</option>
  <option value="OTHER">Other</option>
</select>

          {/* DOB */}
          <input
            type="date"
            className="input text-black border border-gray-300"
            onChange={(e) =>
              setForm({
                ...form,
                dob: e.target.value,
              })
            }
          />

          {/* ADDRESS */}
          <input
            placeholder="Address"
            className="input md:col-span-2 text-black border border-gray-300"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                address:
                  e.target.value.toUpperCase(),
              })
            }
          />

          {/* PINCODE */}
          <input
            placeholder="Pincode"
            className="input text-black border border-gray-300"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              setForm({
                ...form,
                pincode:
                  e.target.value.toUpperCase(),
              })
            }
          />

          {/* STATE */}
          <select
            value={form.state}
            className="input text-black border border-gray-300"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) =>
              handleStateChange(
                e.target.value
              )
            }
          >
            <option value="">
              Select State
            </option>

            {Object.keys(
              statesAndCities
            ).map((state) => (
              <option
                key={state}
                value={state}
              >
                {state}
              </option>
            ))}
          </select>

          {/* CITY */}
          <select
            value={form.city}
            className="w-full p-3 rounded-xl text-black border border-gray-300"
            style={{
              textTransform: 'uppercase',
            }}
            onChange={(e) => {
              const selectedCity = e.target.value
              setForm({
                ...form,
                city: selectedCity,
              })
              if (selectedCity !== 'Other') {
                setCustomCity('')
              }
            }}
          >
            <option value="">
              Select City
            </option>

            {cities.map((city) => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}

            <option value="Other">
              Other
            </option>
          </select>

          {/* CUSTOM CITY */}
          {form.city === 'Other' && (
            <input
              placeholder="Enter your city"
              className="input md:col-span-2"
              style={{
                textTransform: 'uppercase',
              }}
              value={customCity}
              onChange={(e) =>
                setCustomCity(
                  normalizeUpperCase(
                    e.target.value
                  )
                )
              }
            />
          )}
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            py-3
            rounded-xl
            font-semibold
            text-black
            bg-gradient-to-r
            from-orange-400
            to-pink-500
            hover:opacity-90
            transition
            shadow-lg
          "
        >
          {loading
            ? 'Creating...'
            : 'Create Account'}
        </button>
      </form>
    </div>
  )
}