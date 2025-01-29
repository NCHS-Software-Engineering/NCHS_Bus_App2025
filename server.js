// Load Node modules
var express = require("express");
const ejs = require("ejs");



// Initialise Express
var app = express();
// Render static files
app.use(express.static("public"));
// Set the view engine to ejs
app.set("view engine", "ejs");
// Port website will run on
app.listen(8080);

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// WEBSOCKET
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.get("/getbus", (req, res) => {
  let datajson = fs.readFileSync("buslist.json");
  let data = JSON.parse(datajson);
  res.send(data);
});

app.post("/updateStatus", (req, res) => {
  let bus = req.body;
  // Validate incoming request
  if (!bus || !bus.number || !bus.newStatus) {
    return res.status(400).json({ error: "Invalid bus data provided" });
  }
  console.log()
  let change = bus.newStatus;
  let time = getTime();

  fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    let buslist;
    try {
      buslist = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Invalid JSON data" });
    }

    let updatingbus = bus.number;
    if (bus.change != 0) {
      updatingbus = bus.change;
    }

    // Update the bus status
    let busFound = false;
    console.log("bus change: "+ bus.newStatus);
    for (let i = 0; i < buslist.buslist.length; i++) {
      let iteratedbus = buslist.buslist[i].number;
      if (buslist.buslist[i].change != null) {
        iteratedbus = buslist.buslist[i].change;
      }

      if (updatingbus == iteratedbus) {
        buslist.buslist[i].status = bus.newStatus;
        buslist.buslist[i].timestamp = time;
        busFound = true;
        break;
      }
    }

    if (!busFound) {
      return res.status(404).json({ error: "Bus not found" });
    }

    let final = JSON.stringify(buslist);

    fs.writeFile("buslist.json", final, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Brodcast updated data
      broadcast(buslist);

      res.status(200).json({ message: "Bus status updated successfully" });
    });
    
  });
});


function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data)); // Send updated data as stringified JSON
    }
  });
}

// WebSocket handling


// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

//

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
const fs = require("fs");
const { ok } = require("assert");

var crypto = require('crypto');
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// *** GET Routes - display pages ***
// Root Route
app.use(express.static("public"));
app.get("/", function (req, res) {
  res.render("pages/index");
});

function reset(condition) {
  let hour = new Date().getHours();
  if (hour == 0 || condition) {
    fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
      let buslist = JSON.parse(jsonString);

      for (i = 0; i < buslist.buslist.length; i++) {
        buslist.buslist[i].status = "Not Arrived";
        buslist.buslist[i].change = null;
        buslist.buslist[i].timestamp = null;
      }

      let final = JSON.stringify(buslist);

      fs.writeFile("buslist.json", final, (err) => {});

      /*let logWrite = {
                "bus" : 0,
                "description" : "All bus statuses reset",
                "timestamp" : time
            }
            fs.writeFile('logs.json', JSON.stringify(logWrite), err => {})*/
    });
  }
}
reset(false);
setInterval(reset, 1000 * 60 * 60, false);

//let busNum = Number(req.body.busnum);

var time;
function getTime() {
  var action = new Date();
  var hour = action.getHours();
  var minute = action.getMinutes();

  let now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });


  return (
    now.slice(now.indexOf(",") + 2, now.indexOf(":") + 3) +
    " " +
    now.slice(now.indexOf("M") - 1)
  );
}
getTime();

var action_done = "";

function verifyToken(req, res) {
  let cookies = req.cookies;
  //let c_email = cookies.slice(cookies.indexOf('=')+1, cookies.indexOf('%')) + '@' + cookies.slice(cookies.indexOf('%') + 3, cookies.indexOf(';'));
  if (cookies['c_email'] == undefined || cookies['c_token'] == undefined) return false
  let c_email = cookies['c_email'];
  let c_token = cookies['c_token'];

  let shasum = crypto.createHash('sha1');
  shasum.update(c_email);
  let hashedEmail = shasum.digest('hex');

  if (hashedEmail == c_token) {
    res.clearCookie('c_email');
    res.clearCookie('c_token');
    res.cookie('c_email', c_email, {maxAge: 3600000, httpOnly: true});
    res.cookie('c_token', c_token, {maxAge: 3600000, httpOnly: true})

    return true;
  }
  return false;
}

//will need to fix later
app.get("/reset", (req, res) => {
  if (verifyToken(req, res)){
    reset(true);
    res.render("pages/buslist");
  }
  else{
    res.redirect('/');
  }
});

app.get("/buslist", function (req, res) {
 // if (verifyToken(req, res)) {
    return res.render("pages/buslist");
  //} else {
  //  return res.redirect("/");
 // }
});


app.get("/buschanges", function (req, res) {
  //if (verifyToken(req, res)) 
  res.render("pages/buschanges");
 // else res.redirect('/');
});

