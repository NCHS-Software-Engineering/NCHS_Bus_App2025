//const socket = new WebSocket("ws://localhost:8080"); // Connect to WebSocket server
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
        if (starredBuses && starredBuses.includes(data.number)) {
            // Send notification for starred bus!
            if (Notification.permission === 'granted'){
                let body;

                // Check if the bus number has changed
                if (data.change && data.change !== "" && data.change !== data.number) {
                    body = `Bus #${data.number}, which is Bus #${data.change} today, has ${data.status}!`;
                } else {
                    body = `Bus #${data.number} has ${data.status}!`;
                }
                new Notification ('Bus Update', {
                    body
                });
                
                // By assigning busses[i].status to previousStatus[busses[i].number], we are updating the previousStatus object to reflect the current status of the bus.
                previousStatus[busses[i].number] = busses[i].status;
            }
        } 
        });

//let starredBusNumbers = new Set(); // Store starred buses globally
function updateTable() {
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

                        row.addEventListener('click', function(event) {
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

                        row.addEventListener('click', function(event) {
                            starred();
                        });
                    }
                }
            }
        });
}

