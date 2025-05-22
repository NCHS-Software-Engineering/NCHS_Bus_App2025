//webscocket connection
//const socket = new WebSocket("ws://localhost:8080/ws/"); // Connect to WebSocket server
//const socket = new WebSocket("wss://nchsbusapp.org/ws/"); // Connect to WebSocket server
const socket = new WebSocket("wss://bustest.redhawks.us/ws/");


socket.addEventListener("open", () => {
  console.log("Connected to WebSocket server");
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
  console.log("Received message:", event.data);
   busDisplay(89, 20);
});





closeModal();
const mapContainer = document.getElementById('map-container');
const mapWindow = document.getElementById('mapwindow');

let scale = 0.45;
let rotation = 89;
let translate = { x: 0, y: 0 };

/// list = {"Pos" : ["BusNum", "BusReplace", "Star?", "left?"]}
// Only BusNum and BusReplace should be taken externally. Star and Left should never be modified.
async function getBusInfo(){
  return fetch('/getbusInfo')
    .then(response => response.json())
    .then(data => {
      if (data) {
        busInfo = data;
        //console.log(busInfo);
        return busInfo;
      }
    })
    .catch(error => {
      console.error("Error fetching bus information:", error);
    });
}

async function getBusList(){
  return fetch('/getbus')
    .then(response => response.json())
    .then(data => {
      if (data) {
        buslist = data;
        //console.log(buslist);
        return buslist;
      }
    })
    .catch(error => {
      console.error("Error fetching bus list:", error);
    });
}

let pointers = new Map();
let lastTouchMid = null;
let lastTouchDist = null;
let lastTouchAngle = null;

let isMultiTouch = false;
let isDragging = false;
let lastDragPos = { x: 0, y: 0 };

mapContainer.style.transformOrigin = '0 0';

function applyTransform() {
  mapContainer.style.transform = `
    translate(${translate.x}px, ${translate.y}px)
    rotate(${rotation}deg)
    scale(${scale})
  `;
}

function getMidpoint(p1, p2) {
  return {
    x: (p1.clientX + p2.clientX) / 2,
    y: (p1.clientY + p2.clientY) / 2,
  };
}

function getDistance(p1, p2) {
  return Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
}

function getAngle(p1, p2) {
  return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX);
}

mapWindow.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, e);

  if (pointers.size === 1) {
    isDragging = true;
    isMultiTouch = false;
    lastDragPos = { x: e.clientX, y: e.clientY };
  }

  if (pointers.size === 2) {
    isDragging = false;
    isMultiTouch = true;

    const [p1, p2] = Array.from(pointers.values());
    lastTouchMid = getMidpoint(p1, p2);
    lastTouchDist = getDistance(p1, p2);
    lastTouchAngle = getAngle(p1, p2);
  }
});

mapWindow.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, e);

  if (isMultiTouch && pointers.size === 2) {
    const [p1, p2] = Array.from(pointers.values());

    const newMid = getMidpoint(p1, p2);
    const newDist = getDistance(p1, p2);
    const newAngle = getAngle(p1, p2);

    const scaleChange = newDist / lastTouchDist;
    const angleChange = (newAngle - lastTouchAngle) * (180 / Math.PI);
    const angleChangeRad = angleChange * (Math.PI / 180);

    const pivot = lastTouchMid;

    // Scale around pivot
    translate.x = pivot.x - (pivot.x - translate.x) * scaleChange;
    translate.y = pivot.y - (pivot.y - translate.y) * scaleChange;
    scale *= scaleChange;

    // Rotate around pivot
    const offsetX = translate.x - pivot.x;
    const offsetY = translate.y - pivot.y;

    const rotatedX = offsetX * Math.cos(angleChangeRad) - offsetY * Math.sin(angleChangeRad);
    const rotatedY = offsetX * Math.sin(angleChangeRad) + offsetY * Math.cos(angleChangeRad);

    translate.x = pivot.x + rotatedX;
    translate.y = pivot.y + rotatedY;
    rotation += angleChange;

    busDisplay(rotation, (1/scale)*10);

    lastTouchMid = newMid;
    lastTouchDist = newDist;
    lastTouchAngle = newAngle;

    applyTransform();
  }

  // Pan with one pointer (mouse or single touch)
  if (!isMultiTouch && isDragging && pointers.size === 1) {
    const pointer = pointers.get(e.pointerId);
    if (!pointer) return;

    const dx = pointer.clientX - lastDragPos.x;
    const dy = pointer.clientY - lastDragPos.y;

    translate.x += dx;
    translate.y += dy;

    lastDragPos = { x: pointer.clientX, y: pointer.clientY };

    applyTransform();
  }
});




