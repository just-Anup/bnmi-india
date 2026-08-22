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
   const [rotation, setRotation] = useState(0);

   useEffect(() => {
  const interval = setInterval(() => {
    setRotation(prev => prev + 0.5);
  }, 30);

  return () => clearInterval(interval);
}, []);


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
    if (email === "bnmiindia123@gmail.com") {

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

const franchise = res.documents[0];

// ✅ Check Active / Deactive Status
if (franchise.isActive === false) {

  alert("Your franchise account has been deactivated by Admin");

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
  <div className="min-h-screen bg-[#132445] flex items-center justify-center overflow-hidden relative">

    {/* Background Glow */}
    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[180px] rounded-full" />

    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[180px] rounded-full" />

   <div className="grid lg:grid-cols-2 w-full max-w-7xl px-4 md:px-6 lg:px-12">
<div className="hidden lg:flex flex-col justify-center pl-16">

  <h1
    className="
      text-[100px]
      font-black
      text-cyan-400
      leading-none
      drop-shadow-[0_0_35px_#22d3ee]
    "
  >
    BNMI
  </h1>

  <h2 className="text-[55px] font-bold text-blue-600">
    EDUCATION PORTAL
  </h2>

  <div className="mt-20">

    <div className="flex gap-5">

      <div className="w-[4px] bg-cyan-400"></div>

      <div>

        <p className="text-cyan-300 text-3xl font-bold">
          LEARN
        </p>

        <p className="text-blue-500 text-3xl font-bold">
          GROW
        </p>

        <p className="text-blue-500 text-3xl font-bold">
          SUCCEED
        </p>

      </div>

    </div>

    <div className="mt-10 max-w-md">

      <p className="text-gray-300 text-lg leading-relaxed">
        Empowering students through quality education,
        professional certification, skill development,
        and career-focused learning programs.
      </p>

    </div>

  </div>

</div>

      {/* RIGHT SIDE */}
      <div className="flex justify-center items-center">

 <div className="
  relative
  w-full
  max-w-[400px]
  lg:w-[750px]
  lg:h-[750px]
  flex
  items-center
  justify-center
">

          {/* OUTER RING */}
<div
  className="hidden lg:block absolute"
  style={{
    width: "760px",
    height: "760px",
    transform: `rotate(${rotation}deg)`
  }}
>
            {[...Array(60)].map((_, i) => {
              const angle = (360 / 60) * i

              return (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-[10px] h-[55px] rounded-full bg-gradient-to-b from-cyan-300 to-blue-700"
style={{
  transform: `
    translate(-50%, -50%)
    rotate(${angle}deg)
   translateY(-340px)
  `,
}}
                />
              )
            })}
          </div>

         
          {/* LOGIN BOX */}
<div
  className="
    z-10
    w-full
    max-w-[340px]
    sm:max-w-[380px]
    text-center
    px-4
  "
>
           

             <h2 className="text-center text-cyan-400 text-3xl sm:text-4xl font-bold mb-8">
                Login
              </h2>

              <form onSubmit={login}>

                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full
                    bg-transparent
                    border
                    border-cyan-700/50
                    rounded-full
                    px-5
                    py-4
                    text-white
                    mb-5
                    outline-none
                    focus:border-cyan-400
                  "
                />

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full
                      bg-transparent
                      border
                      border-cyan-700/50
                      rounded-full
                      px-5
                      py-4
                      pr-14
                      text-white
                      outline-none
                      focus:border-cyan-400
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-5 top-4 text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    mt-6
                    py-4
                    rounded-full
                    bg-cyan-400
                    text-black
                    font-bold
                    transition-all
                    hover:scale-[1.02]
                    hover:shadow-[0_0_25px_#22d3ee]
                  "
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Logging In...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>

              </form>

              {/* APP COMING SOON */}
          <div className="mt-12 text-center">

  <div className="flex items-center justify-center gap-5">

    <div className="w-16 h-[1px] bg-cyan-500"></div>

    <span className="text-cyan-300 tracking-[6px] text-sm">
      APP COMING SOON
    </span>

    <div className="w-16 h-[1px] bg-cyan-500"></div>

  </div>

  <div className="mt-4 text-cyan-400 text-5xl">
    🚀
  </div>

</div>

      

          </div>

        </div>

      </div>

    </div>

  </div>
)
}