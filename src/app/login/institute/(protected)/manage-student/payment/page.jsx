"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { account, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { motion } from "framer-motion";
import {
  FaCreditCard,
  FaWallet,
  FaCheckCircle,
  FaRupeeSign,
  FaArrowLeft,
  FaShieldAlt,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

export default function PaymentPage() {
  const router = useRouter();

  const [franchise, setFranchise] = useState(null);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState(0);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");

  // ==========================================
  // GST CALCULATION
  // ==========================================

  const rechargeAmount = Number(amount) || 0;

  const gstAmount = Number(
    (rechargeAmount * 0.18).toFixed(2)
  );

  const totalAmount = Number(
    (rechargeAmount + gstAmount).toFixed(2)
  );

  // ==========================================
  // LOAD FRANCHISE
  // ==========================================

  useEffect(() => {
    fetchFranchise();
  }, []);

  const fetchFranchise = async () => {
    try {
      setLoading(true);

      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", user.email)]
      );

      if (!res.documents.length) {
        alert("Franchise account not found.");
        router.back();
        return;
      }

      const franchiseData = res.documents[0];

      setFranchise(franchiseData);
      setWallet(Number(franchiseData.wallet || 0));
    } catch (error) {
      console.error("FRANCHISE FETCH ERROR:", error);

      alert("Unable to load franchise information.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // START PAYMENT
  // ==========================================

  const handlePayment = async () => {
    if (processing) return;

    const rechargeAmount = Number(amount);

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!amount || isNaN(rechargeAmount)) {
      alert("Please enter a valid amount.");
      return;
    }

    if (rechargeAmount < 1) {
      alert("Minimum recharge amount is ₹1.");
      return;
    }

    if (!franchise?.$id) {
      alert("Franchise information not found.");
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      alert(
        "Razorpay Key ID is missing. Please check NEXT_PUBLIC_RAZORPAY_KEY_ID."
      );
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.Razorpay
    ) {
      alert("Razorpay is still loading. Please try again.");
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus("Creating secure payment...");

      // ==========================================
      // CREATE RAZORPAY ORDER
      // ==========================================

      const orderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            // This is the wallet amount.
            // Server will calculate 18% GST.
            amount: rechargeAmount,

            franchiseId: franchise.$id,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData.success
      ) {
        throw new Error(
          orderData.error ||
            "Unable to create Razorpay order."
        );
      }

      const order = orderData.order;

      // Values calculated by SERVER
      const serverRechargeAmount =
        Number(orderData.rechargeAmount);

      const serverGstAmount =
        Number(orderData.gstAmount);

      const serverTotalAmount =
        Number(orderData.totalAmount);

      setPaymentStatus("Opening Razorpay...");

      // ==========================================
      // RAZORPAY CHECKOUT
      // ==========================================

      const options = {
        key: RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency || "INR",

        name: "BNMI",

        description: `Wallet Recharge ₹${serverRechargeAmount.toLocaleString(
          "en-IN"
        )} + GST`,

        order_id: order.id,

        image: "/logo.png",

        prefill: {
          name:
            franchise.instituteName ||
            franchise.name ||
            "BNMI Franchise",

          email: franchise.email || "",

          contact: franchise.mobile || "",
        },

        notes: {
          franchiseId: franchise.$id,

          purpose: "Franchise Wallet Recharge",

          rechargeAmount:
            serverRechargeAmount.toString(),

          gstAmount:
            serverGstAmount.toString(),

          totalAmount:
            serverTotalAmount.toString(),
        },

        theme: {
          color: "#2563eb",
        },

        // ==========================================
        // PAYMENT SUCCESS
        // ==========================================

        handler: async function (response) {
          try {
            setPaymentStatus(
              "Verifying payment..."
            );

            console.log(
              "RAZORPAY RESPONSE:",
              response
            );

            const verifyResponse =
              await fetch(
                "/api/razorpay/verify-payment",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    franchiseId:
                      franchise.$id,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            console.log(
              "VERIFY RESPONSE:",
              verifyData
            );

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.error ||
                  "Payment verification failed."
              );
            }

            // ==========================================
            // SUCCESS
            // ==========================================

            setPaymentStatus(
              "Payment successful!"
            );

            setWallet(
              Number(
                verifyData.newBalance || 0
              )
            );

            setAmount("");

            alert(
              `Payment successful!\n\n₹${serverRechargeAmount.toFixed(
                2
              )} has been added to your wallet.\n\nGST: ₹${serverGstAmount.toFixed(
                2
              )}\nTotal Paid: ₹${serverTotalAmount.toFixed(
                2
              )}`
            );

            // Reload franchise information
            await fetchFranchise();
          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            setPaymentStatus("");

            alert(
              `Payment was received, but verification could not be completed automatically.\n\nPayment ID: ${response.razorpay_payment_id}\n\nPlease contact BNMI support with this Payment ID.`
            );
          } finally {
            setProcessing(false);
          }
        },

        // ==========================================
        // MODAL CLOSED
        // ==========================================

        modal: {
          ondismiss: function () {
            setProcessing(false);
            setPaymentStatus("");
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      // ==========================================
      // PAYMENT FAILED
      // ==========================================

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setProcessing(false);
          setPaymentStatus("");

          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      setProcessing(false);
      setPaymentStatus("");

      alert(
        error.message ||
          "Unable to start payment."
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600 font-medium">
            Loading payment page...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6">

        {/* ==========================================
            BACK BUTTON
        ========================================== */}

        <div className="max-w-5xl mx-auto mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
          >
            <FaArrowLeft />

            <span>Back</span>
          </button>
        </div>

        {/* ==========================================
            MAIN
        ========================================== */}

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ==========================================
              LEFT - PAYMENT
          ========================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
          >

            {/* Header */}

            <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-7 text-white">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <FaWallet className="text-2xl" />
                </div>

                <div>

                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Recharge Wallet
                  </h1>

                  <p className="text-blue-100 mt-1">
                    Add money securely to your franchise wallet
                  </p>

                </div>

              </div>

            </div>

            {/* Content */}

            <div className="p-6 sm:p-8">

              {/* ==========================================
                  FRANCHISE
              ========================================== */}

              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border">

                <p className="text-sm text-gray-500">
                  Franchise
                </p>

                <h2 className="font-semibold text-lg mt-1">
                  {franchise?.instituteName ||
                    franchise?.name ||
                    "BNMI Franchise"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {franchise?.email}
                </p>

              </div>

              {/* ==========================================
                  CURRENT WALLET
              ========================================== */}

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">

                <p className="text-sm text-green-700">
                  Current Wallet Balance
                </p>

                <div className="flex items-center gap-2 mt-1">

                  <FaRupeeSign className="text-green-600" />

                  <h2 className="text-3xl font-bold text-green-600">
                    {wallet.toFixed(2)}
                  </h2>

                </div>

              </div>

              {/* ==========================================
                  AMOUNT
              ========================================== */}

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Recharge Amount
              </label>

              <div className="relative mb-4">

                <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  disabled={processing}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePayment();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-2xl pl-11 pr-4 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />

              </div>

              {/* ==========================================
                  QUICK AMOUNTS
              ========================================== */}

              <div className="flex flex-wrap gap-2 mb-6">

                {[500, 1000, 2000, 5000, 10000].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={processing}
                      onClick={() =>
                        setAmount(
                          value.toString()
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 transition disabled:opacity-50"
                    >
                      ₹
                      {value.toLocaleString(
                        "en-IN"
                      )}
                    </button>
                  )
                )}

              </div>

              {/* ==========================================
                  PAYMENT BREAKDOWN
              ========================================== */}

              {rechargeAmount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">

                  <h3 className="font-semibold text-gray-800 mb-4">
                    Payment Summary
                  </h3>

                  <div className="space-y-3 text-sm">

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Wallet Recharge
                      </span>

                      <span className="font-medium">
                        ₹
                        {rechargeAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        GST (18%)
                      </span>

                      <span className="font-medium">
                        ₹
                        {gstAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>

                    <div className="border-t border-blue-200 pt-3 flex justify-between">

                      <span className="font-bold text-gray-800">
                        Total Payable
                      </span>

                      <span className="font-bold text-blue-700 text-lg">
                        ₹
                        {totalAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="mt-4 bg-white rounded-xl p-3 text-xs text-gray-500">
                    ₹
                    {rechargeAmount.toLocaleString(
                      "en-IN"
                    )}{" "}
                    will be added to your wallet after successful payment.
                  </div>

                </div>
              )}

              {/* ==========================================
                  PAYMENT STATUS
              ========================================== */}

              {paymentStatus && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl p-4 mb-5 flex items-center gap-3">

                  {processing && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}

                  <span className="text-sm font-medium">
                    {paymentStatus}
                  </span>

                </div>
              )}

              {/* ==========================================
                  PAY BUTTON
              ========================================== */}

              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  processing ||
                  !amount
                }
                className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                  processing || !amount
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] shadow-blue-600/20"
                }`}
              >

                {processing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />

                    Processing...
                  </>
                ) : (
                  <>
                    <FaCreditCard />

                    Pay ₹
                    {totalAmount > 0
                      ? totalAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )
                      : "0.00"}
                  </>
                )}

              </button>

              {/* ==========================================
                  SECURITY
              ========================================== */}

              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-5">

                <FaShieldAlt />

                <span>
                  Secure payment powered by Razorpay
                </span>

              </div>

            </div>

          </motion.div>

          {/* ==========================================
              RIGHT - INFORMATION
          ========================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.1,
            }}
            className="space-y-6"
          >

            {/* ==========================================
                PAYMENT METHODS
            ========================================== */}

            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">

              <h2 className="text-xl font-bold mb-5">
                Payment Methods
              </h2>

              <div className="space-y-4">

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">

                  <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    UPI
                  </div>

                  <div>

                    <h3 className="font-semibold">
                      UPI
                    </h3>

                    <p className="text-sm text-gray-500">
                      Google Pay, PhonePe, Paytm & other UPI apps
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">

                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <FaCreditCard />
                  </div>

                  <div>

                    <h3 className="font-semibold">
                      Cards
                    </h3>

                    <p className="text-sm text-gray-500">
                      Credit and debit cards
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 border border-green-100">

                  <div className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center">
                    ₹
                  </div>

                  <div>

                    <h3 className="font-semibold">
                      Net Banking
                    </h3>

                    <p className="text-sm text-gray-500">
                      Supported banks through Razorpay
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ==========================================
                HOW IT WORKS
            ========================================== */}

            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">

              <h2 className="text-xl font-bold mb-5">
                How It Works
              </h2>

              <div className="space-y-5">

                <Step
                  number="1"
                  title="Enter Amount"
                  description="Enter the amount you want to add to your wallet."
                />

                <Step
                  number="2"
                  title="Review GST"
                  description="18% GST is added to your wallet recharge amount."
                />

                <Step
                  number="3"
                  title="Complete Payment"
                  description="Choose UPI, card or another available Razorpay payment method."
                />

                <Step
                  number="4"
                  title="Automatic Verification"
                  description="BNMI verifies the Razorpay payment automatically."
                />

                <Step
                  number="5"
                  title="Wallet Updated"
                  description="After successful verification, only your recharge amount is added to your wallet."
                />

              </div>

            </div>

            {/* ==========================================
                IMPORTANT NOTE
            ========================================== */}

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

              <div className="flex gap-3">

                <FaCheckCircle className="text-yellow-600 mt-1 shrink-0" />

                <div>

                  <h3 className="font-semibold text-yellow-800">
                    Important
                  </h3>

                  <p className="text-sm text-yellow-700 mt-1">
                    Do not close the payment window while your payment is being processed. Your wallet is credited only after the payment is verified.
                  </p>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </div>
    </>
  );
}

// ==========================================
// STEP COMPONENT
// ==========================================

function Step({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">

      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
        {number}
      </div>

      <div>

        <h3 className="font-semibold text-gray-800">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>

      </div>

    </div>
  );
}