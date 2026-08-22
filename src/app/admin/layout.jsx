"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function AdminLayout({ children }) {

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const checkSession = async () => {

      try {

        // wait a little for appwrite session restore
        await new Promise((resolve) => setTimeout(resolve, 800));

        const adminAuth = localStorage.getItem("adminAuth");

        // FIRST CHECK LOCAL STORAGE
        if (adminAuth !== "true") {
          router.replace("/login/institute");
          return;
        }

        // THEN CHECK APPWRITE SESSION
        const user = await account.get();

        if (user.email !== "bnmiindia123@gmail.com") {

          localStorage.removeItem("adminAuth");

          router.replace("/login/institute");

          return;
        }

        setLoading(false);

      } catch (error) {

        console.error(error);

        localStorage.removeItem("adminAuth");

        router.replace("/login/institute");

      }

    };

    checkSession();

  }, [router]);

  // LOADING SCREEN
  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-white">

        <div className="text-center">

          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-600 font-medium">
            Loading Admin Panel...
          </p>

        </div>

      </div>

    );

  }

  return children;

}