//const socket = new WebSocket("ws://localhost:8080/ws/"); // Connect to WebSocket server
//const socket = new WebSocket("wss://nchsbusapp.org/ws/"); // Connect to WebSocket server
const socket = new WebSocket("wss://bustest.redhawks.us/ws/");

socket.addEventListener("open", () => {
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
    //console.log('WebSocket message received:', event.data);
  
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
      location.reload();
    }
  });

document.addEventListener("DOMContentLoaded", () => {
    const modeSwitch = document.getElementById("modeSwitch");
    fetch('/getSwitchState')
    .then(response => {
        if(response.ok) {
            return response.json();
        }
    }).then(data => {
        if(data) {
            isBusMapEnabled = data.state; // Update the variable based on server response    
            modeSwitch.checked = isBusMapEnabled; 
        }
    }).catch(err => console.error(err));
    
});

function viewBusEdit() {
    let viewTab = document.getElementById('viewBusses');
    let editTab = document.getElementById('editBusses');
    viewTab.style.display = "none";
    editTab.style.display = "flex";
}

function viewBusChanges() {
    let viewTab = document.getElementById('viewBusses');
    let editTab = document.getElementById('editBusses');
    viewTab.style.display = "flex";
    editTab.style.display = "none";
}

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
                div.classList.add('flex-fill');

                if(data.buslist[i].status == "Not Arrived") div.style.backgroundColor = "rgb(255, 44, 44)";
                else if(data.buslist[i].status == "Arrived") div.style.backgroundColor = "green";
                else if(data.buslist[i].status == "Departed") div.style.backgroundColor = "grey";
                /*if (data.buslist[i].status == "Departed" && data.buslist[i].number == 1234567890){
                    div.style.backgroundColor = "rgb(60, 60, 200)";
                }*/
                var h = window.innerHeight;
                div.style.height = (h-180)/10+"px";

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
                

                document.getElementById('viewBusses').appendChild(div);  
                i++;

                function changeColor() {
                    if (div.style.backgroundColor == "rgb(255, 44, 44)") {

                        let busdata = {
                            number: busNumber,
                            newStatus: "Arrived",
                            change: change,
                            changed: true
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
                            console.log('Success:', data);
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });

                        div.style.backgroundColor = 'green';
                    } else if (div.style.backgroundColor == 'green'){
                        let busdata = {
                            number: busNumber,
                            newStatus: "Departed",
                            change: change,
                            changed: true
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
                            console.log('Success:', data);
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });

                        div.style.backgroundColor = 'grey';
                    } else {
                        let busdata = {
                            number: busNumber,
                            newStatus: "Not Arrived",
                            change: change,
                            changed: true
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
                            console.log('Success:', data);
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                        div.style.backgroundColor = "rgb(255, 44, 44)";
                    }
                }
            }//end of the while loop
        }
    }).catch(err => console.error(err));
}


function editBusses() {
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
                div.classList.add("editbuses");
                let busStatus = data.buslist[i].status;
                let busNumber = data.buslist[i].number;
                if (data.buslist[i].change == null)
                    div.textContent = busNumber;
                else {
                    div.textContent = busNumber + " → " + data.buslist[i].change;
                }
                div.onclick = edit;

                document.getElementById('editBusses').appendChild(div);  
                i++;

                function edit() {
                    let newChange = prompt('What is the Bus Change?');
                    if (newChange != null)
                    {
                        newChange = Number(newChange);
                    
                        let busdata = {
                            number: busNumber,
                            newStatus: busStatus,
                            change: newChange
                        };

                        fetch('/updateChange', {
                            method: 'POST',
                            body: JSON.stringify(busdata),
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        })
                        .then((response) => response.json())
                        .then((data) => {
                            console.log('Success:', data);
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                        location.reload();
                    }
                }
            }

            updateButtonSize(data.buslist.length);
        }
    }).catch(err => console.error(err));
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

editBusses();