// services/payment/razorpay.service.js

import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async ({
  amount,
  receipt,
  notes = {},
}) => {
  return razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    receipt,
    notes,
  });
};

export const verifyRazorpayPayment = ({
  orderId,
  paymentId,
  signature,
}) => {
  const generatedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};