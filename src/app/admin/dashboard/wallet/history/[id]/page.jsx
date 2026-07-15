'use client'

import { useEffect, useState, use } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const CACHE_KEY = "bnmi-wallet-history-cache";
const CACHE_TIME = 60 * 60 * 1000; // 1 Hour

export default function WalletHistory({ params }) {

  const router = useRouter();

  // Dynamic Route
  const { id } = use(params);

  // Loading
  const [loading, setLoading] = useState(true);

  // Franchise Details
  const [franchise, setFranchise] = useState(null);

  // Transactions
  const [transactions, setTransactions] = useState([]);

  // Filtered Transactions
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Search
  const [search, setSearch] = useState("");

  // Date Filter
  const [selectedDate, setSelectedDate] = useState("");

  // Summary Cards
  const [summary, setSummary] = useState({

    totalRecharge: 0,

    totalDeduct: 0,

    totalTransactions: 0,

    currentBalance: 0

  });


// ==============================
// FETCH HISTORY
// ==============================

const fetchHistory = async () => {

  try {

    setLoading(true);

    // ---------- Check Browser Cache ----------
    const cache = localStorage.getItem(`${CACHE_KEY}-${id}`);

    if (cache) {

      const parsed = JSON.parse(cache);

      if (Date.now() - parsed.time < CACHE_TIME) {

        console.log("Wallet History Cache Loaded");

        setFranchise(parsed.franchise);
        setTransactions(parsed.transactions);
        setFilteredTransactions(parsed.transactions);
        setSummary(parsed.summary);

        setLoading(false);

        return;
      }

    }

    // ---------- Franchise ----------
    const franchiseRes = await databases.getDocument(
      DATABASE_ID,
      "franchise_approved",
      id
    );

    // ---------- Transactions ----------
    let allTransactions = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "wallet_transactions",
        [
          Query.equal("franchiseId", id),
          Query.limit(100),
          Query.offset(offset),
          Query.orderDesc("date")
        ]
      );

      allTransactions = [
        ...allTransactions,
        ...res.documents
      ];

      if (res.documents.length < 100) {

        hasMore = false;

      } else {

        offset += 100;

      }

    }

    // ---------- Summary ----------

    let recharge = 0;
    let deduct = 0;

    allTransactions.forEach((item) => {

      if (item.type === "add") {

        recharge += Number(item.amount);

      } else {

        deduct += Number(item.amount);

      }

    });

    const summaryData = {

      totalRecharge: recharge,

      totalDeduct: deduct,

      totalTransactions: allTransactions.length,

      currentBalance:
        Number(franchiseRes.wallet || 0)

    };

    // ---------- Save States ----------

    setFranchise(franchiseRes);

    setTransactions(allTransactions);

    setFilteredTransactions(allTransactions);

    setSummary(summaryData);

    // ---------- Save Cache ----------

    localStorage.setItem(

      `${CACHE_KEY}-${id}`,

      JSON.stringify({

        franchise: franchiseRes,

        transactions: allTransactions,

        summary: summaryData,

        time: Date.now()

      })

    );

  } catch (err) {

    console.error(err);

  } finally {

    setLoading(false);

  }

};

// ==============================
// LOAD PAGE
// ==============================

useEffect(() => {

  if (id) {

    fetchHistory();

  }

}, [id]);


// ==============================
// FILTER DATA
// ==============================

useEffect(() => {

  let filtered = [...transactions];

  // ---------- Search ----------
  if (search) {

    const text = search.toLowerCase();

    filtered = filtered.filter((item) =>

      (franchise?.instituteName || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.paymentMode || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.rechargeBy || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.leadBy || "")
        .toLowerCase()
        .includes(text)

      ||

      (item.remarks || "")
        .toLowerCase()
        .includes(text)

      ||

      String(item.amount)
        .includes(text)

    );

  }

  // ---------- Date Filter ----------

  if (selectedDate) {

    filtered = filtered.filter((item) => {

      if (!item.date) return false;

      return item.date.split("T")[0] === selectedDate;

    });

  }

  setFilteredTransactions(filtered);

}, [search, selectedDate, transactions, franchise]);


// ==============================
// REFRESH DATA
// ==============================

const refreshHistory = () => {

  localStorage.removeItem(`${CACHE_KEY}-${id}`);

  fetchHistory();

};


