"use client";

import { useEffect, useRef, useState } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "team";
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

export default function TeamSlider() {
  const sliderRef = useRef(null);

  const [team, setTeam] = useState([]);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [index, setIndex] = useState(0);

  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderAsc("order")]
        );
        setTeam(res.documents);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeam();
  }, []);

  const safeItems = Math.min(itemsPerView, team.length || 1);
  const maxIndex = Math.max(0, team.length - safeItems);

  /* ================= NAVIGATION ================= */
  const next = () => {
    setIndex((prev) => {
      if (prev === maxIndex) return 0; // 🔥 strict check
      return prev + 1;
    });
  };

  const prev = () => {
    setIndex((prev) => {
      if (prev === 0) return maxIndex;
      return prev - 1;
    });
  };

  /* ================= AUTO ================= */
  useEffect(() => {
    if (!team.length) return;

    const timer = setInterval(() => {
      if (!isDragging) next();
    }, 4000);

    return () => clearInterval(timer);
  }, [team, isDragging]);

  /* ================= DRAG ================= */
  const handleStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches ? e.touches[0].clientX : e.clientX);
  };

  const handleEnd = (e) => {
    if (!isDragging) return;

    const endX = e.changedTouches
      ? e.changedTouches[0].clientX
      : e.clientX;

    const diff = startX - endX;

    if (diff > 50) next();
    else if (diff < -50) prev();

    setIsDragging(false);
  };

  /* ================= IMAGE ================= */
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";

    try {
      if (typeof image === "string" && image.startsWith("http")) {
        return image;
      }

      if (typeof image === "string") {
        return storage.getFileView(BUCKET_ID, image).href;
      }

      if (typeof image === "object") {
        const fileId = image.$id || image.fileId || image.id;
        if (fileId) {
          return storage.getFileView(BUCKET_ID, fileId).href;
        }
      }

      return "/placeholder.png";
    } catch {
      return "/placeholder.png";
    }
  };

  if (!team.length) return null;

  return (
    <section className="py-16 bg-[#1e1e1e] text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">

        <h2 className="text-3xl font-bold mb-10">
          Our <span className="text-cyan-400">Team</span>
        </h2>

        <div
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
        >
          <div
            ref={sliderRef}
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${index * (100 / safeItems)}%)`,
              width: `${(team.length * 100) / safeItems}%`,
            }}
          >
            {team.map((member) => (
              <div
                key={member.$id}
                className="px-3"
                style={{ width: `${100 / safeItems}%` }}
              >
                <div className="bg-black rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(member.imageUrl)}
                    alt={member.name}
                    className="w-full h-[260px] md:h-[320px] object-contain"
                  />
                </div>

                <h4 className="mt-4 font-bold">{member.name}</h4>
                <p className="text-cyan-400 text-sm">{member.role}</p>
                <p className="text-gray-400 text-xs">{member.experience}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}