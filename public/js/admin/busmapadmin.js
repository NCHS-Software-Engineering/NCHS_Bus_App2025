const mapContainer = document.getElementById('map-container');
const mapWindow = document.getElementById('mapwindow');

let scale = 0.50;
let rotation = 89;
let translate = { x: 0, y: 0 };
let newbuslist = {}
function getAvailBus() {
  return fetch('/getbus')
    .then(response => response.json())
    .then(data => {
      if (data) {
        const buslist = data.buslist;
        for (let i = 0; i < buslist.length; i++) {
          let change = buslist[i].change === 0 ? null : buslist[i].change;
          newbuslist[buslist[i].number] = change;
        }
        //console.log(newbuslist);
        return newbuslist;
      }
    })
    .catch(error => {
      console.error("Error fetching available buses:", error);
    });
}

// Handle the Promise


let busInfo;
// Bus information: [destination, replacement, left/right]
async function getBusInfo(){
  return fetch('/getbusInfo')
    .then(response => response.json())
    .then(data => {
      if (data) {
        busInfo = data;
        console.log(busInfo);
        return busInfo;
      }
    })
    .catch(error => {
      console.error("Error fetching bus information:", error);
    });
}

 
let pointers = new Map();
let lastTouchMid = null;
let lastTouchDist = null;
let lastTouchAngle = null;

let isMultiTouch = false;
let isDragging = false;
let lastDragPos = { x: 0, y: 0 };
let selectmode = false

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
  applyTransform();
});

function busDisplay(rotation, zoom){
  getBusInfo().then(result => {
    busInfo = result;
    for (const key in busInfo) {
      if (busInfo.hasOwnProperty(key)) { // Ensure it's not an inherited property
        const value = busInfo[key];
        infoBox(key, value, rotation, zoom);
      
      }
    }
  });
}

function infoBox(key, value, rotation, zoom) {
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

  if (value[0] == null) {
    info.style.display = 'none';
  } else {
    info.style.display = ''; // <-- FIX: always show when bus assigned
    info.textContent = value[0];
    if (value[1] !== null) {
      info.textContent += " 🠒 " + value[1];
    }
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
  if (value[0] == null){
    info.style.display = 'none';
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
    info.style.transformOrigin = `right center`;
  } else { // Right
    info.style.right = '-12px';
    info.style.left = 'auto';
    info.style.transform = `translateY(-${refX}%) translateX(100%) rotate(${-rotation}deg)`;
    info.style.transformOrigin = `left center`;
  }

}

let selectedBus = null; // Track the currently selected bus

// Sort the carousel by numerical order
getAvailBus().then(result => {
  availbuses = result; // Logs the fetched data
  const sortedBuses = Object.keys(availbuses).sort((a, b) => parseInt(a) - parseInt(b));
  sortedBuses.forEach((bus) => {
    const replacement = availbuses[bus];
    const busCard = document.createElement("div");
    busCard.className = "bus-card";
    busCard.innerHTML = `
      <div class="bus-number">Bus: ${bus}</div>
      <div class="replacement-bus">Replacement: ${replacement || "None"}</div>
    `;
  
    // Add click event to select the bus
    busCard.addEventListener("click", () => {
      document.querySelectorAll(".bus-card").forEach((card) => card.classList.remove("selected"));
      busCard.classList.add("selected");
      selectedBus = bus;
  
      // Highlight buffer zones
      document.querySelectorAll(".bus-buffer").forEach((buffer) => {
        buffer.classList.add("highlight");
      });
    });
  
    carousel.appendChild(busCard);
  });

});


// Populate the carousel with sorted buses


// Add buffer zones to yellow bus divs
document.querySelectorAll(".bus").forEach((busDiv) => {
  const buffer = document.createElement("div");
  buffer.className = "bus-buffer";
  getBusInfo().then(result =>{
    busInfo = result;
    console.log(busInfo);
    // Adjust buffer size based on busInfo (left or right)
    const busId = busDiv.id;
    const isLeft = busInfo[busId][2]; // Check if the bus is on the left side
    buffer.style.position = "absolute";
    buffer.style.width = isLeft ? "300%" : "300%"; // Extend more to the left or right
    buffer.style.height = "120%";
    buffer.style.top = "-10%";
    buffer.style.left = isLeft ? "-200%" : "0%";
  
    // Append the buffer to the bus div
    busDiv.appendChild(buffer);
  
    // Add click event to the buffer
    buffer.addEventListener("click", () => {
      if (!selectedBus && !busInfo[busId][0]) {
        alert("Please select a bus from the carousel first.");
        return;
      }
      if (selectedBus) {
        if (busInfo[busId][0]) {
          addBusToCarousel(busInfo[busId][0], availbuses[busInfo[busId][0]]);
        }
        busInfo[busId][0] = selectedBus;
        busInfo[busId][1] = availbuses[selectedBus];
  
        // Remove the bus card from the carousel
        const busCard = Array.from(carousel.children).find(card =>
          card.querySelector(".bus-number").textContent.includes(selectedBus)
        );
        if (busCard) busCard.remove();
  
        busDisplay(rotation, (1 / scale) * 10);
  
        // Remove any delete button if present
        const deleteButton = busDiv.querySelector(".delete-button");
        if (deleteButton) deleteButton.remove();
        fetch('/updatebusInfo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(busInfo)
        });
        clearSelection();
        applyTransform();
      }
    });
  
    // Add click event to the yellow bus div for deletion
    busDiv.addEventListener("click", () => {
      // If a bus is selected, do nothing (user is trying to assign a bus)
      if (selectedBus) return;
  
      // If no bus is assigned to this div, do nothing
      if (busInfo[busId][0] === null) return;
  
      // Toggle the delete button
      let deleteButton = busDiv.querySelector(".delete-button");
      if (!deleteButton) {
        // Create a delete button
        deleteButton = document.createElement("div");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "🗙";
        busDiv.appendChild(deleteButton);
  
        // Remove after 3 seconds
        setTimeout(() => {
          if (deleteButton.parentNode === busDiv) {
            deleteButton.remove();
          }
        }, 3000);
  
        // Handle delete button click
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent triggering the busDiv click event
  
          // Return the bus to the carousel
          const removedBus = busInfo[busId][0];
          addBusToCarousel(removedBus, availbuses[removedBus]);
  
          // Clear the bus info
          busInfo[busId][0] = null;
          busInfo[busId][1] = null;
  
          // Remove the delete button
          deleteButton.remove();
  
          busDisplay(rotation, (1 / scale) * 10);
        });
      } else {
        // If the delete button already exists, remove it
        deleteButton.remove();
      }
    });
  });
  });


