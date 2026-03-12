"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function AdminLayout({ children }) {

  const router = useRouter();

  useEffect(() => {

    const checkSession = async () => {

      try {

        const user = await account.get();

        if (user.email !== "bnmiindia@gmail.com") {
          router.replace("/login");
        }

      } catch {
        router.replace("/login");
      }

    };

    checkSession();

  }, []);

  return children;

}