self.addEventListener('install', async (event) => {
  try {
    const response = await fetch('/firebase-app.js');
    const script = await response.text();
    eval(script);

    const messagingResponse = await fetch('/firebase-messaging.js');
    const messagingScript = await messagingResponse.text();
    eval(messagingScript);

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
        icon: payload.notification.icon
      };

      // Show the notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('Error loading Firebase scripts:', error);
  }
});

self.addEventListener('push', function(event) {
  // Retrieve the textual payload from event.data (a PushMessageData object).
  // Other formats are supported (ArrayBuffer, Blob, JSON), check out the documentation
  // on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
  const payload = event.data ? event.data.text() : 'no payload';
  console.log(payload);
  // Keep the service worker alive until the notification is created.
  event.waitUntil(
    // Show a notification with title 'ServiceWorker Cookbook' and use the payload
    // as the body.
    self.registration.showNotification('ServiceWorker Cookbook', {
      body: payload,
    })

  );
  
});
