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
                while(data.buslist[i].change == null) i++;
                if (i >= data.buslist.length) break;

                let div = document.createElement("div");
                div.classList.add('busObj')
                div.classList.add('flex-fill');

                div.style.backgroundColor = "rgb(255, 44, 44)";

                div.style.borderRadius = "30px";
                div.style.margin = "10px";

                var h = window.innerHeight;
                div.style.height = (h-180)/10+"px";

                let busNumber = data.buslist[i].number;
                if (data.buslist[i].change == null)
                    div.textContent = busNumber;
                else {
                    div.textContent = busNumber + " → " + data.buslist[i].change;
                }
                div.style.textAlign = 'center';
                div.style.fontFamily = 'Gill Sans';
                div.style.lineHeight = div.style.height;
                div.style.fontSize = div.style.height;

                div.onclick = remove;

                document.getElementById('viewBusses').appendChild(div);  
                i++;

                function remove() {
                    
                }
            }
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
                div.classList.add('busObj')
                div.classList.add('flex-fill');

                div.style.backgroundColor = "rgb(255, 44, 44)";

                div.style.borderRadius = "30px";
                div.style.margin = "10px";

                var h = window.innerHeight;
                div.style.height = (h-180)/10+"px";

                let busNumber = data.buslist[i].number;
                if (data.buslist[i].change == null)
                    div.textContent = busNumber;
                else {
                    div.textContent = busNumber + " → " + data.buslist[i].change;
                }
                div.style.textAlign = 'center';
                div.style.fontFamily = 'Gill Sans';
                div.style.lineHeight = div.style.height;
                div.style.fontSize = div.style.height;
                div.style.cursor = 'pointer';

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

function resize() {
    editBusses();
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Resize the Redbar
    var newW = w/5.88;
    document.getElementById('redbar').style.width = newW+"px";
    // resize the tab bar
    document.getElementById('tabs').style.width = w-newW+"px";
    // resize bus container
    document.getElementById('viewBusses').style.width = w-newW+"px";
    document.getElementById('viewBusses').style.height = h-50+"px";
    document.getElementById('viewBusses').style.left = newW+"px";
    document.getElementById('editBusses').style.width = w-newW+"px";
    document.getElementById('editBusses').style.height = h-50+"px";
    document.getElementById('editBusses').style.left = newW+"px";

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