function handlePointerEnd(e) {
  pointers.delete(e.pointerId);

  if (pointers.size < 2) {
    isMultiTouch = false;
    lastTouchMid = null;
    lastTouchDist = null;
    lastTouchAngle = null;
  }

  if (pointers.size === 1) {
    const [remaining] = Array.from(pointers.values());
    lastDragPos = { x: remaining.clientX, y: remaining.clientY };
    isDragging = true;
  }

  if (pointers.size === 0) {
    isDragging = false;
  }
}

mapWindow.addEventListener('pointerup', handlePointerEnd);
mapWindow.addEventListener('pointercancel', handlePointerEnd);

// --- Scroll Zoom (mouse only) ---
mapWindow.addEventListener('wheel', (e) => {
  e.preventDefault();

  const rect = mapWindow.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const prevScale = scale;
  const zoomFactor = Math.exp(-e.deltaY * 0.001);
  scale *= zoomFactor;
  scale = Math.max(0.1, Math.min(10, scale));

  translate.x = mouseX - (mouseX - translate.x) * (scale / prevScale);
  translate.y = mouseY - (mouseY - translate.y) * (scale / prevScale);

  busDisplay(rotation, (1/scale)*10);

  applyTransform();
}, { passive: false });

window.addEventListener('load', () => {
  const mapImg = document.getElementById('map');
  const mapRect = mapWindow.getBoundingClientRect();

  const mapWidth = mapImg.naturalWidth;
  const mapHeight = mapImg.naturalHeight;

  // Center of the map image
  const mapCenter = {
    x: mapWidth / 2,
    y: mapHeight / 2
  };

  // Center of the viewport
  const screenCenter = {
    x: mapRect.width / 2,
    y: mapRect.height / 2
  };

  // Apply scale and rotation to the center of the map
  const scaledX = mapCenter.x * scale;
  const scaledY = mapCenter.y * scale;

  const rad = rotation * Math.PI / 180;
  const rotatedX = scaledX * Math.cos(rad) - scaledY * Math.sin(rad);
  const rotatedY = scaledX * Math.sin(rad) + scaledY * Math.cos(rad);

  // Calculate the translation to center the map
  translate.x = screenCenter.x - rotatedX + 30;
  translate.y = screenCenter.y - rotatedY + 50;

  busDisplay(rotation, (1/scale)*10);
  applyTransform();
});

var onlyStars = false;

function starToggle(){
  onlyStars = !onlyStars
  console.log(onlyStars);
  busDisplay();
}

function busDisplay(rotation, zoom){
  getBusInfo().then(result =>{busInfo = result; 
  starredBussses = getCookie('starredBuses');
  starredBussesArray = Array.from(starredBusses);  

  for (const key in busInfo) {
    if (busInfo.hasOwnProperty(key)) { // Ensure it's not an inherited property
      const value = busInfo[key];
      //console.log(value[0] + " is stared " + starredBussesArray.includes(value[0]));
      if (starredBussesArray.includes(value[0]) && onlyStars === true){
        document.getElementById(key).style.opacity = "0.2";
      } else {
        document.getElementById(key).style.opacity = "1"
      }
      if (value[0] === null){
        document.getElementById(key).style.opacity = "0";
      }
      else{
        infoBox(key, value, rotation, zoom);
      }
    }
  }
  });
}
busDisplay(89, 20);

