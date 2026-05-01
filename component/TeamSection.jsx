"use client";

import { useEffect, useRef, useState } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "team";
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

export default function TeamSlider() {
  const [team, setTeam] = useState([]);
  const [current, setCurrent] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  const startX = useRef(0);
  const isDragging = useRef(false);

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const updateView = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };

    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  /* ================= FETCH CMS ================= */
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderAsc("order")]
        );
        setTeam(res.documents || []);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchTeam();
  }, []);

  /* ================= SAFE VALUES ================= */
  const safeTeam = Array.isArray(team) ? team : [];
  const maxIndex = Math.max(0, safeTeam.length - itemsPerView);

  /* ================= NAVIGATION ================= */
  const next = () => {
    setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrent((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  /* ================= AUTO SLIDE ================= */
  useEffect(() => {
    if (!safeTeam.length) return;

    const interval = setInterval(() => {
      next();
    }, 4000);

    return () => clearInterval(interval);
  }, [safeTeam.length, itemsPerView]);

  /* ================= DRAG ================= */
  const handleStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches
      ? e.touches[0].clientX
      : e.clientX;
  };

  const handleEnd = (e) => {
    if (!isDragging.current) return;

    const endX = e.changedTouches
      ? e.changedTouches[0].clientX
      : e.clientX;

    const diff = startX.current - endX;

    if (diff > 50) next();
    else if (diff < -50) prev();

    isDragging.current = false;
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
        const id = image.$id || image.fileId || image.id;
        if (id) {
          return storage.getFileView(BUCKET_ID, id).href;
        }
      }

      return "/placeholder.png";
    } catch {
      return "/placeholder.png";
    }
  };

  /* ================= UI ================= */
  if (!safeTeam.length) {
    return (
      <section className="py-16 text-center text-white bg-[#1e1e1e]">
        Loading team...
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#1e1e1e] text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">

        <h2 className="text-3xl font-bold mb-10">
          Our <span className="text-cyan-400">Team</span>
        </h2>

        {/* SLIDER */}
        <div
          className="overflow-hidden"
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${current * (100 / itemsPerView)}%)`,
            }}
          >
            {safeTeam.map((member) => (
              <div
                key={member.$id}
                className="px-3"
                style={{ flex: `0 0 ${100 / itemsPerView}%` }}
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
                <p className="text-gray-400 text-xs">
                  {member.experience}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            ←
          </button>
          <button
            onClick={next}
            className="px-4 py-2 bg-cyan-500 rounded"
          >
            →
          </button>
        </div>

      </div>
    </section>
  );
}