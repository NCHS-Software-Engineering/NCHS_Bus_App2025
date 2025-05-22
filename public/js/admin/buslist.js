//const socket = new WebSocket("ws://localhost:8080/ws/"); // Connect to WebSocket server
//const socket = new WebSocket("wss://nchsbusapp.org/ws/"); // Connect to WebSocket server
const socket = new WebSocket("wss://bustest.redhawks.us/ws/");

socket.addEventListener("open", () => {
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
  
    // Parse the received data
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.error('Error parsing WebSocket message:', event.data);
      return;
    }
  
    // Update the buses if buslist is included in the message
    if (data.buslist) {
      getBusses(data.buslist); // Renders updated bus list
    }
  });
  
  function handleBusClick(busNumber) {
    const busButton = document.getElementById(`bus-${busNumber}`);
    let newStatus;

    if (busButton.style.backgroundColor === "rgb(255, 44, 44)") {
        newStatus = "Arrived";
    } else if (busButton.style.backgroundColor === "green") {
        newStatus = "Departed";
    } else {
        newStatus = "Not Arrived";
    }

    // Send the new status to the server
    const busData = { number: busNumber, newStatus };
    fetch('/updateStatus', {
        method: 'POST',
        body: JSON.stringify(busData),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                // If response is not JSON, return text for error handling
                return response.text().then((text) => {
                    throw new Error(text);
                });
            }
            return response.json();
        })
        .then((data) => {
        })
        .catch((error) => {
            alert(`Error updating bus status: ${error.message}`);
        });
}

document.addEventListener("DOMContentLoaded", async () => {
    const busNavButton = document.getElementById("busNavButton");
    const busNavPicture = document.getElementById("BusNavPicture");

    try {
        // Fetch the state synchronously
        const response = await fetch('/getSwitchState');
        if (response.ok) {
            const data = await response.json();
            if (data.state) {
                busNavButton.setAttribute("onclick", "window.location.href='/busmapadmin'");
                busNavPicture.setAttribute("src", "/public/images/busmap.png");
            } else {
                busNavButton.setAttribute("onclick", "window.location.href='/buslist'");
                busNavPicture.setAttribute("src", "/public/images/buslist.png");
            }
        }
    } catch (err) {
        console.error("Error fetching switch state:", err);
    }
});


function newBtn() {
    let div = document.createElement("div");
    div.classList.add('editbuses');

    var h = window.innerHeight;
    div.style.height = (h-180)/10+"px";



    document.getElementById('allBusses').appendChild(div);  
}

function updateBusses() {
    let o = document.getElementsByClassName('busObj');
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
        }).then(data => {
        if(data) { // if there is data
            let i = 0;
            while(i < data.buslist.length) {
                let div = o[i];
                getColor();
                i++;

                function getColor() {
                    if (data.buslist[i].status == "Not Arrived") div.style.backgroundColor = "rgb(255, 44, 44)";
                    else if (data.buslist[i].status == "Arrived") div.style.backgroundColor = 'green';
                    else div.style.backgroundColor = 'grey';
                }
            }
        }
    }).catch(err => console.error(err));
}

//WEBSOCKET

function getBusses() {
    let o = document.getElementsByClassName('busObj');
    for (let i = 0; i < o.length; i++) {
        o[i].style.display = 'none';
    }

    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
        }).then(data => {
        if(data) { // if there is data
            let i = 0;
            while(i < data.buslist.length) {
                let div = document.createElement("div");
                div.classList.add('busObj')
                div.classList.add('editbuses');

                if(data.buslist[i].status == "Not Arrived") div.style.backgroundColor = "rgb(255, 44, 44)";
                else if(data.buslist[i].status == "Arrived") div.style.backgroundColor = "green";
                else if(data.buslist[i].status == "Departed") div.style.backgroundColor = "grey";



                let busNumber = data.buslist[i].number;
                if (data.buslist[i].change == null)
                    div.textContent = busNumber;
                else {
                    div.textContent = busNumber + " → " + data.buslist[i].change + "";
                }
                let change;
                if (data.buslist[i].change != undefined) change = data.buslist[i].change;
                else change = 0;

                div.onclick = changeColor;
                
                document.getElementById('allBusses').appendChild(div);  
                i++;

                function changeColor() {
                    if (div.style.backgroundColor == "rgb(255, 44, 44)") {

                        let busdata = {
                            number: busNumber,
                            newStatus: "Arrived",
                            change: change
                        };
                        // sends the busdata
                        fetch('/updateStatus', {
                            method: 'POST',
                            body: JSON.stringify(busdata),
                            headers: {
                                'Content-Type': 'application/json',
                              }
                        })
                        .then((response) => response.json())
                        .then((data) => {
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });

                        div.style.backgroundColor = 'green';
                    } else if (div.style.backgroundColor == 'green'){
                        let busdata = {
                            number: busNumber,
                            newStatus: "Departed",
                            change: change
                        };
                        // sends the busdata
                        fetch('/updateStatus', {
                            method: 'POST',
                            body: JSON.stringify(busdata),
                            headers: {
                                'Content-Type': 'application/json',
                              }
                        })
                        .then((response) => response.json())
                        .then((data) => {
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });

                        div.style.backgroundColor = 'grey';
                    } else {
                        let busdata = {
                            number: busNumber,
                            newStatus: "Not Arrived",
                            change: change
                        };
                        // sends the busdata
                        fetch('/updateStatusTime', {
                            method: 'POST',
                            body: JSON.stringify(busdata),
                            headers: {
                                'Content-Type': 'application/json',
                              }
                        })
                        .then((response) => response.json())
                        .then((data) => {
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                        div.style.backgroundColor = "rgb(255, 44, 44)";
                    }
                }
            }//end of the while loop

            updateButtonSize(data.buslist.length);
        }
    }).catch(err => console.error(err));
}


function newBus(text) {
    let div = document.createElement("div");
    div.classList.add('flex-fill');
    div.textContent = text;
    
}

function displayBusses() {
    // get bus list AND status from server, create a table using the data
}

function updateButtonSize(numButtons) {

    let columns = Math.ceil(Math.sqrt(numButtons));
    let rows = Math.ceil(numButtons / columns);

    let width = (85/columns - 1).toString() + "vw";
    let height = (99/rows - 2.5).toString() + "vh";

    let buttons = document.querySelectorAll('.editbuses');

    buttons.forEach(button => {
        button.style.width = width;
        button.style.height = height;
    });
}

function updateButtonSize(numButtons) {

    let columns = Math.ceil(Math.sqrt(numButtons));
    let rows = Math.ceil(numButtons / columns);

    let width = (85/columns - 1).toString() + "vw";
    let height = (99/rows - 2.5).toString() + "vh";

    let buttons = document.querySelectorAll('.editbuses');

    buttons.forEach(button => {
        button.style.width = width;
        button.style.height = height;
    });
}

getBusses();