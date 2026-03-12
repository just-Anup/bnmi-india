export default function TestimonialCard({
  name,
  role,
  image,
  text,
}) {
  return (
    <div className="min-w-[620px] bg-white rounded-2xl shadow-xl p-10 relative">

      {/* Top Row */}
      <div className="flex justify-between items-start mb-6">

        {/* Stars */}
        <div className="flex text-orange-400 text-lg">
          ★★★★★
        </div>

        {/* Profile Image */}
        {image && image !== '' && (
          <img
            src={image}
            alt={name || 'student'}
            className="w-20 h-20 rounded-xl object-cover"
          />
        )}

      </div>

      {/* Name + Role */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-extrabold tracking-wide">
          {name}
        </h3>
        <p className="text-[#19b9f1] text-lg font-medium">
          {role}
        </p>
      </div>

      {/* Quote + Text */}
      <div className="relative">
        <div className="text-7xl text-gray-300 absolute -top-6 -left-2 leading-none">
          “
        </div>

        <p className="text-gray-700 text-lg leading-relaxed pl-10">
          {text}
        </p>
      </div>
    </div>
  )
}
 