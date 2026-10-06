import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request) {
  try {
    // ============================================
    // CHECK RAZORPAY ENVIRONMENT VARIABLES
    // ============================================

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("RAZORPAY ENVIRONMENT VARIABLES ARE MISSING");

      return NextResponse.json(
        {
          success: false,
          error: "Razorpay configuration is missing",
        },
        { status: 500 }
      );
    }

    // ============================================
    // CREATE RAZORPAY INSTANCE
    // ============================================

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // ============================================
    // READ REQUEST
    // ============================================

    const body = await request.json();

    const { amount, franchiseId } = body;

    // ============================================
    // VALIDATE FRANCHISE
    // ============================================

    if (!franchiseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Franchise ID is required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE AMOUNT
    // ============================================

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recharge amount",
        },
        { status: 400 }
      );
    }

    // ============================================
    // RECHARGE AMOUNT
    // ============================================

    const rechargeAmount = Number(amount);

    // ============================================
    // GST 18%
    // ============================================

    const gstAmount = Number(
      (rechargeAmount * 0.18).toFixed(2)
    );

    // ============================================
    // TOTAL CUSTOMER PAYMENT
    // ============================================

    const totalAmount = Number(
      (rechargeAmount + gstAmount).toFixed(2)
    );

    // ============================================
    // CONVERT TO PAISE
    // ============================================

    const amountInPaise = Math.round(
      totalAmount * 100
    );

    // ============================================
    // CREATE RAZORPAY ORDER
    // ============================================

    const order = await razorpay.orders.create({
      amount: amountInPaise,

      currency: "INR",

      receipt: `BNMI_${Date.now()}`,

      notes: {
        franchiseId: franchiseId,

        purpose: "Franchise Wallet Recharge",

        rechargeAmount:
          rechargeAmount.toString(),

        gstAmount:
          gstAmount.toString(),

        totalAmount:
          totalAmount.toString(),
      },
    });

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,

      rechargeAmount,

      gstAmount,

      totalAmount,

      order: {
        id: order.id,

        amount: order.amount,

        currency: order.currency,
      },
    });

  } catch (error) {
    console.error(
      "RAZORPAY CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.error?.description ||
          error?.message ||
          "Order creation failed",
      },
      { status: 500 }
    );
  }
}