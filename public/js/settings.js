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
            console.log(data);
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

function listEmails() {
    fetch('/getemails')
    .then(response => {
        if(response.ok) { 
            return response.json();
        }
        }).then(data => {
        if(data) {
            data.users.forEach(element => {
                document.getElementById("emails").append(element)
                document.getElementById("emails").append("\n")
            });
            
        }
    }).catch(err => console.error(err));
}
listEmails()

function listBuswhitelist() {
    console.log('hello')
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
    }).then(data => {
        if(data) { // if there is data
            let i = 0;
            let busses = data.buslist;
            console.log('busses')
            while(i < busses.length) { // busses[i]
                document.getElementById("bus-whitelist").append(busses[i].number)
                document.getElementById("bus-whitelist").append("\n")
                i++;
            }
        }
    }).catch(err => console.error(err));
}
listBuswhitelist()
