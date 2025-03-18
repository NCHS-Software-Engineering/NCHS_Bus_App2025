import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// console.log("AHHHHHHHHHHHHHH!");

const firebaseConfig = {
    apiKey: "AIzaSyDtqhN1RQkLp-g-IjQWPJs6CudIysqH8BU",
    authDomain: "nchs-bus-app.firebaseapp.com",
    projectId: "nchs-bus-app",
    storageBucket: "nchs-bus-app.firebasestorage.app",
    messagingSenderId: "488283227454",
    appId: "1:488283227454:web:3c0e60d5e474392fb1986f",
    measurementId: "G-TGBYMSQ1BY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Asks for Notification Permission
async function requestPermission() {
try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
    console.log("Notification permission granted.");
    getFCMToken(); // Fetch FCM Token
    new Notification ('Star a Bus', {
        body: "You will only receive notifications for the busses you star. :)"
    })
    } else {
    console.log("Notification permission denied.");
    }
} catch (error) {
    console.error("Error requesting permission:", error);
}
}

// Get FCM Token
async function getFCMToken() {
try {
    const token = await getToken(messaging, { vapidKey: "BFczqoG5aFc4UK24ZfURzutR3ZCrfzGIjQL953JEFU78YxwimYfmVoLG_CEch8OqSkCpG3C-fkxDg_V2aJlckXs" });
    if (token) {
    console.log("FCM Token:", token);
    // You can send this token to your backend for future notifications
    } else {
    console.log("No registration token available.");
    }
} catch (error) {
    console.error("Error getting token:", error);
}
}

// Handle Incoming Notifications
onMessage(messaging, (payload) => {
    console.log("Message received:", payload);
    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon
    });
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
        console.error("Service Worker registration failed:", error);
        }); 
    }

    navigator.serviceWorker.ready
        .then(function(registration) {
        // Use the PushManager to get the user's subscription to the push service.
            return registration.pushManager.getSubscription()
        .then(async function(subscription) {
            // If a subscription was found, return it.
            if (subscription) {
                return subscription;
            }

            // Get the server's public key
            const response = await fetch('/vapidPublicKey');
            const vapidPublicKey = await response.text();
            // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
            // urlBase64ToUint8Array() is defined in /tools.js
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            // Otherwise, subscribe the user (userVisibleOnly allows to specify that we don't plan to
            // send notifications that don't have a visible effect for the user).
            return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
            });
        });
        }).then(function(subscription) {
        // Send the subscription details to the server using the Fetch API.
            fetch('./check-subscription',{
                method: 'post',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify({
                    subscription:subscription,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if(!data.exists){
                    fetch('./register', {
                        method: 'post',
                        headers: {
                        'Content-type': 'application/json'
                        },
                        body: JSON.stringify({
                        subscription: subscription
                    }),
                });
                }
            })

    });


function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Request permission on page load
const permbutton = document.getElementById('permission');
permbutton.addEventListener('click', function(){
    requestPermission();   
})