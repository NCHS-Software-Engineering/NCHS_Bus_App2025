import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging.js";

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
window.requestPermission = async function() {
   try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
         console.log("Notification permission granted.");
         fetch('./send-notification', {
               method: "POST",
               headers: {
                  "Content-type": "application/json"
               },
               body: JSON.stringify({
                  title: "Starred Buses",
                  body: "Starred buses will now receive notifications.",
               })
            })
            .then(res => res.json())
            .then(response => console.log("✅ Notification request sent to server:", response))
            .catch(error => console.error("❌ Error sending notification request:", error));
      } else {
         console.log("Notification permission denied.");
      }
   } catch (error) {
      console.error("Error requesting permission:", error);
   }
}

// Get FCM Token
window.getFCMToken = async function() {
   try {
      const token = await getToken(messaging, {
         vapidKey: "BFczqoG5aFc4UK24ZfURzutR3ZCrfzGIjQL953JEFU78YxwimYfmVoLG_CEch8OqSkCpG3C-fkxDg_V2aJlckXs"
      });
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


if ("serviceWorker" in navigator) {
   navigator.serviceWorker.register("/firebase-messaging-sw.js")
      .then((registration) => {
         console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
         console.error("Service Worker registration failed:", error);
      });
}

navigator.serviceWorker.ready.then(reg =>
    reg.pushManager.getSubscription().then(async function (subscription) {
      if (subscription) {
         console.log("✅ Already subscribed:", subscription);
         return subscription;
      }

      const response = await fetch('/vapidPublicKey');
      const vapidPublicKey = await response.text();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      return reg.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: convertedVapidKey
      }).then(newSubscription => {
         console.log("🔄 New Subscription:", JSON.stringify(newSubscription));
         fetch('./register', {
            method: 'post',
            headers: {
               'Content-type': 'application/json'
            },
            body: JSON.stringify({
               subscription: newSubscription
            })
         });
      });
   })
);

// safari compatibility
if ('safari' in window && 'pushNotification' in window.safari) {
   console.log("Safari push notifications are supported!");

   // Ask for permission
   window.safari.pushNotification.requestPermission(
      "https://your-server.com", // Your web server
      "web.com.yourdomain.push", // Your Web Push ID from Apple
      {},
      function (permissionData) {
         if (permissionData.permission === 'granted') {
            console.log("Push Token:", permissionData.deviceToken);
            // Send this deviceToken to your backend
            fetch('/register-ios-token', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                  token: permissionData.deviceToken
               })
            });
         } else {
            console.log("Push permission denied:", permissionData);
         }
      }
   );
} else {
   console.log("Safari push notifications are NOT supported on this browser.");
}


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

document.addEventListener('DOMContentLoaded', function () {
   //let starredBusses = [];

   // Check if cookies exist
   const starredBussesString = getCookie('starredBusses');
   //console.log(starredBusses);
   let starredBussesArray = [];
   if (starredBussesString != undefined) {
      starredBussesArray = JSON.parse(starredBussesString)
   }


   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) {
            //console.log(findSmallest())

            let i = 1
            let busses = data.buslist;
            let table = document.getElementById('busTable');;
            let item = document.getElementById('star-selector');
            table.setAttribute('id', 'myTable'); // Set an ID for the table
            //console.log(busses.length)
            //console.log(starredBussesArray.length)
            for (var v = starredBussesArray.length - 1; v >= 0; v--) {
               while (i < busses.length + 1) { // busses[i]

                  smallestBus = data.buslist[0].number;
                  highestBus = data.buslist[busses.length - 1].number

                  let row = table.rows[i];
                  var initelement = row.cells[0]
                  var intValue = parseInt(initelement.textContent.trim(), 10);

                  if (intValue == starredBussesArray[v]) {
                     const table = row.parentNode.parentNode;
                     //console.log(table)
                     //console.log(starredBussesArray[v])
                     starredBusses.add(starredBussesArray[v])
                     //console.log(starredBusses);
                     starredBussesArray.pop();

                     var element = row.cells[4].querySelector('span.starring');

                     element.classList.add("e-star-selected");

                     //table.insertBefore(row, row.firstChild);
                     let tbody = table.querySelector('tbody');
                     tbody.insertBefore(row, tbody.children[1]);
                  }
                  i++;
               } //end of while loop
               i = 1;
            }
         }
      });

});
var starredBusses = new Set([]);
var lowestBus = 0;
var factor = 10000;
var highestBus = 0;