app.get("/logs", function (req, res) {
 // if (verifyToken(req, res))
  res.render("pages/logs");
 // else res.redirect('/');
});

app.get("/settings", function (req, res) {
  //if (verifyToken(req, res))
  res.render("pages/settings");
 // else res.redirect('/');
});

app.get("/getemails", (req, res) => {
  fs.readFile("whitelist.json", "utf-8", (err, jsonString) => {
    let emails = JSON.parse(jsonString);
    res.send(emails)
  })
})

app.post("/addemail", (req, res) => {
  action_done = "Email Added";
  let email = req.body.email;

  let emailist = { users: [] };
  fs.readFile("whitelist.json", "utf-8", (err, jsonString) => {
    let emails = JSON.parse(jsonString);
    for (i = 0;  i < emails.users.length; i++) {
      emailist.users.push(emails.users[i])
    }
    emailist.users.push(email)
    fs.writeFile("whitelist.json", JSON.stringify(emailist), (err) => {});
  });
  
  res.redirect("settings");
})

app.post("/delemail", (req, res) => {
  action_done = "Email Deleted";
  //delete email
  let email = req.body.email;

  let emailist = { users: [] };
  fs.readFile("whitelist.json", "utf-8", (err, jsonString) => {
    let emails = JSON.parse(jsonString);
    for (i = 0;  i < emails.users.length; i++) {
      emailist.users.push(emails.users[i])
    }
    for (i = 0; i < emailist.users.length; i++) {
      if (emailist.users[i].toLowerCase() == email.toLowerCase()) {
        emailist.users.splice(i, i + 1);
      }
    }
    fs.writeFile("whitelist.json", JSON.stringify(emailist), (err) => {});
  });
  
  res.redirect("settings");
});

app.post("/addbus", (req, res) => {
  action_done = "Bus Added";
  let busNum = Number(req.body.busnum);

  let newBusObj = {
    number: busNum,
    status: "Not Arrived",
    change: null,
    timestamp: null
  };

  let fullList = { buslist: [] };

  fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
    let buslist = JSON.parse(jsonString);

    for (i = 0; i < buslist.buslist.length; i++) {
      fullList.buslist.push(buslist.buslist[i]);
    }
    
    fullList.buslist.push(newBusObj);

    fullList.buslist = fullList.buslist.sort((a, b) => {
      if (a.number < b.number) {
        return -1;
      }
    });

    let final = JSON.stringify(fullList);

    fs.writeFile("buslist.json", final, (err) => {});

    res.redirect("settings");
  });
});
app.post("/delbus", (req, res) => {
  action_done = "Bus Deleted";

  let fullList = { buslist: [] };

  if (req.body.busnum == "clear") {
    let final = JSON.stringify(fullList);

    fs.writeFile("buslist.json", final, (err) => {});
    res.redirect("settings");
    return;
  }

  fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
    let buslist = JSON.parse(jsonString);

    for (i = 0; i < buslist.buslist.length; i++) {
      fullList.buslist.push(buslist.buslist[i]);
    }

    for (i = fullList.buslist.length - 1; i>= 0; i--) {
      if (fullList.buslist[i].number == req.body.busnum)
        fullList.buslist.splice(i, 1);
    }

    let final = JSON.stringify(fullList);

    fs.writeFile("buslist.json", final, (err) => {});
  });
  res.redirect("settings");
});
app.get('/login', (req, res) => {
  if (verifyToken(req, res)) 
    res.render("pages/buslist");
  else res.render('pages/login');
});
app.post("/login-auth", (req, res) => {
  // username is anything on the whitelist
  // the password will be:
  // #admin#dateandtime#
  // dateandtime is formatted (with no extra 0s): day month year 24-hour+6-hours minute
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth()+1;
  let year = date.getFullYear();
  let time = date.getHours()+""+date.getMinutes();
  const pass = "#admin#"+day+""+month+""+year+""+time+"#";

  let redirected = false;
  let username = req.body.username;
  let password = req.body.password;
  var shasum = crypto.createHash('sha1')

  let whitelist = JSON.parse(fs.readFileSync("whitelist.json", "utf-8")).users;
  for (i = 0; i < whitelist.length; i++) {
    if (whitelist[i].toLowerCase() == username.toLowerCase() && pass == password){
      res.cookie('c_email', username, {maxAge: 3600000, httpOnly: true});
      shasum.update(username);
      res.cookie('c_token', shasum.digest('hex'), { maxAge: 3600000, httpOnly: true });
      redirected = true;
      res.redirect('/buslist');
    }
  }
  if (!redirected) res.redirect('/login');
});
app.get("/logout", (req, res) => {
  res.clearCookie('c_email');
  res.clearCookie('c_token');
  res.redirect("/");
});

