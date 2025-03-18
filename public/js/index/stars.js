document.addEventListener('DOMContentLoaded', function() {
    //let starredBusses = [];
    
    // Check if cookies exist
    const starredBussesString = getCookie('starredBusses');
    //console.log(starredBusses);
    let starredBussesArray = [] ;
    if(starredBussesString != undefined){
        starredBussesArray=   JSON.parse(starredBussesString)
    }


    fetch('/getbus')
        .then(response => { 
            if(response.ok) {
                return response.json(); // not important
            }
        }).then(data => {
            if(data) {
                //console.log(findSmallest())
                
                let i = 1
                let busses = data.buslist;
                let table = document.getElementById('busTable');;
                let item = document.getElementById('star-selector');
                table.setAttribute('id', 'myTable'); // Set an ID for the table
                //console.log(busses.length)
                //console.log(starredBussesArray.length)
                for(var v = starredBussesArray.length - 1; v>=0; v--){
                    while(i < busses.length + 1) { // busses[i]

                        smallestBus = data.buslist[0].number;
                        highestBus = data.buslist[busses.length - 1].number
                    
                        let row = table.rows[i];
                        var initelement = row.cells[0]
                        var intValue = parseInt(initelement.textContent.trim(), 10);

                        if(intValue == starredBussesArray[v]){
                            const table = row.parentNode.parentNode;
                            //console.log(table)
                            //console.log(starredBussesArray[v])
                            starredBusses.add(starredBussesArray[v])
                            //console.log(starredBusses);
                            starredBussesArray.pop();

                            var element = row.cells[4].querySelector('span.starring');
                            
                            element.style.backgroundColor = 'yellow';
                            element.style.border = '2px solid black';
                            
                            //table.insertBefore(row, row.firstChild);
                            let tbody = table.querySelector('tbody');
                            tbody.insertBefore(row, tbody.children[1]);
                        }
                        i++;
                    }//end of while loop
                    i = 1;
                }
            }});
  
               




/*  for(var v = starredBussesArray.length - 1; v>=0; v--){

    starredBusses.add(starredBussesArray[v]);
    const busRows = document.querySelectorAll('bus-table tr:not(:first-child)'); // Exclude the first row (header)
    console.log(busRows)
    busRows.forEach(row => {
        const busNumber = parseInt(row.cells[0].textContent.trim()); // Assuming bus number is in the first cell
        console.log(busNumber)
        const starringButton = row.querySelector('.starring'); // Assuming each row has a starring button
        // Check if the bus is starred
        if (starredBussesArray.includes(busNumber)) {
            // Apply starred styles to the button
            starringButton.style.backgroundColor = 'yellow';
            starringButton.style.border = '2px solid black';
            console.log(starringButton.style.border)
        } else {
            // Apply unstarred styles to the button
            starringButton.style.backgroundColor = 'white';
            starringButton.style.border = '1px solid black';
        }
    });*/

                       /* let i = 0;

            
                    let busses = data.buslist;
                    let table = document.getElementById('busTable');
                    let item = document.getElementById('star-selector');




                    while(i < busses.length) {
                        let row = table.rows[i];
                        var initelement = row.cells[0]
                        var intValue = parseInt(initelement.textContent.trim(), 10);

                        if(intValue == starredBussesArray[v]){
                            starredBusses.add(starredBussesArray[v])
                            starredBussesArray.pop();

                            var element = row.cells[4].querySelector('span.starring');
                            
                            element.style.backgroundColor = 'yellow';
                            element.style.border = '2px solid black';
                            
                            table.insertBefore(row, table.firstChild.nextSibling);


                        }
                    }*/




               // }
         



    



});
var starredBusses = new Set([]);
var lowestBus = 0;
var factor = 10000;
var highestBus = 0;


let table = document.getElementById('busTable');

//var tabelElement = table.rows.cells[0]
//var tableValue = parseInt(tableElement.textContent.trim(), 10);
//console.log(tabelValue)






