import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const body = await request.json();

    const { amount, franchiseId } = body;

    // ==========================================
    // 1. VALIDATION
    // ==========================================

    if (!franchiseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Franchise ID is required",
        },
        { status: 400 }
      );
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recharge amount",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. RECHARGE + GST CALCULATION
    // ==========================================

    const rechargeAmount = Number(amount);

    // 18% GST
    const gstAmount = Number(
      (rechargeAmount * 0.18).toFixed(2)
    );

    // Final amount customer has to pay
    const totalAmount = Number(
      (rechargeAmount + gstAmount).toFixed(2)
    );

    // Convert final amount to paise
    const amountInPaise = Math.round(totalAmount * 100);

    // ==========================================
    // 3. CREATE RAZORPAY ORDER
    // ==========================================

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `BNMI_${Date.now()}`,

      notes: {
        franchiseId: franchiseId,
        purpose: "Franchise Wallet Recharge",

        rechargeAmount: rechargeAmount.toString(),
        gstAmount: gstAmount.toString(),
        totalAmount: totalAmount.toString(),
      },
    });

    // ==========================================
    // 4. RESPONSE
    // ==========================================

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