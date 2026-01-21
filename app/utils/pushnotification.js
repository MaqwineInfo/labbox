const axios = require("axios");

const FCM_URL = "https://fcm.googleapis.com/fcm/send";
 
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

const sendNotification = async (deviceToken, title, body) => {
  try {
    if (!deviceToken) return { error: "Device token is missing" };

    const payload = {
      to: deviceToken,
      notification: {
        title,
        body,
        sound: "default",
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        id: "1",
        status: "done",
      },
    };

    const response = await axios.post(FCM_URL, payload, {
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Notification sent:", response.data);
    return response.data;

  } catch (error) {
    console.error("Notification sending failed:", error.message);
    return { error: error.message };
  }
};

module.exports = sendNotification;
