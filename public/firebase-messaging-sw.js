self.addEventListener('install', async (event) => {
  try {
    importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js");

    // Initialize Firebase
    firebase.initializeApp({
      apiKey: "AIzaSyDtqhN1RQkLp-g-IjQWPJs6CudIysqH8BU",
      authDomain: "nchs-bus-app.firebaseapp.com",
      projectId: "nchs-bus-app",
      storageBucket: "nchs-bus-app.firebasestorage.app",
      messagingSenderId: "488283227454",
      appId: "1:488283227454:web:3c0e60d5e474392fb1986f",
      measurementId: "G-TGBYMSQ1BY"
    });

    // Retrieve an instance of Firebase Messaging
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage(function(payload) {
      console.log('Background Message received:', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: "/images/Naperville_Central_Logo.png"
      };

      // Show the notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('Error loading Firebase scripts:', error);
  }
});

self.addEventListener("push", function(event) {
  if (!event.data) {
    console.warn("❌ Push event received with no data.");
    return;
  }

  let payload;
  try {
    payload = event.data ? event.data.json(): null;
  } catch (error) {
    console.error("❌ Error parsing push event data:", error);
  }

  console.log("📩 Push event received:", payload);

  const notificationTitle = payload.notification?.title || "Bus Update";
  const notificationOptions = {
    body: payload.notification?.body || "Bus status updated.",
    icon: "/images/Naperville_Central_Logo.png",
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});