function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check if this cookie contains the name we're looking for
        if (cookie.startsWith(name + '=')) {
            // If it does, return the cookie value
            return cookie.substring(name.length + 1);
        }
    }
    // If the cookie with the specified name is not found, return null
    return null;
}

function updateCookie() {
    // Convert starredBusses set to an array and then to a string
    const starredBussesArray = Array.from(starredBusses);
    const starredBussesString = JSON.stringify(starredBussesArray);
    // Set the cookie with the name 'starredBusses' and the value as the stringified array
    // NEW CHNAGE -- not in ORIGINAL STARRED BUSSES
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 10); // 10 years from now

    //for local host below
    document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure;`;
    //     for dev:           document.cookie = `starredBusses=${starredBussesString}; expires=${expirationDate.toUTCString()}; SameSite=None; Secure; domain=https://bus-dev.redhawks.us/`;

    //console.log('starredBusses cookie value:', starredBussesString);

    //console.log(starredBussesArray)
}

function getStarredBussesArray(starredBussesString) {
     // Parse the JSON string to convert it back to an array
}


//updates the bustable after reciving the message from ws
function updateTable(message) {
    let table = document.getElementById('myTable');
    if (!table) {
        console.error('Table with id "busTable" not found!');
        return;
    }

    // Clear existing rows except for the header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Add new rows
    message.buslist.forEach((bus) => {
        let row = table.insertRow(-1);

        row.insertCell(0).innerHTML = bus.number;
        row.insertCell(1).innerHTML = bus.change;
        row.insertCell(2).innerHTML = bus.status;
        row.insertCell(3).innerHTML = bus.timestamp;
        row.insertCell(4).innerHTML = "<span id='star-selector' class='e-icons e-medium e-star-filled starring'></span>";

        let starButton = row.cells[4].querySelector('span.starring');
        starButton.style.backgroundColor = 'white';
        starButton.style.border = '1px solid black';

        row.addEventListener('click', function(event) {
        starred();
        });
    });
    }

/*function updateTable(message){
    let busses = message;
    fetch('/getbus')
        .then(response => { 
            if(response.ok) {
                return response.json(); // not important
            }
        }).then(data => {
            if(data) {
                if(busses){
                    let table = document.getElementById('busTable');
                    if(table){       
                        for(let i = 1; i <= busses.length+1; i++){
                            //console.log(table.rows);
                            let row = table.rows[i];
                            if(row){
                                row.cells[0].innerHTML = busses[i-1].number;
                                row.cells[1].innerHTML = busses[i-1].change;
                                row.cells[2].innerHTML = busses[i-1].status;
                                row.cells[3].innerHTML = busses[i-1].timestamp;
                                
                                
                            }
                            if(starredBusses.has(tableValue)){
                                starredBusses.delete(tableValue);
                                starred();

                            }
                        }
                        console.log("Bus Table updated");
                    }
                    else{
                        console.log("No table 'busTable' found");
                        }

                }else{
                    console.error("Invalid data recived from websocket:" ,message);
    }}});
}*/

function updateStarredUI() {
    const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
        var element = row1.cells[4].querySelector('span.starring');
        
        element.style.backgroundColor = 'yellow';
        element.style.border = '2px solid black';
        


        var table = document.createElement('table');
                table.setAttribute('id', 'myTable'); // Set an ID for the table
            fetch('/getbus')
            .then(response => { 
                if(response.ok) {
                    return response.json(); // not important
                }
            }).then(data => {
                if(data) {
                    let i = 0;

                    let busses = data.buslist;
                    let table = document.getElementById('busTable');
                    let item = document.getElementById('star-selector');

                    while(i < busses.length) { // busses[i]
                        let row = table.rows[i];
                        var initelement = row.cells[0]
                        var intValue = parseInt(initelement.textContent.trim(), 10);
                        
                        if(starredBussesString.has(intValue)){
                            table.insertBefore(row, table.firstChild.nextSibling);

                            //console.log('lol')
                        }
                        
                     }
                }
            });
}

