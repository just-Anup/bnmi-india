
"use client";

import { useEffect, useState } from "react";
import { Search, BookOpen, GraduationCap, RefreshCw } from "lucide-react";

export default function ExploreCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/learning/public-courses", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load courses.");
        }

        if (active) {
          setCourses(Array.isArray(data.courses) ? data.courses : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load courses.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const categories = [
    "All",
    ...new Set(
      courses
        .map((course) => course.category)
        .filter(Boolean)
    ),
  ];

  const filteredCourses = courses.filter((course) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      course.title?.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      course.instructorName?.toLowerCase().includes(term) ||
      course.category?.toLowerCase().includes(term);

    const matchesCategory =
      category === "All" || course.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-full bg-gray-50">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-[#2d2a1f] to-[#51472d] p-7 text-white md:p-10">
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <GraduationCap size={19} />
          BNMI Learning
        </div>

        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          Explore Courses
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-200 md:text-base">
          Discover new skills, learn from expert instructors, and take
          the next step in your learning journey.
        </p>

        <div className="mt-6 flex max-w-xl items-center gap-3 rounded-xl bg-white px-4 py-3 text-gray-700 shadow">
          <Search size={20} className="shrink-0 text-gray-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses, skills or instructors..."
            className="w-full bg-transparent text-sm outline-none"
            aria-label="Search courses"
          />
        </div>
      </section>

      {/* Course list */}
      <section className="py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Available Courses
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading courses..."
                : `${filteredCourses.length} ${
                    filteredCourses.length === 1 ? "course" : "courses"
                  } found`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === item
                    ? "bg-[#3b3727] text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="h-44 bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Could not load courses</p>
            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm text-white"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredCourses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center">
            <BookOpen className="mx-auto text-gray-400" size={42} />

            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              {courses.length === 0
                ? "Courses are coming soon"
                : "No matching courses"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {courses.length === 0
                ? "Published courses will appear here when they are available."
                : "Try another search term or select a different category."}
            </p>
          </div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#e9e4d5] to-[#d5c9a9]">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <BookOpen size={54} className="text-[#75663e]" />
                  )}

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    {course.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#82713d]">
                      {course.level}
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                      {Number(course.price) === 0
                        ? "Free"
                        : `₹${Number(course.price).toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-lg font-bold text-gray-900">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-5 text-gray-600">
                    {course.description}
                  </p>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500">
                      Instructor
                    </p>

                    <p className="mt-1 font-medium text-gray-800">
                      {course.instructorName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        `/student/course/${encodeURIComponent(course.slug)}`;
                    }}
                    className="mt-5 w-full rounded-xl bg-[#3b3727] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#51472d]"
                  >
                    View Course
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
