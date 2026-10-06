import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import {
  Client,
  Databases,
  ID,
  Query,
} from "node-appwrite";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const WALLET_PAYMENTS_COLLECTION =
  "6ac097be0022ffc5ff5fe";

const client = new Client()
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  )
  .setProject(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  )
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      franchiseId,
    } = body;

    // ==========================================
    // 1. BASIC VALIDATION
    // ==========================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !franchiseId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing payment information",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. VERIFY RAZORPAY SIGNATURE
    // ==========================================

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (
      generatedSignature !== razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment signature verification failed",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. FETCH PAYMENT
    // ==========================================

    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    // ==========================================
    // 4. CHECK PAYMENT STATUS
    // ==========================================

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment is not captured. Current status: ${payment.status}`,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 5. CHECK PAYMENT ORDER
    // ==========================================

    if (
      payment.order_id !==
      razorpay_order_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment order mismatch",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 6. FETCH RAZORPAY ORDER
    // ==========================================

    const order =
      await razorpay.orders.fetch(
        razorpay_order_id
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay order not found",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 7. GET AMOUNT BREAKDOWN FROM ORDER NOTES
    // ==========================================

    const rechargeAmount = Number(
      order.notes?.rechargeAmount
    );

    const gstAmount = Number(
      order.notes?.gstAmount
    );

    const totalAmount = Number(
      order.notes?.totalAmount
    );

    if (
      !rechargeAmount ||
      rechargeAmount <= 0 ||
      !gstAmount ||
      gstAmount < 0 ||
      !totalAmount ||
      totalAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payment amount breakdown",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 8. VERIFY ACTUAL PAYMENT AMOUNT
    // ==========================================

    const actualPaidAmount =
      Number(payment.amount) / 100;

    if (
      Math.abs(
        actualPaidAmount - totalAmount
      ) > 0.01
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment amount does not match the expected amount",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 9. VERIFY GST CALCULATION
    // ==========================================

    const calculatedGST = Number(
      (rechargeAmount * 0.18).toFixed(2)
    );

    if (
      Math.abs(
        calculatedGST - gstAmount
      ) > 0.01
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GST amount verification failed",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 10. VERIFY TOTAL CALCULATION
    // ==========================================

    const calculatedTotal = Number(
      (
        rechargeAmount +
        gstAmount
      ).toFixed(2)
    );

    if (
      Math.abs(
        calculatedTotal - totalAmount
      ) > 0.01
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Total payment calculation verification failed",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 11. CHECK DUPLICATE PAYMENT
    // ==========================================

    const existingPayment =
      await databases.listDocuments(
        DATABASE_ID,
        WALLET_PAYMENTS_COLLECTION,
        [
          Query.equal(
            "razorpayPaymentId",
            razorpay_payment_id
          ),
          Query.limit(1),
        ]
      );

    if (
      existingPayment.documents.length > 0
    ) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message:
          "Payment was already processed",
      });
    }

    // ==========================================
    // 12. GET FRANCHISE
    // ==========================================

    const franchise =
      await databases.getDocument(
        DATABASE_ID,
        "franchise_approved",
        franchiseId
      );

    if (!franchise) {
      return NextResponse.json(
        {
          success: false,
          error: "Franchise not found",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 13. CREDIT ONLY RECHARGE AMOUNT
    // ==========================================

    const currentWallet =
      Number(franchise.wallet || 0);

    // IMPORTANT:
    // Only ₹2,000 goes into wallet.
    // GST is NOT added to wallet.

    const newBalance =
      currentWallet + rechargeAmount;

    // ==========================================
    // 14. UPDATE FRANCHISE WALLET
    // ==========================================

    await databases.updateDocument(
      DATABASE_ID,
      "franchise_approved",
      franchiseId,
      {
        wallet: newBalance.toFixed(2),
        lastRecharge:
          new Date().toLocaleString(),
      }
    );

    // ==========================================
    // 15. CREATE WALLET TRANSACTION
    // ==========================================

    await databases.createDocument(
      DATABASE_ID,
      "wallet_transactions",
      ID.unique(),
      {
        franchiseId,

        // ONLY wallet amount
        amount: rechargeAmount,

        type: "add",

        paymentMode: "Razorpay",

        rechargeBy: "Online Payment",

        leadBy: "",

        remarks:
          `Razorpay Payment: ${razorpay_payment_id} | ` +
          `Recharge: ₹${rechargeAmount} | ` +
          `GST: ₹${gstAmount} | ` +
          `Total Paid: ₹${totalAmount}`,

        date:
          new Date().toISOString(),
      }
    );

    // ==========================================
    // 16. CREATE PAYMENT RECORD
    // ==========================================

    await databases.createDocument(
      DATABASE_ID,
      WALLET_PAYMENTS_COLLECTION,
      ID.unique(),
      {
        franchiseId,

        // Wallet amount
        rechargeAmount,

        // GST amount
        gstAmount,

        // Total customer payment
        totalAmount,

        // Keep amount for compatibility
        amount: rechargeAmount,

        razorpayOrderId:
          razorpay_order_id,

        razorpayPaymentId:
          razorpay_payment_id,

        status: "paid",

        paymentMode:
          "UPI / Razorpay",

        createdAt:
          new Date().toISOString(),

        verifiedAt:
          new Date().toISOString(),

        failureReason: "",
      }
    );

    // ==========================================
    // 17. SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "Payment verified and wallet credited",

      rechargeAmount,

      gstAmount,

      totalAmount,

      newBalance,

      paymentId:
        razorpay_payment_id,
    });

  } catch (error) {
    console.error(
      "RAZORPAY VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.error?.description ||
          error?.message ||
          "Payment verification failed",
      },
      { status: 500 }
    );
  }
}