const socket = new WebSocket("ws://localhost:3000"); // Connect to WebSocket server

socket.addEventListener("open", () => {
  console.log("Connected to WebSocket server");
});

// Listen for messages from the server
socket.addEventListener('message', (event) => {
    console.log('WebSocket message received:', event.data);
  
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
            console.log('Bus status updated:', data);
        })
        .catch((error) => {
            console.error('Error updating bus status:', error.message);
            alert(`Error updating bus status: ${error.message}`);
        });
}

  


console.log();

function newBtn() {
    let div = document.createElement("div");
    div.classList.add('flex-fill');
    div.style.backgroundColor = "red";
    div.style.borderRadius = "30px";
    div.style.margin = "10px";

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

//
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
                console.log("HERE");

                if(data.buslist[i].status == "Not Arrived") div.style.backgroundColor = "rgb(255, 44, 44)";
                else if(data.buslist[i].status == "Arrived") div.style.backgroundColor = "green";
                else if(data.buslist[i].status == "Departed") div.style.backgroundColor = "grey";
                /*if (data.buslist[i].status == "Departed" && data.buslist[i].number == 1234567890){
                    div.style.backgroundColor = "rgb(60, 60, 200)";
                }*/

                div.style.borderRadius = "30px";
                div.style.margin = "10px";

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

                div.style.textAlign = 'center';
                div.style.fontFamily = 'Gill Sans';
                div.style.fontSize = (h-180)/10+"px";
                div.style.cursor = "pointer";
                div.style.lineHeight = div.style.height;

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
                            change: change
                        };
                        console.log(busdata);
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


function newBus(text) {
    let div = document.createElement("div");
    div.classList.add('flex-fill');
    div.style.backgroundColor = "red";
    div.style.borderRadius = "30px";
    div.style.margin = "10px";

    var h = window.innerHeight;
    div.style.height = (h-180)/10+"px";

    div.textContent = text;

    /*fetch('/getbus')
    .then(response => {
        if(response.ok) {
            return response.json();
        }
        }).then(data => {
        if(data) {
            console.log(data);
            fs = require('fs'); //add to logs.json
            var filename = 'logs.json';
            var json = '{"bus":0, "description":"Bus Created", "timestamp":"' + time + '"}'
            fs.writeFileSync(filename, JSON.stringify(json)); 
        }
    }).catch(err => console.error(err));*/

    
}

function displayBusses() {
    // get bus list AND status from server, create a table using the data
}

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Resize the Redbar
    var newW = w/5.88;
    document.getElementById('redbar').style.width = newW+"px";
    // resize the tab bar
    document.getElementById('tabs').style.width = w-newW+"px";
    // resize bus container
    document.getElementById('allBusses').style.width = w-newW+"px";
    document.getElementById('allBusses').style.height = h-50+"px";
    document.getElementById('allBusses').style.left = newW+"px";


    // Resize the buttons
    var buttonMargin = (newW-(newW*0.882352941176471))/2;
    var newBtnW = newW*0.882352941176471;
    let buttons = document.querySelectorAll('.flex-fill');
    let btnIcons = document.querySelectorAll("#menu-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.margin = buttonMargin+"px";

        buttons[i].style.width = newBtnW+"px";
        buttons[i].style.height = (h-(10*buttonMargin))/5+"px";
        btnIcons[i].style.margin = ((h-(10*buttonMargin))/5)*.05+"px";

        if (newBtnW > (h-(10*buttonMargin))/5) { // width is larger than height
            btnIcons[i].style.width = ((h-(10*buttonMargin))/5)*.9+"px";
            btnIcons[i].style.height = ((h-(10*buttonMargin))/5)*.9+"px";
        } else if (newBtnW < (h-(10*buttonMargin))/5) { // height is larger than width
            btnIcons[i].style.width = newBtnW*.9+"px";
            btnIcons[i].style.height = newBtnW*.9+"px";
        }
    }

    document.getElementById('main-container').style.display = "flex";
}
resize();
window.addEventListener("resize", resize);