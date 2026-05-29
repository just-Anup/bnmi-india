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

  e.preventDefault();

  if (loading) return;

  setLoading(true);

  try {

    // DELETE OLD SESSION FIRST
    try {
      await account.deleteSession("current");
    } catch (err) {
      // ignore if no session exists
    }

    // CREATE NEW SESSION
    await account.createEmailPasswordSession(email, password);

    /* ---------------- ADMIN LOGIN ---------------- */
    if (email === "bnmiindia@gmail.com") {

      localStorage.setItem("adminAuth", "true");

      setTimeout(() => {
        router.push("/admin");
      }, 500);

      return;
    }

    /* ---------------- FRANCHISE CHECK ---------------- */
    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", email)]
    );

    if (!res.documents.length) {

      alert("Your franchise is not approved yet");

      await account.deleteSession("current");

      setLoading(false);

      return;
    }

    /* ---------------- NORMAL USER LOGIN ---------------- */
    router.push("/login/institute/dashboard");

  } catch (error) {

    console.error(error);

    alert(error?.message || "Invalid credentials");

  } finally {

    setLoading(false);

  }

};

return (
  <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#312e81] flex items-center justify-center px-4">

    {/* Background Glow Effects */}
    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[150px]"></div>

    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[150px]"></div>

    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-[120px]"></div>

    {/* Main Card */}
    <div className="relative z-10 w-full max-w-6xl rounded-[40px] overflow-hidden border border-white/20 backdrop-blur-2xl bg-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.4)] flex flex-col md:flex-row">

      {/* ================= LEFT SIDE ================= */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center p-12">

        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-400/10"></div>

        <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/10 backdrop-blur-xl"></div>

        <div className="absolute bottom-10 left-10 w-52 h-52 rounded-full bg-white/10 backdrop-blur-xl"></div>

        <div className="relative z-10 text-center">

          <img
            src="/logo.png"
            alt="logo"
            className="w-72 mx-auto drop-shadow-[0_10px_30px_rgba(255,255,255,0.3)]"
          />

          <h2 className="text-white text-3xl font-bold mt-8">
            BNMI India
          </h2>

          <p className="text-blue-100 mt-4 text-lg max-w-md">
            Transforming Education Through Innovation &
            Technology
          </p>

        </div>

      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="w-full md:w-1/2 p-8 md:p-14 bg-white/5 backdrop-blur-xl">

        <div className="mb-10">

          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome Back 👋
          </h1>

          <p className="text-gray-300">
            Sign in to access your institute dashboard
          </p>

        </div>

        <form onSubmit={login} className="space-y-6">

          {/* EMAIL */}
          <div>

            <label className="text-gray-200 text-sm mb-2 block">
              Email Address
            </label>

            <input
              type="email"
              placeholder="youremail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                w-full
                bg-white/10
                border border-white/20
                backdrop-blur-xl
                rounded-2xl
                px-5
                py-4
                text-white
                placeholder-gray-400
                focus:outline-none
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-400/30
                transition-all
              "
            />

          </div>

          {/* PASSWORD */}
          <div className="relative">

            <label className="text-gray-200 text-sm mb-2 block">
              Password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="
                w-full
                bg-white/10
                border border-white/20
                backdrop-blur-xl
                rounded-2xl
                px-5
                py-4
                pr-14
                text-white
                placeholder-gray-400
                focus:outline-none
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-400/30
                transition-all
              "
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-[48px] text-white/70 hover:text-white"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              py-4
              rounded-2xl
              font-semibold
              text-white
              bg-gradient-to-r
              from-cyan-500
              via-blue-500
              to-indigo-600
              hover:scale-[1.02]
              hover:shadow-[0_10px_40px_rgba(59,130,246,0.5)]
              transition-all
              duration-300
            "
          >
            {loading ? "Logging in..." : "SIGN IN"}
          </button>

        </form>

        {/* Divider */}
        <div className="my-10 flex items-center">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-white/60 text-sm">
            MOBILE APP
          </span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* PWA CARD */}
        <div className="
          border border-white/20
          bg-white/10
          backdrop-blur-xl
          rounded-3xl
          p-6
          text-center
        ">

          <div className="text-5xl mb-3">
            📱
          </div>

          <h3 className="text-white font-bold text-lg mb-2">
            Student Mobile App
          </h3>

          <p className="text-gray-300 text-sm mb-5">
            Access courses, certificates, attendance and results
            directly from your smartphone.
          </p>

          <button className="
            w-full
            bg-white/10
            border border-white/20
            text-white
            py-3
            rounded-2xl
            hover:bg-white/20
            transition-all
          ">
            Coming Soon
          </button>

        </div>

      </div>

    </div>

  </div>
)
}