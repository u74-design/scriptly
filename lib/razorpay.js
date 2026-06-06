import Razorpay from "razorpay";

let razorpayInstance;

function getRazorpayCredentials() {
  const key_id =
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  return { key_id, key_secret };
}

export function getRazorpay() {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const { key_id, key_secret } = getRazorpayCredentials();

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_SECRET and RAZORPAY_KEY_ID (or NEXT_PUBLIC_RAZORPAY_KEY_ID)."
    );
  }

  razorpayInstance = new Razorpay({ key_id, key_secret });
  return razorpayInstance;
}
