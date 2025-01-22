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

    console.log(c);

    


   
}

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Resize the Redbar
    var newW = w/5.88;
    document.getElementById('redbar').style.width = newW+"px";


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
//listBus();

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

window.addEventListener("resize", resize);