app.post("/updateStatusTime", (req, res) => {
  let bus = req.body;
  // Validate incoming request
  if (!bus || !bus.number || !bus.newStatus) {
    return res.status(400).json({ error: "Invalid bus data provided" });
  }
  console.log()
  let change = bus.newStatus;
  let time = getTime();

  fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    let buslist;
    try {
      buslist = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Invalid JSON data" });
    }

    let updatingbus = bus.number;
    if (bus.change != 0) {
      updatingbus = bus.change;
    }

    // Update the bus status
    let busFound = false;
    for (let i = 0; i < buslist.buslist.length; i++) {
      let iteratedbus = buslist.buslist[i].number;
      if (buslist.buslist[i].change != null) {
        iteratedbus = buslist.buslist[i].change;
      }

      if (updatingbus == iteratedbus) {
        buslist.buslist[i].status = bus.newStatus;
        buslist.buslist[i].timestamp = "";
        busFound = true;
        break;
      }
    }

    if (!busFound) {
      return res.status(404).json({ error: "Bus not found" });
    }

    let final = JSON.stringify(buslist);

    fs.writeFile("buslist.json", final, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // Brodcast updated data
      
      broadcast(buslist);

      res.status(200).json({ message: "Bus status updated successfully" });
    });
  });
});

// app.post("/updateStatusTime", (req, res) => {
//   let bus = req.body;
//   change = bus.newStatus;

//   fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
//     let buslist = JSON.parse(jsonString);

//     updatingbus = bus.number;
//     if(bus.change != 0){
//       updatingbus = bus.change
//     }

//   for (i = 0; i < buslist.buslist.length; i++) {
//     iteratedbus = buslist.buslist[i].number;
//     if (buslist.buslist[i].change != null){
//         iteratedbus = buslist.buslist[i].change;
//     }
    
//     if (updatingbus == iteratedbus){
//       buslist.buslist[i].status = bus.newStatus;
//       buslist.buslist[i].timestamp = "";
//     }
//   }
    
//     let final = JSON.stringify(buslist);

//     fs.writeFile("buslist.json", final, (err) => {});

//     res.redirect("buslist");
//   });
// });

app.post('/updateChange', express.json(), (req, res) => {
  const givenbus = req.body;
  fs.readFile("buslist.json", "utf-8", (err, jsonString) => {
    if (err) {
      console.error("Error reading buslist.json:", err);
      return res.status(500).json({ message: "Error reading bus list" });
    }
    
    try {
      let busList = JSON.parse(jsonString);
      const bus = givenbus;
      
      for (i = 0; i < busList.buslist.length; i++) {
        if (busList.buslist[i].number == bus.number) {
            if (bus.change == 0) busList.buslist[i].change = null;
            else busList.buslist[i].change = bus.change;
        }
      };


      
    let final = JSON.stringify(busList);

    fs.writeFile("buslist.json", final, (err) => {});

    res.redirect("buslist");

    broadcast(busList);
    } 
    catch (parseError) {
      console.error("Error parsing buslist.json:", parseError);
      return res.status(500).json({ message: "Invalid JSON in bus list" });
    }
    });
  
});

app.get("/getlogs", (req, res) => {
  let status_change = {
    bus: busNum,
    description: action_done,
    timestamp: time,
  };
  bus = Number(req.body.busnum);

  let logsList = { logs: [] };

  fs.readFile("logs.JSON", "utf-8", (err, jsonString) => {
    ``;

    let changeList = JSON.parse(jsonString);

    for (i = 0; i < changeList.changeList.length; i++) {
      logsList.changeList.push(changeList.changeList[i]);
    }

    logsList.changeList.push(status_change);

    logsList.changeList = changeList.changeList.sort((a, b) => {
      if (a.number < b.number) {
        return -1;
      }
    });

    let final = JSON.stringify(logsList);

    fs.writeFile("logs.JSON", final, (err) => {});

    res.redirect("logs");
  });
  let datajson = fs.readFileSync("logs.JSON");
  let data = JSON.parse(datajson);
  res.send(data);
});

//google sign in -----------------------------------------------------

app.post('/auth', (req, res) => {
  const token = req.body.credential;
  const CLIENT_ID = "790808137804-5os0c3tvpvlc3jk5lnid1fla44e9qd0k.apps.googleusercontent.com";
  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(CLIENT_ID);

  async function verify() {
    var shasum = crypto.createHash('sha1');
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd']; 
    console.log(payload.email);
    let whitelist = JSON.parse(fs.readFileSync("whitelist.json", "utf-8")).users;
    for (i = 0; i < whitelist.length; i++) {
      if (whitelist[i].toLowerCase() == payload.email.toLowerCase()){
        res.cookie('c_email', payload.email, {maxAge: 3600000, httpOnly: true});
        shasum.update(payload.email);
        res.cookie('c_token', shasum.digest('hex'), { maxAge: 3600000, httpOnly: true })
        res.redirect('/buslist')
      }
    }
    res.send('<h1>Unauthorized</h1><br><a href="/">Return to Home</a>')

    
  }
  verify().catch(console.error);
});