// ==============================
// LOADING
// ==============================
return (

<div className="min-h-screen bg-gray-100 p-6">

  {/* ===========================
      HEADER
  =========================== */}

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

    <div>

      <h1 className="text-3xl font-bold text-gray-800">

        Wallet Transaction History

      </h1>

      <p className="text-gray-500 mt-1">

        View complete recharge & deduction history

      </p>

    </div>

    <div className="flex flex-wrap gap-3">

      <button
        onClick={() => router.back()}
        className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-xl transition"
      >
        ← Back
      </button>

      <button
        onClick={refreshHistory}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition"
      >
        🔄 Refresh
      </button>

    </div>

  </div>

  {/* ===========================
      FRANCHISE INFO
  =========================== */}

  <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

      <div>

        <p className="text-gray-500 text-sm">

          Institute Name

        </p>

        <h2 className="text-xl font-bold text-gray-800">

          {franchise?.instituteName}

        </h2>

      </div>

      <div>

        <p className="text-gray-500 text-sm">

          Mobile Number

        </p>

        <h2 className="text-lg font-semibold">

          {franchise?.mobile}

        </h2>

      </div>

      <div>

        <p className="text-gray-500 text-sm">

          Email

        </p>

        <h2 className="text-lg font-semibold break-all">

          {franchise?.email}

        </h2>

      </div>

      <div>

        <p className="text-gray-500 text-sm">

          Current Wallet

        </p>

        <h2 className="text-3xl font-bold text-green-600">

          ₹{summary.currentBalance.toFixed(2)}

        </h2>

      </div>

    </div>

  </div>

  {/* ===========================
      SUMMARY CARDS
  =========================== */}

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

    <div className="bg-green-500 text-white rounded-2xl p-6 shadow-lg">

      <p className="text-green-100">

        Total Recharge

      </p>

      <h2 className="text-3xl font-bold mt-2">

        ₹{summary.totalRecharge}

      </h2>

    </div>

    <div className="bg-red-500 text-white rounded-2xl p-6 shadow-lg">

      <p className="text-red-100">

        Total Deduction

      </p>

      <h2 className="text-3xl font-bold mt-2">

        ₹{summary.totalDeduct}

      </h2>

    </div>

    <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg">

      <p className="text-blue-100">

        Current Wallet

      </p>

      <h2 className="text-3xl font-bold mt-2">

        ₹{summary.currentBalance.toFixed(2)}

      </h2>

    </div>

    <div className="bg-purple-600 text-white rounded-2xl p-6 shadow-lg">

      <p className="text-purple-100">

        Total Transactions

      </p>

      <h2 className="text-3xl font-bold mt-2">

        {summary.totalTransactions}

      </h2>

    </div>

  </div>

  {/* ===========================
      FILTER BAR
  =========================== */}

  <div className="bg-white rounded-2xl shadow-md p-5 mb-8">

    <div className="flex flex-col lg:flex-row gap-4">

      <input

        type="text"

        placeholder="Search payment mode, recharge by, remarks..."

        value={search}

        onChange={(e)=>setSearch(e.target.value)}

        className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"

      />

      <input

        type="date"

        value={selectedDate}

        onChange={(e)=>setSelectedDate(e.target.value)}

        className="border rounded-xl px-4 py-3"

      />

      {(search || selectedDate) && (

        <button

          onClick={() => {

            setSearch("");

            setSelectedDate("");

          }}

          className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-xl"

        >

          Clear

        </button>

      )}

    </div>

  </div>
    {/* ===========================
      TRANSACTION TABLE
  =========================== */}

  <div className="bg-white rounded-2xl shadow-md overflow-hidden">

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr className="text-gray-600 uppercase text-xs">

            <th className="p-4 text-left">#</th>

            <th className="p-4 text-left">Date</th>

            <th className="p-4 text-left">Type</th>

            <th className="p-4 text-left">Amount</th>

            <th className="p-4 text-left">Payment Mode</th>

            <th className="p-4 text-left">Recharge By</th>

            <th className="p-4 text-left">Lead By</th>

            <th className="p-4 text-left">Remarks</th>

          </tr>

        </thead>

        <tbody>

          {filteredTransactions.length > 0 ? (

            filteredTransactions.map((item, index) => (

              <tr
                key={item.$id}
                className="border-t hover:bg-gray-50 transition"
              >

                <td className="p-4 font-semibold">

                  {index + 1}

                </td>

                <td className="p-4 whitespace-nowrap">

                  {new Date(item.date).toLocaleString("en-IN")}

                </td>

                <td className="p-4">

                  {item.type === "add" ? (

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">

                      Recharge

                    </span>

                  ) : (

                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">

                      Deduct

                    </span>

                  )}

                </td>

                <td className="p-4 font-bold">

                  {item.type === "add" ? (

                    <span className="text-green-600">

                      + ₹{Number(item.amount).toFixed(2)}

                    </span>

                  ) : (

                    <span className="text-red-600">

                      - ₹{Number(item.amount).toFixed(2)}

                    </span>

                  )}

                </td>

                <td className="p-4">

                  {item.paymentMode || "-"}

                </td>

                <td className="p-4">

                  {item.rechargeBy || "-"}

                </td>

                <td className="p-4">

                  {item.leadBy || "-"}

                </td>

                <td className="p-4 max-w-xs break-words">

                  {item.remarks || "-"}

                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan={8}
                className="text-center py-16 text-gray-400"
              >

                <div className="flex flex-col items-center">

                  <div className="text-6xl mb-4">

                    💳

                  </div>

                  <h2 className="text-xl font-semibold">

                    No Transactions Found

                  </h2>

                  <p className="mt-2">

                    This franchise has no wallet history.

                  </p>

                </div>

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  </div>

</div>

);
}