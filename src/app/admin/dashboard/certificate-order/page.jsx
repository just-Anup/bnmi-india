"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ORDER_COLLECTION = "certificate_orders";

export default function CertificateOrdersPage() {

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {

  try {

    setLoading(true);

    let allOrders = [];
    let offset = 0;
    const LIMIT = 100;

    while (true) {

      const res = await databases.listDocuments(
        DATABASE_ID,
        ORDER_COLLECTION,
        [
          Query.limit(LIMIT),
          Query.offset(offset),
          Query.orderDesc("$createdAt")
        ]
      );

      if (res.documents.length === 0) break;

      allOrders = [...allOrders, ...res.documents];

      offset += LIMIT;

    }

    setOrders(allOrders);
    setFilteredOrders(allOrders);

  } catch (error) {

    console.log("Fetch Orders Error :", error);

  } finally {

    setLoading(false);

  }

};

useEffect(() => {

  const filtered = orders.filter(order =>

    (order.orderNo || "")
      .toLowerCase()
      .includes(search.toLowerCase())

    ||

    (order.instituteName || "")
      .toLowerCase()
      .includes(search.toLowerCase())

    ||

    (order.franchiseEmail || "")
      .toLowerCase()
      .includes(search.toLowerCase())

  );

  setFilteredOrders(filtered);

}, [search, orders]);

if (loading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <div className="text-xl font-semibold">

        Loading Orders...

      </div>

    </div>

  );

}

return (

<div className="min-h-screen bg-gray-100 p-6">

  {/* HEADER */}

  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">

    <div>

      <h1 className="text-3xl font-bold text-gray-800">

        Certificate Orders

      </h1>

      <p className="text-gray-500">

        Manage Franchise Certificate Orders

      </p>

    </div>

    <input
      type="text"
      placeholder="Search Order..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border rounded-lg px-4 py-3 w-full md:w-96 outline-none focus:ring-2 focus:ring-indigo-500"
    />

  </div>

  {/* TABLE */}

  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

    <div className="overflow-x-auto">

      <table className="min-w-full">

        <thead className="bg-indigo-600 text-white">

          <tr>

            <th className="p-4 text-left">

              Order No

            </th>

            <th className="p-4 text-left">

              Institute

            </th>

            <th className="p-4 text-left">

              Franchise Email

            </th>

            <th className="p-4 text-center">

              Students

            </th>

            <th className="p-4 text-center">

              Status

            </th>

            <th className="p-4 text-center">

              Order Date

            </th>

            <th className="p-4 text-center">

              Action

            </th>

          </tr>

        </thead>

        <tbody>

          {filteredOrders.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="text-center py-12 text-gray-500"
              >

                No Orders Found

              </td>

            </tr>

          ) : (

            filteredOrders.map((order) => (

              <tr
                key={order.$id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4 font-semibold">

                  {order.orderNo}

                </td>

                <td className="p-4">

                  {order.instituteName}

                </td>

                <td className="p-4">

                  {order.franchiseEmail}

                </td>

                <td className="p-4 text-center">

                  {order.totalStudents}

                </td>

                <td className="p-4 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === "Printed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >

                    {order.status}

                  </span>

                </td>

                <td className="p-4 text-center">

                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "-"}

                </td>

                <td className="p-4 text-center">

                 <Link
  href={`/admin/dashboard/certificate-order/${order.$id}`}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
>
  View
</Link>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>

</div>

);
}