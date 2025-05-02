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

let isBusMapEnabled = true; // This can be dynamically set based on your logic

// Set the value of the switch based on the variable
document.addEventListener("DOMContentLoaded", () => {
    const modeSwitch = document.getElementById("modeSwitch");
    if (modeSwitch) {
        modeSwitch.checked = isBusMapEnabled; // Set the checkbox state
    }
});

document.getElementById("modeSwitch").addEventListener("change", (event) => {
    isBusMapEnabled = event.target.checked; // Update the variable
    console.log("Switch state:", isBusMapEnabled);
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
