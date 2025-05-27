
window.spawnmaxwell = function() {
   const gif = document.createElement("img");
   gif.src = "/public/images/maxwell.gif";
   gif.id = "maxwell";
   gif.style.position = "fixed";
   gif.style.zIndex = 9999;
   gif.style.width = "100px"; // Smaller Maxwell
   gif.style.height = "auto";
   gif.style.left = "0px";
   gif.style.top = "0px";
   gif.style.pointerEvents = "none";
   document.body.appendChild(gif);

   const audio = document.getElementById("maxwell-audio");
   if (audio) audio.play();

   let t = 0;

   const gifWidth = 100;
   const gifHeight = 100;

   const maxX = window.innerWidth - gifWidth;
   const maxY = window.innerHeight - gifHeight;

   // Randomized chaotic wave parameters
   const amplitudeX1 = maxX / 3 * (0.5 + Math.random());
   const amplitudeY1 = maxY / 3 * (0.5 + Math.random());
   const amplitudeX2 = maxX / 4 * Math.random();
   const amplitudeY2 = maxY / 4 * Math.random();

   const freqX1 = 0.01 + Math.random() * 0.01;
   const freqY1 = 0.01 + Math.random() * 0.01;
   const freqX2 = 0.01 + Math.random() * 0.02;
   const freqY2 = 0.01 + Math.random() * 0.02;

   const offsetX = maxX / 2;
   const offsetY = maxY / 2;

   let animationId;

   function animateMaxwell() {
      if (hmm) {
         const hue = (t * 5) % 360;
         gif.style.filter = `hue-rotate(${hue}deg)`;
      }

      const x = offsetX + Math.sin(t * freqX1) * amplitudeX1 + Math.cos(t * freqX2) * amplitudeX2;

      const y =offsetY + Math.cos(t * freqY1) * amplitudeY1 + Math.sin(t * freqY2) * amplitudeY2;
      gif.style.left = `${x}px`;
      gif.style.top = `${y}px`;

      t += 1;
      animationId = requestAnimationFrame(animateMaxwell);
   }

   animateMaxwell();

   // ⏱️ After 28 seconds, fade out and remove
   setTimeout(() => {
      cancelAnimationFrame(animationId);
      gif.style.transition = "opacity 2s ease";
      gif.style.opacity = "0";

      setTimeout(() => {
         gif.remove();
      }, 2000);
   }, 28000);
};

window.toggleNotifs = function() {
   const popup = document.getElementById('popupNotifs');
   const notifStat = document.getElementById('notifStatus');
   popup.style.display = (popup.style.display === 'flex') ? 'none' : 'flex';
   requestPermission()

   if (Notification.permission === "denied"){
       notifStat.innerHTML = `It seems that the device has denied notification permissions. Try pressing the tune icon <image style='height: 23px; padding: 1px;' src='/public/images/tune.png'></image> in the top left of your screen, then reset all permissions. Reload the website and press the bell icon 🔔 again. Make sure to press 'allow' once the app request permissions for notifications.`
   }
   else if (Notification.permission === "granted"){
       notifStat.innerHTML = `Notifications are working! You are all good to go! If you have issues, try pressing the tune icon <image style='height: 23px; padding: 1px;' src='/public/images/tune.png'></image> in the top left of your screen, then reset all permissions. Reload the website and press the bell icon 🔔 again. Make sure to press "allow" once the app request permissions for notifications.`
   }
   else {
       notifStat.innerHTML = `Something doesn't seem right. We have sent a request to show notifications. If it doesn't show up, try pressing the tune icon <image style='height: 23px; padding: 1px;' src='/public/images/tune.png'></image> in the top left of your screen, then reset all permissions. Reload the website and press the bell icon 🔔 again. Make sure to press "allow" once the app request permissions for notifications.`
   }
   notifStat.innerHTML += '<div><br>Notifications do not work on Apple Devices yet!</div>'
};

async function requestPermission() {
   try {
      if ('safari' in window && 'pushNotification' in window.safari) {
         //ios stuff
         // // Ask for permission
         // window.safari.pushNotification.requestPermission(
         //    "https://bustest.redhawks.us", 
         //    "web.com.nchsbusapp.push",
         //    {},
         //    function (permissionData) {
         //       if (permissionData.permission === 'granted') {
         //          console.log("Push Token:", permissionData.deviceToken);
         //          // Send this deviceToken to your backend
         //          fetch('/register-ios-token', {
         //             method: 'POST',
         //             headers: {
         //                'Content-Type': 'application/json'
         //             },
         //             body: JSON.stringify({
         //                token: permissionData.deviceToken
         //             })
         //          });
         //       } else {
         //          console.log("Push permission denied:", permissionData);
         //       }
         //    }
         // );
      } else {
         const permission = await Notification.requestPermission();
         if (permission === "granted") {
            navigator.serviceWorker.ready.then(reg =>
               reg.pushManager.getSubscription().then(async function (subscription) {
                  fetch('./send-notification', {
                        method: "POST",
                        headers: {
                           "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                           notification:{
                              title: "Starred Buses",
                              body: "Starred buses will now receive notifications.",},
                           subscription: subscription
                        })
                     })
                     .then(res => res.json())
                     .catch(error => console.error("❌ Error sending notification request:", error));
               })
            )
         } else {
            console.log("Notification permission denied.");
         }
      }
      
   } catch (error) {
      console.error("Error requesting permission:", error);
   }
}


window.closeNotifs = function() {
   const popup = document.getElementById('popupNotifs');
   popup.style.display = (popup.style.display === 'flex') ? 'none' : 'flex';
};

window.toggleInfo = function() {
   const popup = document.getElementById('popupInfo');
   popup.style.display = (popup.style.display === 'flex') ? 'none' : 'flex';
};
