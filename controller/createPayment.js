// controllers/razorpayController.js
require('dotenv').config();
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Math.floor(Math.random() * 10000)}`,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};
