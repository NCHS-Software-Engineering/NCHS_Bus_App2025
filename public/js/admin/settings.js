function reset(){
    fetch('/reset')
    .then(response => {
        if(response.ok) {
            return response.json();
        }
        }).then(data => {
        if(data) {
        }
    }).catch(err => console.error(err));
}

function listBus() {
    let o = document.getElementsByClassName('busObj');
    for (let i = 0; i < o.length; i++) {
        o[i].style.display = 'none';
    }

    fetch('/getbus')
    .then(response => {
        if(response.ok) {
            return response.json();
        }
        }).then(data => {
        if(data) {
            let i = 0;
            while(i < data.length) {
                let bus = document.createElement("h5"); 
                bus.style.fontSize = "large";
                bus.className = "busObj";
                bus.textContent = data[i];
                document.getElementById('list').appendChild(bus);
                i++;
            }
        }
    }).catch(err => console.error(err));
}

let isBusMapEnabled = false; // This can be dynamically set based on your logic

// Set the value of the switch based on the variable

document.addEventListener("DOMContentLoaded", async () => {
    const busNavButton = document.getElementById("busNavButton");
    const busNavPicture = document.getElementById("BusNavPicture");

    try {
        // Fetch the state synchronously
        const response = await fetch('/getSwitchState');
        if (response.ok) {
            const data = await response.json();
            if(data) {
                isBusMapEnabled = data.state; // Update the variable based on server response    
                modeSwitch.checked = isBusMapEnabled; 
            }
            if(isBusMapEnabled) {
                busNavButton.setAttribute("onclick", "window.location.href='/busmapadmin'");
                busNavPicture.setAttribute("src", "/public/images/busmap.png"); 
            }
            else{
                busNavButton.setAttribute("onclick", "window.location.href='/buslist'");
                busNavPicture.setAttribute("src", "/public/images/buslist.png"); 
            }
        }
    } catch (err) {
        console.error("Error fetching switch state:", err);
    }
});

document.getElementById("modeSwitch").addEventListener("change", (event) => {
    const busNavButton = document.getElementById("busNavButton");
    const busNavPicture = document.getElementById("BusNavPicture");

    // Update the state immediately
    isBusMapEnabled = event.target.checked;

    // Update the logo and route dynamically
    if (isBusMapEnabled) {
        busNavButton.setAttribute("onclick", "window.location.href='/busmapadmin'");
        busNavPicture.setAttribute("src", "/public/images/busmap.png");
    } else {
        busNavButton.setAttribute("onclick", "window.location.href='/buslist'");
        busNavPicture.setAttribute("src", "/public/images/buslist.png");
    }

    // Send the updated state to the server
    fetch('/set-switch-state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: isBusMapEnabled }) // Send the updated state to the server
    }).catch(err => console.error("Error updating switch state:", err));
});

function listEmails() {
    fetch('/getemails')
    .then(response => {
        if(response.ok) { 
            return response.json();
        }
        }).then(data => {
        if(data) {
            data.users.forEach(element => {
                let newOption = document.createElement("option");
                newOption.value = element;
                newOption.textContent = element;
                emailDropdown.appendChild(newOption);

                document.getElementById("scrollable-div").append(element)
                document.getElementById("scrollable-div").append("\n")
            });
            
        }
    }).catch(err => console.error(err));
}
listEmails()

function listBuswhitelist() {
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
    }).then(data => {
        if(data) { // if there is data
            let i = 0;
            let busses = data.buslist;
            while(i < busses.length) { // busses[i]
                let newOption = document.createElement("option");
                newOption.value = busses[i].number;
                newOption.textContent = busses[i].number;
                busDropdown.appendChild(newOption);

                document.getElementById("bus-whitelist").append(busses[i].number)
                if (i != busses.length-1){
                    document.getElementById("bus-whitelist").append(",")
                }
                document.getElementById("bus-whitelist").append("\n")
                i++;
            }
        }
    }).catch(err => console.error(err));
}
listBuswhitelist()
