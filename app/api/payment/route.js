import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const order = await razorpay.orders.create({
      amount: 19900, // ₹199
      currency: "INR",
      receipt: `scriptly_${Date.now()}`,
      notes: {
        userId,
        plan: "pro",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Payment failed" },
      { status: 500 }
    );
  }
}