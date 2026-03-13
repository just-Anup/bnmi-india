"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  FileText
} from "lucide-react"

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
]

const pieData = [
  { name: "First Time", value: 65 },
  { name: "Return", value: 35 }
]

const COLORS = ["#22c55e", "#f97316"]

export default function Dashboard() {

  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">Your main content goes here...</p>


      {/* Top Cards */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

        <StatCard
          title="Total Enquiry"
          amount="25,000"
          color="bg-orange-50"
          icon={<DollarSign />}
        />

        <StatCard
          title="Total Admissions"
          amount="1,800"
          percent="+22%"
          color="bg-green-50"
          icon={<ShoppingCart />}
        />

        <StatCard
          title="Certificates Issued"
          amount="9,000"
          percent="+10%" b   
          color="bg-blue-50"
          icon={<CreditCard />}
        />

        <StatCard
          title="Invoice Due"
          amount="$25,000"
          percent="+35%"
          color="bg-yellow-50"
          icon={<FileText />}
        />

      </div>


      {/* Second Row */}

      <div className="grid md:grid-cols-3 gap-6 mb-6">

        <MiniCard
          title="Total Profit"
          amount="$25,458"
          percent="+35%"
        />

        <MiniCard
          title="Total Payment Returns"
          amount="$45,458"
          percent="-20%"
        />

        <MiniCard
          title="Total Expenses"
          amount="$34,458"
          percent="-20%"
        />

      </div>


      {/* Charts Section */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* Bar Chart */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4">
            Sales vs Purchase
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#f97316" />
              <Bar dataKey="purchase" fill="#fb923c" />
            </BarChart>
          </ResponsiveContainer>

        </div>


        {/* Donut Chart */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4">
            Overall Information
          </h2>

          <PieChart width={300} height={300}>

            <Pie
              data={pieData}
              innerRadius={70}
              outerRadius={100}
              dataKey="value"
            >

              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}

            </Pie>

          </PieChart>

          <div className="flex justify-around mt-6">

            <div className="text-center">
              <p className="text-2xl font-bold">5.5K</p>
              <p className="text-green-600 text-sm">First Time</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold">3.5K</p>
              <p className="text-orange-600 text-sm">Return</p>
            </div>

          </div>

        </div>

      </div>

    </div>

  )
}


/* Stat Card */

function StatCard({ title, amount, percent, icon, color }) {

  return (

    <div className={`${color} p-6 rounded-xl border`}>

      <div className="flex items-center justify-between mb-3">

        <p className="text-gray-600">{title}</p>

        <div className="bg-white p-2 rounded">
          {icon}
        </div>

      </div>

      <h2 className="text-2xl font-bold">
        {amount}
      </h2>

      <p className="text-green-600 text-sm">
        {percent} since last month
      </p>

    </div>

  )
}


/* Mini Card */

function MiniCard({ title, amount, percent }) {

  return (

    <div className="bg-white p-6 rounded-xl shadow">

      <h3 className="text-2xl font-bold">
        {amount}
      </h3>

      <p className="text-gray-500 mb-4">
        {title}
      </p>

      <p className="text-sm text-green-600">
        {percent} vs Last Month
      </p>

    </div>

  )

}