let table = document.getElementById('busTable');


function getCookie(name) {
   const cookieString = document.cookie;
   const cookies = cookieString.split(';');
   for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Check if this cookie contains the name we're looking for
      if (cookie.startsWith(name + '=')) {
         // If it does, return the cookie value
         return cookie.substring(name.length + 1);
      }
   }
   // If the cookie with the specified name is not found, return null
   return null;
}

function updateCookie() {
   // Convert starredBusses set to an array and then to a string
   const starredBussesArray = Array.from(starredBusses);
   const starredBussesString = JSON.stringify(starredBussesArray);
   // Set the cookie with the name 'starredBusses' and the value as the stringified array
   // NEW CHNAGE -- not in ORIGINAL STARRED BUSSES
   const expirationDate = new Date();
   expirationDate.setFullYear(expirationDate.getFullYear() + 10); // 10 years from now

   //for local host below
   document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure;`;
   //     for dev:           document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure; domain=https://bus-dev.redhawks.us/`;

   //console.log('starredBusses cookie value:', starredBussesString);

   //console.log(starredBussesArray)
}

function getStarredBussesArray(starredBussesString) {
   // Parse the JSON string to convert it back to an array
}


//updates the bustable after reciving the message from ws
function updateTable() {
   if (arguments.length === 0) {
      let table = document.getElementById('myTable');
      if (!table) {
         console.error('Table with id "busTable" not found!');
         return;
      }

      // Clear existing rows except for the header
      while (table.rows.length > 1) {
         table.deleteRow(1);
      }

      fetch('/getbus')
         .then(response => {
            if (response.ok) {
               return response.json();
            }
         })
         .then(data => {
            if (data) {
               let busses = data.buslist;

               // First, add starred buses to the table
               for (let i = 0; i < busses.length; i++) {
                  if (starredBusses.has(busses[i].number)) {
                     let row = table.insertRow(-1);

                     row.insertCell(0).innerHTML = busses[i].number;
                     row.insertCell(1).innerHTML = busses[i].change;
                     row.insertCell(2).innerHTML = busses[i].status;
                     row.insertCell(3).innerHTML = busses[i].timestamp;
                     row.insertCell(4).innerHTML = "<span id='star-selector' class='e-icons e-medium e-star-filled starring'></span>";

                     let starButton = row.cells[4].querySelector('span.starring');
                     starButton.style.backgroundColor = 'yellow';
                     starButton.style.border = '2px solid black';

                     row.addEventListener('click', function (event) {
                        starred();
                     });
                  }
               }


               // Then, add non-starred buses to the table
               for (let i = 0; i < busses.length; i++) {
                  if (!starredBusses.has(busses[i].number)) {
                     let row = table.insertRow(-1);

                     row.insertCell(0).innerHTML = busses[i].number;
                     row.insertCell(1).innerHTML = busses[i].change;
                     row.insertCell(2).innerHTML = busses[i].status;
                     row.insertCell(3).innerHTML = busses[i].timestamp;
                     row.insertCell(4).innerHTML = "<span id='star-selector' class='e-icons e-medium e-star-filled starring'></span>";

                     row.addEventListener('click', function (event) {
                        starred();
                     });
                  }
               }
            }
         });
   } else {
      let message = arguments[0];
      let table = document.getElementById('myTable');
      if (!table) {
         console.error('Table with id "busTable" not found!');
         return;
      }

      // Clear existing rows except for the header
      while (table.rows.length > 1) {
         table.deleteRow(1);
      }

      // Add new rows
      message.buslist.forEach((bus) => {
         let row = table.insertRow(-1);

         row.insertCell(0).innerHTML = bus.number;
         row.insertCell(1).innerHTML = bus.change;
         row.insertCell(2).innerHTML = bus.status;
         row.insertCell(3).innerHTML = bus.timestamp;
         row.insertCell(4).innerHTML = "<span id='star-selector' class='e-icons e-medium e-star-filled starring'></span>";

         let starButton = row.cells[4].querySelector('span.starring');
         starButton.style.backgroundColor = 'white';
         starButton.style.border = '1px solid black';

         row.addEventListener('click', function (event) {
            starred();
         });
      });
   }
}