function makeTable() {

    var table = document.createElement('table');

    table.setAttribute('id', 'myTable'); // Set an ID for the table
    fetch('/getbus')
    .then(response => { 
    if(response.ok) {
        return response.json(); // not important
    }
    }).then(data => {
        if(data) { // if there is data
            let i = 0;


            let busses = data.buslist;
            let table = document.getElementById('busTable');
            let item = document.getElementById('star-selector');
            //console.log("bus table:" + table);

            while(i < busses.length) { // busses[i]
                let row = table.insertRow(-1);
            
                row.insertCell(0).innerHTML = busses[i].number;
                row.insertCell(1).innerHTML = busses[i].change;
                row.insertCell(2).innerHTML = busses[i].status;
                row.insertCell(3).innerHTML = busses[i].timestamp;
                row.insertCell(4).innerHTML = "<span id = 'star-selector' class='e-icons e-medium e-star-filled starring'></span>";
                row.addEventListener('click', function(event){

                    starred();
                });
                i++;
            }
        }
    });
}


function fetchBusses() {
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
    }).then(data => {
        if(data) { // if there is data
            let i = 1;
            let busses = data.buslist;
            let table = document.getElementById('busTable');
            let item = document.getElementById('star-selector');
            

            while(i < busses.length) { // busses[i]
                //console.log(i);
                //console.log("Busses.length: " + busses.length);
                let row = table.rows[i];
                row.cells[0].innerHTML = busses[i-1].number;
                row.cells[1].innerHTML = busses[i-1].change;
                row.cells[2].innerHTML = busses[i-1].status;
                row.cells[3].innerHTML = busses[i-1].timestamp;
                
                if(starredBusses.has(tableValue)){
                    starredBusses.delete(tableValue);
                    starred();

                }     
                i++;
            }
            item.classList.add('starred-factor');           
        }
    });
}

makeTable();
var smallestBus = 0;

