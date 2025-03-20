require("dotenv").config();
const webPush = require("web-push");
const fs = require("fs");

// Ensure VAPID keys are correctly set
webPush.setVapidDetails(
  "mailto:rakeough@stu.naperville203.org",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Load stored subscriptions
const subscriptions = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));

const payload = JSON.stringify({
  notification: {
    title: "Test Push",
    body: "This is a test notification!",
    icon: "/images/Naperville_Central_Logo.png"
  }
});

// Send push notification to each subscriber
subscriptions.forEach(sub => {
  webPush.sendNotification(sub.subscription, payload)
    .then(() => console.log("✅ Test Notification Sent to:", sub.subscription.endpoint))
    .catch(err => console.error("❌ Error Sending Push Notification:", err));
});
