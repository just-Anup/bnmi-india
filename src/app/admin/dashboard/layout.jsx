import AdminTopSwitch from "../../../../component/admin/AdminTopSwitch";

export default function WebsiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <AdminTopSwitch />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen p-4 md:p-6 lg:p-6">
        {children}
      </main>

    </div>
  );
}