'use client'

import { Phone, MessageCircle, Instagram, Facebook } from 'lucide-react'

export default function HelpDeskPage() {

  const contacts = [
    {
      title: 'Call Support',
      desc: '+91 9508524835',
      icon: Phone,
      bg: 'bg-green-100',
      color: 'text-green-600',
      action: () => window.open('tel:+919508524835')
    },
    {
      title: 'WhatsApp Support',
      desc: 'Chat instantly on WhatsApp',
      icon: MessageCircle,
      bg: 'bg-green-100',
      color: 'text-green-600',
      action: () => window.open('https://wa.me/919508524835')
    },
    {
      title: 'Instagram',
      desc: '@yourpage',
      icon: Instagram,
      bg: 'bg-pink-100',
      color: 'text-pink-600',
      action: () => window.open('https://instagram.com/yourpage')
    },
    {
      title: 'Facebook',
      desc: 'Your Page',
      icon: Facebook,
      bg: 'bg-blue-100',
      color: 'text-blue-600',
      action: () => window.open('https://facebook.com/yourpage')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">Help Desk</h1>
        <p className="text-gray-600 mb-6">
          Get support quickly through any of the following options.
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {contacts.map((item, index) => {
            const Icon = item.icon

            return (
              <div
                key={index}
                onClick={item.action}
                className="bg-white p-5 rounded-2xl shadow-md flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
              >
                <div className={`${item.bg} p-3 rounded-xl`}>
                  <Icon className={item.color} size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            )
          })}

        </div>

      </div>
    </div>
  )
}