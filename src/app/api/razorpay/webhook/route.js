import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { Client, Databases, ID, Query } from "node-appwrite";

// =====================================================
// CONFIG
// =====================================================

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const FRANCHISE_COLLECTION = "franchise_approved";
const WALLET_TRANSACTIONS_COLLECTION = "wallet_transactions";

// Your actual wallet_payments collection ID
const WALLET_PAYMENTS_COLLECTION = "6ac097be0022ffc5ff5e";

// Razorpay webhook secret
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// =====================================================
// APPWRITE
// =====================================================

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// =====================================================
// RAZORPAY
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// WEBHOOK
// =====================================================

export async function POST(request) {
  try {
    // -------------------------------------------------
    // 1. Read RAW body
    // IMPORTANT:
    // Do NOT use request.json() before signature validation.
    // -------------------------------------------------

    const rawBody = await request.text();

    // -------------------------------------------------
    // 2. Get Razorpay signature
    // -------------------------------------------------

    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("WEBHOOK ERROR: Missing Razorpay signature");

      return NextResponse.json(
        {
          success: false,
          error: "Missing webhook signature",
        },
        { status: 400 }
      );
    }

    if (!WEBHOOK_SECRET) {
      console.error(
        "WEBHOOK ERROR: RAZORPAY_WEBHOOK_SECRET is not configured"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Webhook secret is not configured",
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------
    // 3. Verify Razorpay webhook signature
    // -------------------------------------------------

    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );

    if (!signaturesMatch) {
      console.error("WEBHOOK ERROR: Invalid signature");

      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 4. Parse webhook payload
    // -------------------------------------------------

    const payload = JSON.parse(rawBody);

    const event = payload?.event;

    console.log("RAZORPAY WEBHOOK EVENT:", event);

    // -------------------------------------------------
    // 5. Only process order.paid
    // -------------------------------------------------

    if (event !== "order.paid") {
      console.log(
        `Ignoring Razorpay event: ${event}`
      );

      return NextResponse.json({
        success: true,
        message: "Event ignored",
      });
    }

    // -------------------------------------------------
    // 6. Get order + payment information
    // -------------------------------------------------

    const paymentEntity =
      payload?.payload?.payment?.entity;

    const orderEntity =
      payload?.payload?.order?.entity;

    if (!paymentEntity || !orderEntity) {
      console.error(
        "WEBHOOK ERROR: Missing payment/order entity"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook payload",
        },
        { status: 400 }
      );
    }

    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;

    // -------------------------------------------------
    // 7. Make sure payment belongs to this order
    // -------------------------------------------------

    if (!orderId || orderId !== orderEntity.id) {
      console.error(
        "WEBHOOK ERROR: Payment/order mismatch"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Payment and order mismatch",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 8. Payment must be captured
    // -------------------------------------------------

    if (paymentEntity.status !== "captured") {
      console.log(
        `Ignoring payment ${paymentId} because status is ${paymentEntity.status}`
      );

      return NextResponse.json({
        success: true,
        message: "Payment is not captured",
      });
    }

    // -------------------------------------------------
    // 9. Get franchiseId from Razorpay order notes
    // -------------------------------------------------

    const notes = orderEntity.notes || {};

    const franchiseId = notes.franchiseId;

    if (!franchiseId) {
      console.error(
        "WEBHOOK ERROR: franchiseId missing from order notes"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Franchise ID missing from order",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 10. Get GST/recharge values from order notes
    // -------------------------------------------------

    const rechargeAmount = Number(
      notes.rechargeAmount
    );

    const gstAmount = Number(
      notes.gstAmount
    );

    const totalAmount = Number(
      notes.totalAmount
    );

    if (
      !Number.isFinite(rechargeAmount) ||
      !Number.isFinite(gstAmount) ||
      !Number.isFinite(totalAmount)
    ) {
      console.error(
        "WEBHOOK ERROR: Invalid amount information"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment amount information",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 11. Verify GST calculation
    // -------------------------------------------------

    const expectedGST = Number(
      (rechargeAmount * 0.18).toFixed(2)
    );

    const expectedTotal = Number(
      (rechargeAmount + expectedGST).toFixed(2)
    );

    if (
      Math.abs(gstAmount - expectedGST) > 0.01 ||
      Math.abs(totalAmount - expectedTotal) > 0.01
    ) {
      console.error(
        "WEBHOOK ERROR: GST/total calculation mismatch"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Invalid GST or total amount",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 12. Verify actual Razorpay payment amount
    // -------------------------------------------------

    const paidAmount = Number(paymentEntity.amount);

    const expectedPaidAmount = Math.round(
      totalAmount * 100
    );

    if (paidAmount !== expectedPaidAmount) {
      console.error(
        "WEBHOOK ERROR: Paid amount mismatch",
        {
          paidAmount,
          expectedPaidAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Payment amount mismatch",
        },
        { status: 400 }
      );
    }

    // =================================================
    // 13. CHECK IF PAYMENT WAS ALREADY PROCESSED
    // =================================================

    try {
      const existingPayment =
        await databases.listDocuments(
          DATABASE_ID,
          WALLET_PAYMENTS_COLLECTION,
          [
            Query.equal(
              "razorpayPaymentId",
              paymentId
            ),
          ]
        );

      if (existingPayment.documents.length > 0) {
        console.log(
          `Payment ${paymentId} already processed`
        );

        return NextResponse.json({
          success: true,
          message: "Payment already processed",
          paymentId,
        });
      }
    } catch (error) {
      console.error(
        "Duplicate payment check failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify payment status",
        },
        { status: 500 }
      );
    }

    // =================================================
    // 14. GET FRANCHISE
    // =================================================

    let franchise;

    try {
      franchise = await databases.getDocument(
        DATABASE_ID,
        FRANCHISE_COLLECTION,
        franchiseId
      );
    } catch (error) {
      console.error(
        "Franchise not found:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Franchise not found",
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // 15. Calculate new wallet balance
    // -------------------------------------------------

    const currentWallet = Number(
      franchise.wallet || 0
    );

    const newWalletBalance = Number(
      (currentWallet + rechargeAmount).toFixed(2)
    );

    // =================================================
    // 16. UPDATE FRANCHISE WALLET
    // =================================================

    await databases.updateDocument(
      DATABASE_ID,
      FRANCHISE_COLLECTION,
      franchiseId,
      {
        wallet: newWalletBalance,
        lastRecharge: new Date().toLocaleDateString(
          "en-GB"
        ),
      }
    );

    console.log(
      `Wallet credited ₹${rechargeAmount} to franchise ${franchiseId}`
    );

    // =================================================
    // 17. CREATE WALLET TRANSACTION
    // =================================================

    await databases.createDocument(
      DATABASE_ID,
      WALLET_TRANSACTIONS_COLLECTION,
      ID.unique(),
      {
        franchiseId: franchiseId,

        amount: rechargeAmount,

        type: "add",

        paymentMode: "UPI / Razorpay",

        rechargeBy: "Online Payment",

        leadBy: "Razorpay",

        remarks:
          `Razorpay Webhook | Payment ID: ${paymentId} | ` +
          `Recharge: ₹${rechargeAmount} | ` +
          `GST: ₹${gstAmount} | ` +
          `Total Paid: ₹${totalAmount}`,

        date: new Date().toISOString(),
      }
    );

    // =================================================
    // 18. CREATE WALLET PAYMENT RECORD
    // =================================================

    await databases.createDocument(
      DATABASE_ID,
      WALLET_PAYMENTS_COLLECTION,
      ID.unique(),
      {
        franchiseId: franchiseId,

        rechargeAmount: rechargeAmount,

        gstAmount: gstAmount,

        totalAmount: totalAmount,

        amount: rechargeAmount,

        razorpayOrderId: orderId,

        razorpayPaymentId: paymentId,

        status: "paid",

        paymentMode: "UPI / Razorpay",

        createdAt: new Date().toISOString(),

        verifiedAt: new Date().toISOString(),

        failureReason: "",
      }
    );

    // =================================================
    // 19. SUCCESS
    // =================================================

    console.log(
      "RAZORPAY WEBHOOK PAYMENT PROCESSED:",
      {
        paymentId,
        orderId,
        franchiseId,
        rechargeAmount,
        gstAmount,
        totalAmount,
        newWalletBalance,
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Razorpay payment processed successfully",

      paymentId,

      orderId,

      franchiseId,

      rechargeAmount,

      gstAmount,

      totalAmount,

      newBalance: newWalletBalance,
    });
  } catch (error) {
    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}