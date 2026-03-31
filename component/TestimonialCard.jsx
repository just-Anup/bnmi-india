export default function TestimonialCard({
  name,
  role,
  image,
  text,
}) {
  return (
    <div className="min-w-[420px] max-w-[420px] bg-white border border-gray-200 rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

      {/* Top Row */}
      <div className="flex justify-between items-center mb-4">

        {/* Stars */}
        <div className="flex text-yellow-400 text-sm">
          ★★★★★
        </div>

        {/* Image */}
        {image && image !== '' && (
          <img
            src={image}
            alt={name || 'student'}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
          />
        )}
      </div>

      {/* Text */}
      <div className="relative mb-6">
        <span className="absolute -top-4 -left-2 text-5xl text-gray-200">
          “
        </span>

        <p className="text-gray-700 text-sm leading-relaxed pl-6">
          {text}
        </p>
        <span className="absolute top-30 left-30 text-5xl text-gray-200">
          ”
        </span>
      </div>

      {/* Name + Role */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {name || 'Student Name'}
        </h3>
        <p className="text-sm text-[#19b9f1] font-medium">
          {role || 'Student'}
        </p>
      </div>
    </div>
  )
}