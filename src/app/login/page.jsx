'use client'

import { useRouter } from 'next/navigation'

export default function LoginSelect() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[450px] text-center space-y-6">

        <h2 className="text-2xl font-bold">Login Here </h2>

        {/* WEBSITE MANAGEMENT */}
        {/* <button
          onClick={() => router.push('/login/website')}
          className="w-full bg-black text-white py-3 rounded"
        >
          Website Management
        </button> */}

        {/* INSTITUTE LOGIN */}
                <button
          onClick={() => router.push('/login/institute')}
          className="w-full bg-black text-white py-3 rounded"
        >
          Institute Login
        </button>
        
        {/* <button
          onClick={() => router.push('/login/institute')}
          className="w-full bg-sky-500 text-white py-3 rounded"
        >
          Institute Login
        </button>  */}

      </div>
    </div>
  )
}