function starred(){ //add isStarred
    findSmallest();
    findHighest();
    //console.log(starredBusses + "**************")
    const buttons = document.querySelectorAll('.starring');
    const clickedButton = event.target;
    //console.log(clickedButton)
    const row = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
    //console.log(row)
    var initelement = row.cells[0]
    var intValue = parseInt(initelement.textContent.trim(), 10);
    const table = row.parentNode; // Get the table element
    //console.log(intValue)
    let noOtherStars = false;


    if(!(starredBusses.has(intValue))){
        starredBusses.add(intValue);
        //Vinay is here!!
        fetch('/getbus')
            .then(response => { 
            if(response.ok) {
                return response.json(); // not important
            }
            }).then(data => {

                /*if(starredBusses.size == data.buslist.length){
                    document.querySelector('h1').textContent = "Is Starring Done?";
                }*/
            })


        updateCookie();
        const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
        var element = row1.cells[4].querySelector('span.starring');
        
        element.style.backgroundColor = 'yellow';
        element.style.border = '2px solid black';
        
        table.insertBefore(row, table.firstChild.nextSibling);
    }else {

        let check = false;
        let v = 0;
        
        while(!check && v < table.rows.length) { // busses[i]{
            
            if(table.rows[v] == null){
                var initelement1 = null;
            }else{
                let rowint = table.rows[v]; 
                var initelement1 = rowint.cells[0];
                var intValue1 = parseInt(initelement1.textContent.trim(), 10);
                //console.log("(((((((((" + intValue1)
            }
        
            findSmallest()
            
            //console.log(intValue1)
            //console.log(intValue)
            //console.log(smallestBus)
            //console.log( parseInt(table.rows[v+1].cells[0].textContent.trim(), 10)) // === undefined)

            if(intValue === smallestBus){
                check = true;
            }else if(intValue === highestBus){
                check = true;
            }else if(!(starredBusses.has(intValue1)) || isNaN(parseInt(table.rows[v+1].cells[0].textContent.trim(), 10))){
                //console.log(parseInt(table.rows[v+1].cells[0].textContent.trim(), 10))
                let rowint1 = table.rows[v+1]; 
                var initelement2 = rowint1.cells[0];
                var intValue2 = parseInt(initelement2.textContent.trim(), 10);

                if(intValue1 < intValue && intValue < intValue2){
                    check = true;
                    //console.log(intValue1);
                }
            //  v++;
                
            }else{
                check =  true;
                noOtherStars = true;

            }// CASE SHOULD BE SET AFTER FIXING CURRENT STARRING ISSUE
            v++;

        }

        const rowReference = table.rows[v];
        //console.log(rowReference)
        
        starredBusses.delete(intValue)
        updateCookie();
        //console.log()
        //table.insertBefore(row, rowReference.nextSibling);

        if(noOtherStars||intValue == highestBus){
            table.appendChild(row);
        }else{
            rowReference.insertAdjacentElement('beforebegin', row);

        }


        const row1 = clickedButton.parentNode.parentNode; // Get the row associated with the clicked button
        
        var element = row1.cells[4].querySelector('span.starring');
        
        element.style.backgroundColor = 'white';
        element.style.border = '1px solid black';

    // console.log(location.reload())
        //location.reload();

}

/*const userId = getCookie('c_email');

if (userId) {
const starredBuses = JSON.parse(fs.readFileSync('starredBuses.json', 'utf8'));
if (!starredBuses.users[userId]) {
starredBuses.users[userId] = [];
}
starredBuses.users[userId].push(busNumber);
fs.writeFileSync('starredBuses.json', JSON.stringify(starredBuses));
}*/

const busNumber = parseInt(row.cells[0].textContent.trim(), 10);
const starredBuses = JSON.parse(localStorage.getItem('starredBuses')) || [];
if (starredBuses.includes(busNumber)) {
starredBuses.splice(starredBuses.indexOf(busNumber), 1);
} else {
starredBuses.push(busNumber);
}
localStorage.setItem('starredBuses', JSON.stringify(starredBuses));
}



/*/*else{
                check = true;
                noOtherStars = true;
            } CASE SHOULD BE SET AFTER FIXING CURRENT STARRING ISSUE*/
            //  v++;

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function hmm() {
    let c1 = getRandomInt(255)
    let c2 = getRandomInt(255)
    let c3 = getRandomInt(255)
    document.body.style.backgroundColor = "rgb("+(c1+50)+", "+(c2+50)+", "+(c3+50)+")"
    document.getElementById('navbar').style.backgroundColor = "rgb("+c1+", "+c2+", "+c3+")"
    document.querySelectorAll('th').forEach(cell=>{
        cell.style.backgroundColor = "rgb("+c1+", "+c2+", "+c3+")"
    })
    document.querySelectorAll('tr').forEach(cell=>{
        cell.onmouseover = function() {
            c1 = getRandomInt(255)
            c2 = getRandomInt(255)
            c3 = getRandomInt(255)
            cell.style.backgroundColor = "rgb("+c1+", "+c2+", "+c3+")"
        }
    })
}


function findSmallest() {
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
        }).then(data => {
        if(data) { // if there is data
            smallestBus = data.buslist[0].number;
            //console.log(smallestBus)
    
        }
    }).catch(err => console.error(err));
}

function findHighest() {
    fetch('/getbus')
    .then(response => { 
        if(response.ok) {
            return response.json(); // not important
        }
        }).then(data => {
        if(data) { // if there is data
            var num = 0;
            var i =0;
            while(i<data.buslist.length){
                if(data.buslist[i].number > num){
                    highestBus = data.buslist[i].number;
                }
                i++;
            }
    
        }
    }).catch(err => console.error(err));
}


// document.addEventListener('DOMContentLoaded', function() {

//starred();