function infoBox(key, value, rotation, zoom) {
  starredBussesArray = getStarredBussesArray();
  while (rotation < 0) rotation += 360;
  rotation = rotation % 360;

  if (zoom <= 7) zoom = 7;
  if (zoom >= 18) zoom = 18;

  const busEl = document.getElementById(key);

  if (!busEl) return;

  let info = busEl.querySelector('.bus-info');
  if (!info) {
    info = document.createElement('div');
    info.className = 'bus-info';
    busEl.appendChild(info);
  }

  info.textContent = value[0];
  if (value[1] !== null) {
    info.textContent += " 🠒 " + value[1];
  }

  // Base styles
  info.style.position = 'absolute';
  info.style.top = '50%';
  info.style.whiteSpace = 'nowrap';
  info.style.padding = '2px 6px';
  info.style.borderRadius = '6px';
  info.style.fontSize = (zoom + 5) + 'px';
  info.style.pointerEvents = 'none';
  info.style.border = '1px solid #888';
  if (starredBussesArray.includes(value[0]) && onlyStars === true){
    info.style.background = 'rgba(255,255,255,0.2)';
  } else {
    info.style.background = 'rgba(255,255,255,0.8)';
  }

  parentrotate = parseInt(window.getComputedStyle(busEl).getPropertyValue("rotate"));
  if (isNaN(parentrotate)) parentrotate = 0;
  rotation = rotation - 89 + parentrotate;

  if ((rotation-89) > 180) refX = Math.abs(360-(rotation-89));
  else refX = Math.abs(rotation-89);
  refX = Math.round(refX/1.8);


  // Horizontal placement and rotation
  if (value[2]) { // Left
    info.style.left = '-12px';
    info.style.right = 'auto';
    info.style.transform = `translateY(-50%) translateX(-100%) rotate(${-rotation}deg)`;
    info.style.transformOrigin = `center center`;
  } else { // Right
    info.style.right = '-12px';
    info.style.left = 'auto';
    info.style.transform = `translateY(-${refX}%) translateX(100%) rotate(${-rotation}deg)`;
    info.style.transformOrigin = `center center`;
  }

}

function openModal() {
  renderBusList();
  document.getElementById('settingsModal').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
  document.getElementById('settingsModal').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function renderBusList() {
  const busListContainer = document.getElementById('busList');
  busListContainer.innerHTML = ''; // Clear before render
  starredBussses = getCookie('starredBuses');
  starredBussesArray = Array.from(starredBusses);
  console.log('⭐ Favorite Buses:', starredBussesArray);
  getBusList().then(result => {buslist = result;
  for (const bus in buslist) {
    if (buslist.number !== null) {
      const value = bus;

      const wrapper = document.createElement('label');
      wrapper.className = 'bus-item';

      const star = document.createElement('span');
      star.className = 'e-star-filled';
      star.textContent = '★'; // Star character
      star.dataset.busId = "check" + value.number;
      star.dataset.busName = value.number;

      // Add selected class if previously marked as favorite
      if (starredBusses.has(value.number)) {
        star.classList.add('e-star-selected');
      }

      // Toggle selection on click
      star.addEventListener('click', () => {
        star.classList.toggle('e-star-selected');
      });

      let busText = value.number;
      if (value.change !== null) {
        busText += " 🠒 " + value.change;
      }

      const textNode = document.createElement('span');
      textNode.textContent = ' ' + busText;

      wrapper.appendChild(star);
      wrapper.appendChild(textNode);
      busListContainer.appendChild(wrapper);
    }
  }
  });
}
const starredBusses = new Set();

function saveFavorites() {
  starredBussses = getCookie('starredBuses');
  starredBussesArray = Array.from(starredBusses);
  document.querySelectorAll('#busList .e-star-selected').forEach(star => {
    starredBussesArray.push({
      id: star.dataset.busId,
      name: star.dataset.busName
    });
  });
  updateCookie();
  console.log('⭐ Favorite Buses:', starredBussesArray);
  closeModal();
}

function getStarredBussesArray(){
    const starredBussesString = getCookie('starredBuses');
   let starredBussesArray = [];
   if (starredBussesString != undefined) {
      starredBussesArray = JSON.parse(starredBussesString)
   }
   return starredBussesArray;
}
//starred busses
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
   const starredBussesArray = Array.from(starredBusses);
   const starredBussesString = JSON.stringify(starredBussesArray);
   const expirationDate = new Date();
   expirationDate.setFullYear(expirationDate.getFullYear() + 10); // 10 years from now

   //for local host below
   //document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure;`;
   //for dev:           
   document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure; domain=https://bus-dev.redhawks.us/`;

   //update database starredBusses

   navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(async function (subscription) {
        if (!subscription) {
           console.log("✅ Not yet subscibed:", subscription);
           return subscription;
        }
        
        const response = await fetch('/vapidPublicKey');
        const vapidPublicKey = await response.text();
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  
        return reg.pushManager.subscribe({
           userVisibleOnly: true,
           applicationServerKey: convertedVapidKey
        }).then(newSubscription => {
           fetch('./starred', {
              method: 'post',
              headers: {
                 'Content-type': 'application/json'
              },
              body: JSON.stringify({
                 subscription: newSubscription,
                 starred: Array.from(starredBusses) 
              })
           });
        });
     })
  );
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