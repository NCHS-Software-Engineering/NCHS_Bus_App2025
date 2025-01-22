const socket = new WebSocket("ws://localhost:3000"); // Connect to WebSocket server

socket.addEventListener("open", () => {
  console.log("Connected to WebSocket server");
});

// Listen for messages from the server
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log("WebSocket message received:", data);

  // Update bus status dynamically based on received data
  const busDivs = document.getElementsByClassName('busObj');
  for (let div of busDivs) {
    if (div.textContent.includes(data.number)) {
      div.style.backgroundColor = getStatusColor(data.newStatus);
      div.textContent = `${data.number} → ${data.change || ''}`;
    }
  }
});

// Helper function to get color based on status
function getStatusColor(status) {
  switch (status) {
    case 'Not Arrived':
      return 'rgb(255, 44, 44)';
    case 'Arrived':
      return 'green';
    case 'Departed':
      return 'grey';
    default:
      return 'blue';
  }
}

// Modify the changeColor function to send updates via WebSocket
function changeColor() {
  let newStatus;
  if (div.style.backgroundColor == "rgb(255, 44, 44)") {
    newStatus = "Arrived";
    div.style.backgroundColor = 'green';
  } else if (div.style.backgroundColor == 'green') {
    newStatus = "Departed";
    div.style.backgroundColor = 'grey';
  } else {
    newStatus = "Not Arrived";
    div.style.backgroundColor = "rgb(255, 44, 44)";
  }

  // Broadcast the change via WebSocket
  const update = {
    number: busNumber,
    newStatus,
    change,
  };
  socket.send(JSON.stringify(update));
}
