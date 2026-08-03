const Razorpay = require('razorpay');

// Initialize Razorpay using your secure Vercel environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = async (req, res) => {
  // Only allow POST requests from your Android app
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get the requested amount from the Android app
    const { amount } = req.body;

    // 2. Build the order options (multiplying by 100 to convert to Paisa)
    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    // 3. Connect to Razorpay and create the real order
    const order = await razorpay.orders.create(options);

    // 4. Send the real order ID back to your Android app
    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, error: "Failed to create order" });
  }
};
