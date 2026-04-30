"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

import {
  DollarSign, ShoppingCart, CreditCard, FileText
} from "lucide-react";

const barData = [
  { name: "28 Jan", sales: 75, purchase: 45 },
  { name: "29 Jan", sales: 85, purchase: 55 },
  { name: "30 Jan", sales: 100, purchase: 58 },
  { name: "31 Jan", sales: 97, purchase: 56 },
  { name: "1 Feb", sales: 87, purchase: 61 },
  { name: "2 Feb", sales: 105, purchase: 58 },
  { name: "3 Feb", sales: 90, purchase: 63 },
  { name: "4 Feb", sales: 115, purchase: 60 },
  { name: "5 Feb", sales: 95, purchase: 66 }
];

const pieData = [
  { name: "First Time", value: 65 },
  { name: "Return", value: 35 }
];

const COLORS = ["#22c55e", "#f97316"];

export default function Dashboard() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-blue-50 p-4 md:p-8">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to BNMI Dashboard</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

        <StatCard title="Total Enquiry" amount="25,000" icon={<DollarSign />} color="from-orange-400 to-orange-600" />
        <StatCard title="Admissions" amount="1,800" icon={<ShoppingCart />} color="from-green-400 to-green-600" />
        <StatCard title="Certificates" amount="9,000" icon={<CreditCard />} color="from-blue-400 to-blue-600" />
        <StatCard title="Courses" amount="610" icon={<FileText />} color="from-purple-400 to-purple-600" />

      </div>

      {/* MINI CARD */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg text-gray-500">Franchises</h3>
          <p className="text-3xl font-bold">206</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BAR */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <h2 className="font-semibold mb-4">Enquiry vs Admissions</h2>

          <div className="w-full h-[250px] md:h-[300px]">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#f97316" radius={[6,6,0,0]} />
                <Bar dataKey="purchase" fill="#fb923c" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 flex flex-col items-center">
          <h2 className="font-semibold mb-4">Overall Info</h2>

          <div className="w-full h-[250px] md:h-[300px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={90} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around w-full mt-4">
            <div className="text-center">
              <p className="text-xl font-bold">5.5K</p>
              <p className="text-green-500 text-sm">First Time</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">3.5K</p>
              <p className="text-orange-500 text-sm">Return</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

/* STAT CARD */
function StatCard({ title, amount, icon, color }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white p-5 rounded-2xl shadow-lg hover:scale-105 transition`}>
      <div className="flex justify-between items-center mb-2">
        <p>{title}</p>
        <div className="bg-white/20 p-2 rounded-lg">{icon}</div>
      </div>
      <h2 className="text-2xl font-bold">{amount}</h2>
    </div>
  );
}