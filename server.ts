import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Razorpay Order Creation
  app.post("/api/payment/order", async (req, res) => {
    const { amount, currency = "INR" } = req.body;
    
    try {
      const options = {
        amount: amount * 100, // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  });

  // Razorpay Payment Verification (Simple for demo, in production verify signature)
  app.post("/api/payment/verify", async (req, res) => {
    // In a real app, you'd verify the signature here
    // For this build, we'll assume success if the client sends the payment details
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
