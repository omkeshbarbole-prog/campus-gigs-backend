const admin = require('firebase-admin');

// Ensure Firebase is initialized only once
if (!admin.apps.length) {
    try {
        // We parse the service account JSON from an Environment Variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
}

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { recipientToken, title, body, data } = req.body;

        if (!recipientToken || !title || !body) {
            return res.status(400).json({ error: 'Missing required parameters: recipientToken, title, or body.' });
        }

        const message = {
            token: recipientToken,
            notification: {
                title: title,
                body: body
            },
            data: data || {} // Optional data payload for deep linking
        };

        const response = await admin.messaging().send(message);
        
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