// Add a global click listener to exit selection mode
document.addEventListener("click", (e) => {
  if (!e.target.closest(".bus-buffer") && !e.target.closest(".bus-card")) {
    // Reset selection
    selectedBus = null;
    document.querySelectorAll(".bus-card").forEach((card) => card.classList.remove("selected"));

    // Remove highlight from buffer zones
    document.querySelectorAll(".bus-buffer").forEach((buffer) => {
      buffer.classList.remove("highlight");
    });
  }
});

// Function to add a bus back to the carousel
function addBusToCarousel(bus, replacement) {
  const busCard = document.createElement("div");
  busCard.className = "bus-card";
  busCard.innerHTML = `
    <div class="bus-number">Bus: ${bus}</div>
    <div class="replacement-bus">Replacement: ${replacement || "None"}</div>
  `;

  // Add click event to select the bus
  busCard.addEventListener("click", () => {
    document.querySelectorAll(".bus-card").forEach((card) => card.classList.remove("selected"));
    busCard.classList.add("selected");
    selectedBus = bus;

    // Highlight buffer zones
    document.querySelectorAll(".bus-buffer").forEach((buffer) => {
      buffer.classList.add("highlight");
    });
  });

  carousel.appendChild(busCard);

  // Sort the carousel after adding the bus
  Array.from(carousel.children)
    .sort((a, b) => parseInt(a.querySelector(".bus-number").textContent.split(": ")[1]) - parseInt(b.querySelector(".bus-number").textContent.split(": ")[1]))
    .forEach((node) => carousel.appendChild(node));
}

// Add this helper function somewhere above
function clearSelection() {
  selectedBus = null;
  document.querySelectorAll(".bus-card").forEach(card => card.classList.remove("selected"));
  document.querySelectorAll(".bus-buffer").forEach(buffer => buffer.classList.remove("highlight"));
}


applyTransform();
busDisplay(89, 20);