window.updateStarredUI = function() {
   const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
   var element = row1.cells[4].querySelector('span.starring');

   element.classList.add("e-star-selected");

   var table = document.createElement('table');
   table.setAttribute('id', 'myTable'); // Set an ID for the table
   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) {
            let i = 0;

            let busses = data.buslist;
            let table = document.getElementById('busTable');
            let item = document.getElementById('star-selector');

            while (i < busses.length) { // busses[i]
               let row = table.rows[i];
               var initelement = row.cells[0]
               var intValue = parseInt(initelement.textContent.trim(), 10);

               if (starredBussesString.has(intValue)) {
                  table.insertBefore(row, table.firstChild.nextSibling);

                  //console.log('lol')
               }

            }
         }
      });
}

function makeTable() {

   var table = document.createElement('table');

   table.setAttribute('id', 'myTable'); // Set an ID for the table
   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) { // if there is data
            let i = 0;


            let busses = data.buslist;
            let table = document.getElementById('busTable');
            let item = document.getElementById('star-selector');
            //console.log("bus table:" + table);

            while (i < busses.length) { // busses[i]
               let row = table.insertRow(-1);

               row.insertCell(0).innerHTML = busses[i].number;
               row.insertCell(1).innerHTML = busses[i].change;
               row.insertCell(2).innerHTML = busses[i].status;
               row.insertCell(3).innerHTML = busses[i].timestamp;
               row.insertCell(4).innerHTML = "<span id = 'star-selector' class='e-icons e-medium e-star-filled starring'></span>";
               row.addEventListener('click', function (event) {

                  starred();
               });
               i++;
            }
         }
      });
}


window.fetchBusses = function(){
   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) { // if there is data
            let i = 1;
            let busses = data.buslist;
            let table = document.getElementById('busTable');
            let item = document.getElementById('star-selector');


            while (i < busses.length) { // busses[i]
               //console.log(i);
               //console.log("Busses.length: " + busses.length);
               let row = table.rows[i];
               row.cells[0].innerHTML = busses[i - 1].number;
               row.cells[1].innerHTML = busses[i - 1].change;
               row.cells[2].innerHTML = busses[i - 1].status;
               row.cells[3].innerHTML = busses[i - 1].timestamp;

               if (starredBusses.has(tableValue)) {
                  starredBusses.delete(tableValue);
                  starred();

               }
               i++;
            }
            item.classList.add('starred-factor');
         }
      });
}

//const socket = new WebSocket("ws://localhost:8080/ws/"); // Connect to WebSocket server
//const socket = new WebSocket("wss://nchsbusapp.org/ws/"); // Connect to WebSocket server
const socket = new WebSocket("wss://bustest.redhawks.us/ws/");


socket.addEventListener("open", () => {
   //console.log("Connected to WebSocket server");
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
   //console.log('WebSocket message received:', event.data);

   // Parse the received data
   let data;
   try {
      data = JSON.parse(event.data);
      console.log('Received data:', data);
   } catch (e) {
      console.error('Error parsing WebSocket message:', event.data);
      return;
   }

   // Update the buses if buslist is included in the message
   //if (data.buslist) {
   updateTable(); // Renders updated bus list
   let previousStatus = {};
   //}
   // Check if the user has starred the bus
   const starredBuses = JSON.parse(localStorage.getItem('starredBuses'));
   console.log(starredBuses);
});

//let starredBusNumbers = new Set(); // Store starred buses globally


makeTable();
var smallestBus = 0;

