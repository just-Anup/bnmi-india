
"use client";

import { useCallback, useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Video,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

const COURSE_API = "/api/admin/learning/courses";
const LESSON_API = "/api/admin/learning/lessons";

const emptyCourse = {
  title: "",
  slug: "",
  description: "",
  category: "",
  thumbnailUrl: "",
  instructorName: "",
  price: "0",
  level: "Beginner",
  status: "draft",
};

const emptyLesson = {
  title: "",
  description: "",
  videoType: "youtube",
  videoUrl: "",
  videoFileId: "",
  videoBucketId: "",
  order: "1",
  durationSeconds: "",
  isFreePreview: false,
  status: "published",
};

export default function LearningCoursesAdmin() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [lessonForm, setLessonForm] = useState(emptyLesson);

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Obtain a real Appwrite session JWT for protected API requests.
  const api = useCallback(async (path, options = {}) => {
    await account.get();

    const jwtResponse = await account.createJWT();

    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-appwrite-jwt": jwtResponse.jwt,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api(COURSE_API);
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message || "Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadLessons = useCallback(async (courseId) => {
    const data = await api(
      `${LESSON_API}?courseId=${encodeURIComponent(courseId)}`
    );

    setLessons(data.lessons || []);
    return data.lessons || [];
  }, [api]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  function resetCourseForm() {
    setCourseForm(emptyCourse);
    setEditingCourseId(null);
  }

  function resetLessonForm(nextOrder = 1) {
    setLessonForm({
      ...emptyLesson,
      order: String(nextOrder),
    });

    setEditingLessonId(null);
    setVideoFile(null);
    setUploadProgress("");
  }
  async function selectCourse(course) {
    setSelectedCourse(course);
    setError("");
    setNotice("");

    try {
      const loaded = await loadLessons(course.$id);

      const nextOrder = loaded.length
        ? Math.max(...loaded.map((lesson) => lesson.order)) + 1
        : 1;

      resetLessonForm(nextOrder);
    } catch (err) {
      setError(err.message || "Unable to load lessons.");
    }
  }

  function editCourse(course) {
    setEditingCourseId(course.$id);

    setCourseForm({
      title: course.title || "",
      slug: course.slug || "",
      description: course.description || "",
      category: course.category || "",
      thumbnailUrl: course.thumbnailUrl || "",
      instructorName: course.instructorName || "",
      price: String(course.price ?? 0),
      level: course.level || "Beginner",
      status: course.status || "draft",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLesson(event) {
    event.preventDefault();

    if (!selectedCourse) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      let uploadedVideo = {
        videoFileId: lessonForm.videoFileId || "",
        videoBucketId: lessonForm.videoBucketId || "",
      };

      if (lessonForm.videoType === "appwrite" && videoFile) {
        uploadedVideo = await uploadLessonVideo();
      }

      if (
        lessonForm.videoType === "appwrite" &&
        !uploadedVideo.videoFileId
      ) {
        throw new Error("Please upload a video before saving the lesson.");
      }

      const payload = {
        ...lessonForm,
        courseId: selectedCourse.$id,
        order: Number(lessonForm.order),
        durationSeconds: Number(lessonForm.durationSeconds || 0),

        videoFileId:
          lessonForm.videoType === "appwrite"
            ? uploadedVideo.videoFileId
            : "",

        videoBucketId:
          lessonForm.videoType === "appwrite"
            ? uploadedVideo.videoBucketId
            : "",

        videoUrl:
          lessonForm.videoType === "appwrite"
            ? ""
            : lessonForm.videoUrl,
      };

      await api(LESSON_API, {
        method: editingLessonId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...payload,
          ...(editingLessonId ? { id: editingLessonId } : {}),
        }),
      });

      setNotice(
        editingLessonId
          ? "Lesson updated successfully."
          : "Lesson added successfully."
      );

      const updatedLessons = await loadLessons(selectedCourse.$id);

      const nextOrder = updatedLessons.length
        ? Math.max(...updatedLessons.map((lesson) => lesson.order)) + 1
        : 1;

      resetLessonForm(nextOrder);
    } catch (err) {
      setError(err.message || "Unable to save lesson.");
    } finally {
      setSaving(false);
      setUploadingVideo(false);
    }
  }
  async function togglePublish(course) {
    setError("");
    setNotice("");

    try {
      if (course.status === "draft") {
        const data = await api(
          `${LESSON_API}?courseId=${encodeURIComponent(course.$id)}`
        );

        const courseLessons = data.lessons || [];

        if (!courseLessons.some((lesson) => lesson.isFreePreview)) {
          throw new Error(
            "Mark the introductory lesson as the free preview first."
          );
        }

        if (!courseLessons.some((lesson) => lesson.status === "published")) {
          throw new Error("Publish at least one lesson first.");
        }
      }

      const result = await api(COURSE_API, {
        method: "PATCH",
        body: JSON.stringify({
          ...course,
          status: course.status === "published" ? "draft" : "published",
        }),
      });

      setNotice(
        result.course.status === "published"
          ? "Course published successfully."
          : "Course unpublished successfully."
      );

      if (selectedCourse?.$id === course.$id) {
        setSelectedCourse(result.course);
      }

      await loadCourses();
    } catch (err) {
      setError(err.message || "Unable to update course status.");
    }
  }

  async function deleteCourse(course) {
    if (
      !window.confirm(
        `Delete "${course.title}"? Only draft courses can be deleted.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api(
        `${COURSE_API}?id=${encodeURIComponent(course.$id)}`,
        { method: "DELETE" }
      );

      if (selectedCourse?.$id === course.$id) {
        setSelectedCourse(null);
        setLessons([]);
      }

      if (editingCourseId === course.$id) {
        resetCourseForm();
      }

      setNotice("Course deleted.");
      await loadCourses();
    } catch (err) {
      setError(err.message || "Unable to delete course.");
    }
  }


  function editLesson(lesson) {
    setEditingLessonId(lesson.$id);

    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      videoType:
        lesson.videoType === "appwrite"
          ? "appwrite"
          : lesson.videoType === "youtube"
            ? "youtube"
            : "url",
      videoUrl: lesson.videoUrl || "",
      videoFileId: lesson.videoFileId || "",
      videoBucketId: lesson.videoBucketId || "",
      order: String(lesson.order || 1),
      durationSeconds: String(lesson.durationSeconds || ""),
      isFreePreview: Boolean(lesson.isFreePreview),
      status: lesson.status || "draft",
    });

    setVideoFile(null);
    setUploadProgress("");
  }

  async function uploadLessonVideo() {
    if (!videoFile) {
      throw new Error("Please select a video file.");
    }

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-m4v",
    ];

    const allowedExtensions = [".mp4", ".webm", ".mov", ".m4v"];

    const extension = videoFile.name
      .toLowerCase()
      .slice(videoFile.name.lastIndexOf("."));

    if (
      !allowedExtensions.includes(extension) ||
      (videoFile.type && !allowedTypes.includes(videoFile.type))
    ) {
      throw new Error("Select an MP4, WebM, MOV or M4V video.");
    }

    if (videoFile.size > 100 * 1024 * 1024) {
      throw new Error("Video must not exceed 100 MB.");
    }

    setUploadingVideo(true);
    setUploadProgress("Uploading video to Appwrite...");

    try {
      await account.get();

      const jwtResponse = await account.createJWT();

      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch(
        "/api/admin/learning/upload-video",
        {
          method: "POST",
          headers: {
            "x-appwrite-jwt": jwtResponse.jwt,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Video upload failed.");
      }

      setUploadProgress("Video uploaded successfully.");

      return {
        videoFileId: result.fileId,
        videoBucketId: result.bucketId,
      };
    } finally {
      setUploadingVideo(false);
    }
  }

  async function deleteLesson(lesson) {
    if (!window.confirm(`Delete lesson "${lesson.title}"?`)) return;

    setError("");
    setNotice("");

    try {
      await api(
        `${LESSON_API}?id=${encodeURIComponent(lesson.$id)}`,
        { method: "DELETE" }
      );

      if (editingLessonId === lesson.$id) {
        resetLessonForm();
      }

      const updatedLessons = await loadLessons(selectedCourse.$id);

      setNotice("Lesson deleted.");

      resetLessonForm(
        updatedLessons.length
          ? Math.max(...updatedLessons.map((item) => item.order)) + 1
          : 1
      );
    } catch (err) {
      setError(err.message || "Unable to delete lesson.");
    }
  }

  const selectedIsDraft = selectedCourse?.status === "draft";

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              BNMI Learning
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Course Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Create courses, manage lessons, and publish learning content.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCourses}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold hover:bg-slate-100"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingCourseId ? "Edit course" : "Create a course"}
              </h2>
              <p className="text-sm text-slate-500">
                Fill in the course details.
              </p>
            </div>
          </div>

          <form onSubmit={saveCourse} className="grid gap-5 md:grid-cols-2">
            <Field label="Course title *">
              <input
                required
                maxLength={255}
                className="input"
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, title: e.target.value })
                }
                placeholder="e.g. Web Development with Next.js"
              />
            </Field>

            <Field label="URL slug (optional)">
              <input
                maxLength={255}
                className="input"
                value={courseForm.slug}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, slug: e.target.value })
                }
                placeholder="web-development-nextjs"
              />
              <p className="mt-1 text-xs font-normal text-slate-500">
                Leave blank to generate it from the title.
              </p>
            </Field>

            <Field label="Category *">
              <input
                required
                maxLength={100}
                className="input"
                value={courseForm.category}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, category: e.target.value })
                }
                placeholder="Computer, Design, Marketing..."
              />
            </Field>

            <Field label="Instructor name *">
              <input
                required
                maxLength={255}
                className="input"
                value={courseForm.instructorName}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    instructorName: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Price in INR *">
              <input
                required
                type="number"
                min="0"
                max="10000000"
                step="0.01"
                className="input"
                value={courseForm.price}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, price: e.target.value })
                }
              />
            </Field>

            <Field label="Course level">
              <select
                className="input"
                value={courseForm.level}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, level: e.target.value })
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </Field>

            <Field label="Thumbnail image URL">
              <input
                type="url"
                maxLength={2000}
                className="input"
                value={courseForm.thumbnailUrl}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    thumbnailUrl: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </Field>

            <Field label="Status">
              <select
                className="input"
                value={courseForm.status}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, status: e.target.value })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Course description *">
                <textarea
                  required
                  maxLength={10000}
                  rows={5}
                  className="input resize-y"
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Explain what students will learn..."
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save size={17} />
                {saving
                  ? "Saving..."
                  : editingCourseId
                    ? "Update course"
                    : "Create course"}
              </button>

              {editingCourseId && (
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="rounded-xl border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Your courses</h2>

          {loading ? (
            <p className="py-8 text-slate-500">Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
              No courses created yet. Use the form above to create your first one.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.$id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${selectedCourse?.$id === course.$id
                      ? "border-indigo-500 ring-2 ring-indigo-100"
                      : ""
                    }`}
                >
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-indigo-600 to-slate-900 text-white">
                      <BookOpen size={42} />
                    </div>
                  )}

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-indigo-600">
                          {course.category}
                        </p>
                        <h3 className="mt-1 font-bold text-slate-900">
                          {course.title}
                        </h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {course.status}
                      </span>
                    </div>

                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-slate-500">
                        {course.instructorName}
                      </span>
                      <strong>
                        ₹{Number(course.price).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => selectCourse(course)}
                        className="flex items-center justify-center gap-2 rounded-lg border p-2 text-sm hover:bg-slate-50"
                      >
                        <Video size={16} /> Lessons
                      </button>

                      <button
                        type="button"
                        onClick={() => editCourse(course)}
                        className="flex items-center justify-center gap-2 rounded-lg border p-2 text-sm hover:bg-slate-50"
                      >
                        <Pencil size={16} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePublish(course)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-50 p-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        {course.status === "published" ? (
                          <><EyeOff size={16} /> Unpublish</>
                        ) : (
                          <><Eye size={16} /> Publish</>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCourse(course)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedCourse && (
          <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Lesson management
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {selectedCourse.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(null);
                  setLessons([]);
                }}
                className="rounded-lg border p-2"
                aria-label="Close lesson manager"
              >
                <X size={18} />
              </button>
            </div>

            {!selectedIsDraft && (
              <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Unpublish this course before changing its lessons.
              </p>
            )}

            <div className="mb-8 space-y-3">
              {lessons.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                  No lessons yet. Add the introductory video below.
                </p>
              ) : (
                lessons.map((lesson) => (
                  <div
                    key={lesson.$id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                        <Video size={20} />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {lesson.order}. {lesson.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {lesson.isFreePreview ? "Free preview" : "Paid lesson"}
                          {" · "}
                          {lesson.videoType === "appwrite" ? "Appwrite Video" : "YouTube"}
                          {" · "}
                          {lesson.status}
                          {" · "}{Math.floor((lesson.durationSeconds || 0) / 60)} min
                        </p>
                      </div>
                    </div>
                    

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!selectedIsDraft}
                        onClick={() => editLesson(lesson)}
                        className="rounded-lg border p-2 disabled:opacity-40"
                        aria-label="Edit lesson"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        disabled={!selectedIsDraft}
                        onClick={() => deleteLesson(lesson)}
                        className="rounded-lg border border-red-100 p-2 text-red-600 disabled:opacity-40"
                        aria-label="Delete lesson"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={saveLesson}
              className="grid gap-5 border-t pt-6 md:grid-cols-2"
            >
              <h3 className="text-lg font-bold md:col-span-2">
                {editingLessonId ? "Edit lesson" : "Add a lesson"}
              </h3>

              <Field label="Lesson title *">
                <input
                  required
                  maxLength={255}
                  className="input"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  placeholder="Introduction to the course"
                />
              </Field>

              <Field label="Video source *">
                <select
                  className="input"
                  value={lessonForm.videoType}
                  onChange={(e) => {
                    const type = e.target.value;

                    setLessonForm({
                      ...lessonForm,
                      videoType: type,
                      videoUrl: "",
                      videoFileId: "",
                      videoBucketId: "",
                    });

                    setVideoFile(null);
                    setUploadProgress("");
                  }}
                >
                  <option value="youtube">YouTube Video</option>
                  <option value="appwrite">Upload Video to Appwrite</option>
                </select>
              </Field>

              {lessonForm.videoType === "youtube" && (
                <Field label="YouTube video URL *">
                  <input
                    required
                    type="url"
                    maxLength={2000}
                    className="input"
                    value={lessonForm.videoUrl}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        videoUrl: e.target.value,
                      })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="mt-1 text-xs font-normal text-slate-500">
                    Paste the YouTube video link for this lesson.
                  </p>
                </Field>
              )}

              {lessonForm.videoType === "appwrite" && (
                <div className="md:col-span-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Select video file *
                  </label>

                  <input
                    type="file"
                    accept=".mp4,.webm,.mov,.m4v,video/mp4,video/webm,video/quicktime"
                    className="mt-3 block w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setVideoFile(file);
                      setUploadProgress("");
                    }}
                  />

                  {videoFile && (
                    <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                      <p className="font-semibold text-gray-800">
                        {videoFile.name}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  {!videoFile && lessonForm.videoFileId && (
                    <p className="mt-3 text-sm text-green-700">
                      Existing uploaded video is saved. Select another file only
                      if you want to replace it.
                    </p>
                  )}

                  <p className="mt-3 text-xs text-gray-600">
                    Supported: MP4, WebM, MOV and M4V. Maximum 100 MB per video.
                  </p>

                  {uploadProgress && (
                    <p className="mt-3 text-sm font-semibold text-indigo-700">
                      {uploadProgress}
                    </p>
                  )}
                </div>
              )}
              <Field label="Lesson order *">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={lessonForm.order}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, order: e.target.value })
                  }
                />
              </Field>

              <Field label="Duration in seconds">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="input"
                  value={lessonForm.durationSeconds}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      durationSeconds: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Lesson status">
                <select
                  className="input"
                  value={lessonForm.status}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, status: e.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  maxLength={2000}
                  className="input resize-y"
                  value={lessonForm.description}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      description: e.target.value,
                    })
                  }
                />
              </Field>

              <label className="flex items-center gap-3 rounded-xl border p-4 md:col-span-2">
                <input
                  type="checkbox"
                  checked={lessonForm.isFreePreview}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      isFreePreview: e.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-indigo-600"
                />
                <span>
                  <strong className="block">Free introductory lesson</strong>
                  <span className="text-sm font-normal text-slate-500">
                    Students can preview this lesson without purchasing the course.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  disabled={saving || !selectedIsDraft}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-40"
                >
                  <Plus size={17} />
                  {saving
                    ? "Saving..."
                    : editingLessonId
                      ? "Update lesson"
                      : "Add lesson"}
                </button>

                {editingLessonId && (
                  <button
                    type="button"
                    onClick={() => resetLessonForm()}
                    className="rounded-xl border px-5 py-3 font-semibold"
                  >
                    Cancel editing
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>

      <style jsx>{`
        .input {
          display: block;
          width: 100%;
          margin-top: 6px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 11px 13px;
          color: #0f172a;
          background: white;
          outline: none;
        }

        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
