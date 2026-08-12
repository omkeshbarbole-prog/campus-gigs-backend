const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin securely via Environment Variables
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback for local testing if needed
    serviceAccount = require('./serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error.message);
}

// 1. Notify New Gig (Broadcast to active_runners)
app.post('/notify-new-gig', async (req, res) => {
  const { gigId, title, price } = req.body;

  if (!gigId || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    notification: {
      title: "New Gig Alert! \uD83D\uDE80",
      body: `New gig nearby: ${title} - Earn $${price}!`,
    },
    data: {
      type: "gig_alert",
      routeId: gigId,
    },
  };

  try {
    const response = await admin.messaging().sendToTopic("active_runners", payload);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending new gig notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Notify Hired
app.post('/notify-hired', async (req, res) => {
  const { fcmToken, gigId, title } = req.body;

  if (!fcmToken || !gigId || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    notification: {
      title: "You're Hired! \uD83C\uDF89",
      body: `You were hired for: ${title}!`,
    },
    data: {
      type: "hired",
      routeId: gigId,
    },
  };

  try {
    const response = await admin.messaging().sendToDevice(fcmToken, payload);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending hired notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Notify Chat Message
app.post('/notify-chat', async (req, res) => {
  const { fcmToken, chatId, senderName, text } = req.body;

  if (!fcmToken || !chatId || !senderName || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    notification: {
      title: `New message from ${senderName}`,
      body: text,
    },
    data: {
      type: "chat",
      routeId: chatId,
    },
  };

  try {
    const response = await admin.messaging().sendToDevice(fcmToken, payload);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending chat notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).send("Omnyx Gigs Notification API is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