function starred() { //add isStarred
   findSmallest();
   findHighest();
   //console.log(starredBusses + "**************")
   const buttons = document.querySelectorAll('.starring');
   const clickedButton = event.target;
   //console.log(clickedButton)
   const row = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
   //console.log(row)
   var initelement = row.cells[0]
   var intValue = parseInt(initelement.textContent.trim(), 10);
   const table = row.parentNode; // Get the table element
   //console.log(intValue)
   let noOtherStars = false;


   if (!(starredBusses.has(intValue))) {
      starredBusses.add(intValue);
      //Vinay is here!!
      fetch('/getbus')
         .then(response => {
            if (response.ok) {
               return response.json(); // not important
            }
         }).then(data => {

            /*if(starredBusses.size == data.buslist.length){
                document.querySelector('h1').textContent = "Is Starring Done?";
            }*/
         })


      updateCookie();
      const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
      var element = row1.cells[4].querySelector('span.starring');

      element.classList.add("e-star-selected");

      table.insertBefore(row, table.firstChild.nextSibling);
   } else {

      let check = false;
      let v = 0;

      while (!check && v < table.rows.length) { // busses[i]{

         if (table.rows[v] == null) {
            var initelement1 = null;
         } else {
            let rowint = table.rows[v];
            var initelement1 = rowint.cells[0];
            var intValue1 = parseInt(initelement1.textContent.trim(), 10);
            //console.log("(((((((((" + intValue1)
         }

         findSmallest()

         //console.log(intValue1)
         //console.log(intValue)
         //console.log(smallestBus)
         //console.log( parseInt(table.rows[v+1].cells[0].textContent.trim(), 10)) // === undefined)

         if (intValue === smallestBus) {
            check = true;
         } else if (intValue === highestBus) {
            check = true;
         } else if (!(starredBusses.has(intValue1)) || isNaN(parseInt(table.rows[v + 1].cells[0].textContent.trim(), 10))) {
            //console.log(parseInt(table.rows[v+1].cells[0].textContent.trim(), 10))
            let rowint1 = table.rows[v + 1];
            var initelement2 = rowint1.cells[0];
            var intValue2 = parseInt(initelement2.textContent.trim(), 10);

            if (intValue1 < intValue && intValue < intValue2) {
               check = true;
               //console.log(intValue1);
            }
            //  v++;

         } else {
            check = true;
            noOtherStars = true;

         } // CASE SHOULD BE SET AFTER FIXING CURRENT STARRING ISSUE
         v++;

      }

      const rowReference = table.rows[v];
      //console.log(rowReference)

      starredBusses.delete(intValue)
      updateCookie();
      //console.log()
      //table.insertBefore(row, rowReference.nextSibling);

      if (noOtherStars || intValue == highestBus) {
         table.appendChild(row);
      } else {
         rowReference.insertAdjacentElement('beforebegin', row);

      }


      const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button

      var element = row1.cells[4].querySelector('span.starring');

      element.classList.remove("e-star-selected");

      // console.log(location.reload())
      //location.reload();

   }


   const busNumber = parseInt(row.cells[0].textContent.trim(), 10);
   const starredBuses = JSON.parse(localStorage.getItem('starredBuses')) || [];
   if (starredBuses.includes(busNumber)) {
      starredBuses.splice(starredBuses.indexOf(busNumber), 1);
   } else {
      starredBuses.push(busNumber);
   }
   localStorage.setItem('starredBuses', JSON.stringify(starredBuses));
}


function getRandomInt(max) {
   return Math.floor(Math.random() * max);
}

let hmm = false;
window.hmm = function() {
   hmm = true;
   let c1 = getRandomInt(255)
   let c2 = getRandomInt(255)
   let c3 = getRandomInt(255)
   document.body.style.backgroundColor = "rgb(" + (c1 + 50) + ", " + (c2 + 50) + ", " + (c3 + 50) + ")"
   document.getElementById('navbar').style.backgroundColor = "rgb(" + c1 + ", " + c2 + ", " + c3 + ")"
   document.querySelectorAll('th').forEach(cell => {
      cell.style.backgroundColor = "rgb(" + c1 + ", " + c2 + ", " + c3 + ")"
   })
   document.querySelectorAll('tr').forEach(cell => {
      cell.onmouseover = function () {
         c1 = getRandomInt(255)
         c2 = getRandomInt(255)
         c3 = getRandomInt(255)
         cell.style.backgroundColor = "rgb(" + c1 + ", " + c2 + ", " + c3 + ")"
      }
   })
}


function findSmallest() {
   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) { // if there is data
            smallestBus = data.buslist[0].number;
            //console.log(smallestBus)

         }
      }).catch(err => console.error(err));
}

function findHighest() {
   fetch('/getbus')
      .then(response => {
         if (response.ok) {
            return response.json(); // not important
         }
      }).then(data => {
         if (data) { // if there is data
            var num = 0;
            var i = 0;
            while (i < data.buslist.length) {
               if (data.buslist[i].number > num) {
                  highestBus = data.buslist[i].number;
               }
               i++;
            }

         }
      }).catch(err => console.error(err));
}

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

