importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDtqhN1RQkLp-g-IjQWPJs6CudIysqH8BU",
  authDomain: "nchs-bus-app.firebaseapp.com",
  projectId: "nchs-bus-app",
  storageBucket: "nchs-bus-app.firebasestorage.app",
  messagingSenderId: "488283227454",
  appId: "1:488283227454:web:3c0e60d5e474392fb1986f",
  measurementId: "G-TGBYMSQ1BY"
});

console.log("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHH?")
// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (when the app is not in the foreground)
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