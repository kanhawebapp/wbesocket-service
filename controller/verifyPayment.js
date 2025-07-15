import axios from "axios";
import crypto from "crypto";

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_SECRET;

    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");
      const paymentRes = await axios.get(
        `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paymentData = paymentRes.data;

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentstatus: paymentData.status,
        paymentmethod: paymentData.method ?? "",
        paymentamount: paymentData.amount / 100,
        payment_id: razorpay_payment_id ?? "",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid signature, payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export { verifyPayment };
