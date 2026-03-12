export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">

      <Card title="Total Students" value="0" />
      <Card title="Wallet Balance" value="₹ 0" />
      <Card title="Certificates Issued" value="0" />
      <Card title="Pending Exams" value="0" />
      <Card title="Attendance Today" value="0" />
      <Card title="Recharge Requests" value="0" />

    </div>
  )
}

function Card({ title, value }) {
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}
