"use client";

import { useEffect, useMemo, useState } from "react";

const GST_RATE = 0.18;
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function MobilePaymentPage() {
  const [franchiseId, setFranchiseId] = useState("");
  const [amount, setAmount] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFranchiseId(params.get("franchiseId") || "");

    let script = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => setScriptReady(true);
    const handleError = () => {
      setScriptReady(false);
      setStatus({
        type: "error",
        message:
          "Unable to load the payment service. Please refresh and try again.",
      });
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, []);

  const rechargeAmount = Number(amount);
  const validAmount =
    amount.trim() !== "" &&
    Number.isFinite(rechargeAmount) &&
    rechargeAmount >= 1 &&
    rechargeAmount <= 1000000 &&
    Number.isInteger(rechargeAmount);

  const gstAmount = useMemo(
    () =>
      validAmount
        ? Math.round(rechargeAmount * GST_RATE * 100) / 100
        : 0,
    [rechargeAmount, validAmount]
  );

  const totalAmount = useMemo(
    () =>
      validAmount
        ? Math.round((rechargeAmount + gstAmount) * 100) / 100
        : 0,
    [rechargeAmount, gstAmount, validAmount]
  );

  function selectAmount(value) {
    setAmount(String(value));
    setStatus(null);
  }

  async function loadRazorpay() {
    if (window.Razorpay) return true;

    return new Promise((resolve) => {
      const existingScript = document.querySelector(
        `script[src="${RAZORPAY_SCRIPT}"]`
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
        return;
      }

      existingScript.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      // Handle a script that is already loaded.
      if (window.Razorpay) resolve(true);
    });
  }

  async function handlePayment() {
    setStatus(null);

    if (!franchiseId) {
      setStatus({
        type: "error",
        message:
          "Franchise information is missing. Please open this page from your BNMI franchise app.",
      });
      return;
    }

    if (!validAmount) {
      setStatus({
        type: "error",
        message:
          "Enter a valid whole-number recharge amount between ₹1 and ₹10,00,000.",
      });
      return;
    }

    setLoading(true);

    try {
      const loaded = await loadRazorpay();

      if (!loaded || !window.Razorpay) {
        throw new Error(
          "Razorpay could not be loaded. Check your internet connection and try again."
        );
      }

      // The server must calculate GST and the payable amount.
      const orderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: rechargeAmount,
            franchiseId,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.error ||
            orderData.message ||
            "Unable to create a payment order."
        );
      }

      const orderId =
        orderData.orderId || orderData.id || orderData.order?.id;

      const checkoutAmount =
        orderData.amount ?? orderData.order?.amount;

      const checkoutKey =
        orderData.keyId ||
        orderData.key ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!orderId || !checkoutAmount || !checkoutKey) {
        throw new Error(
          "The payment order response is incomplete. Check your create-order API response and Razorpay public key."
        );
      }

      const options = {
        key: checkoutKey,
        amount: checkoutAmount,
        currency:
          orderData.currency ||
          orderData.order?.currency ||
          "INR",
        name: "BNMI India",
        description: `Wallet recharge - ${formatINR(rechargeAmount)}`,
        order_id: orderId,
        theme: {
          color: "#F59E0B",
        },

        handler: async function (response) {
          try {
            setStatus({
              type: "info",
              message:
                "Payment received. Verifying your transaction...",
            });

            const verifyResponse = await fetch(
              "/api/razorpay/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,
                  razorpay_payment_id:
                    response.razorpay_payment_id,
                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || verifyData.success === false) {
              throw new Error(
                verifyData.error ||
                  verifyData.message ||
                  "Payment verification is pending or unsuccessful."
              );
            }

            setStatus({
              type: "success",
              message:
                "Payment verified successfully! Your wallet recharge request has been processed.",
              paymentId: response.razorpay_payment_id,
            });
          } catch (error) {
            // The payment may have succeeded even if browser verification
            // failed. The server webhook should process the paid order.
            setStatus({
              type: "info",
              message:
                "Your payment was submitted, but the browser could not confirm the wallet update. Please check your wallet before retrying. If it is not updated, contact BNMI support with your payment ID.",
              paymentId: response.razorpay_payment_id,
            });
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatus({
              type: "info",
              message:
                "The payment window was closed. If you completed a payment, check your wallet before trying again.",
            });
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setLoading(false);
        setStatus({
          type: "error",
          message:
            response.error?.description ||
            "Payment failed. Please try again.",
        });
      });

      checkout.open();
    } catch (error) {
      setLoading(false);
      setStatus({
        type: "error",
        message:
          error.message ||
          "Something went wrong while starting your payment.",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#080D19] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-amber-400"
              aria-hidden="true"
            >
              <path
                d="M12 2.75v18.5M17 6.5H9.5a3.25 3.25 0 1 0 0 6.5h5a3.25 3.25 0 1 1 0 6.5H6.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            BNMI India
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Wallet Recharge
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Add funds to your franchise wallet securely using
            Razorpay.
          </p>
        </header>

        {/* Main Card */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Recharge amount
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Select an amount or enter your own.
                </p>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">
                GST 18%
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Amount Input */}
            <div>
              <label
                htmlFor="rechargeAmount"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Enter recharge amount (₹)
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-[#0B1220] px-4 transition focus-within:border-amber-400/60">
                <span className="mr-3 text-xl font-semibold text-amber-400">
                  ₹
                </span>

                <input
                  id="rechargeAmount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1000000"
                  step="1"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setStatus(null);
                  }}
                  placeholder="Enter amount"
                  className="w-full bg-transparent py-4 text-xl font-semibold text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Minimum ₹1. Maximum ₹10,00,000 per recharge.
              </p>
            </div>

            {/* Quick Amounts */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">
                Quick select
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((value) => {
                  const selected = amount === String(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectAmount(value)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition duration-200 ${
                        selected
                          ? "border-amber-400 bg-amber-400 text-[#10131A]"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-400/50 hover:bg-amber-400/5"
                      }`}
                    >
                      ₹{value.toLocaleString("en-IN")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">
                Payment summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">
                    Wallet recharge
                  </span>
                  <span className="font-medium text-white">
                    {formatINR(validAmount ? rechargeAmount : 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">
                    GST (18%)
                  </span>
                  <span className="font-medium text-white">
                    {formatINR(gstAmount)}
                  </span>
                </div>

                <div className="border-t border-dashed border-white/15 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-white">
                      Total payable
                    </span>
                    <span className="text-2xl font-bold text-amber-400">
                      {formatINR(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Only the recharge amount is intended to be credited
                to your wallet. GST is included in the payment total.
                The server determines the final amount.
              </p>
            </div>

            {/* Status Message */}
            {status && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border p-4 text-sm leading-6 ${
                  status.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : status.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                }`}
              >
                <p>{status.message}</p>

                {status.paymentId && (
                  <p className="mt-2 break-all text-xs opacity-80">
                    Payment ID: {status.paymentId}
                  </p>
                )}

                {status.type === "success" && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "https://www.bnmiindia.org";
                    }}
                    className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-[#07140E]"
                  >
                    Return to BNMI
                  </button>
                )}
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading || !validAmount || !franchiseId}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 px-5 py-4 font-bold text-[#11131A] shadow-lg shadow-amber-500/10 transition duration-200 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#11131A]/30 border-t-[#11131A]" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>

            {!franchiseId && (
              <p className="text-center text-xs text-amber-300">
                Open this page from your BNMI franchise app so
                your franchise can be identified.
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-emerald-400"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Secure checkout powered by Razorpay
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs leading-6 text-slate-500">
          <p>BNMI India · Franchise Wallet</p>
          <p>
            If payment succeeds but your wallet is not updated,
            contact BNMI support with your payment ID.
          </p>
        </footer>
      </div>
    </main>
  );
}
