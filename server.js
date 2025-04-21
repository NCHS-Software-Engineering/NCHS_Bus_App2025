// Load Node modules
var express = require("express");
const ejs = require("ejs");

// Initialise Express
var app = express();
// Render static files
app.use(express.static("public"));
// Set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

// WEBSOCKET
const http = require('http');
const server = http.createServer(app);

const port = 8080;
server.listen(port, /*"0.0.0.0",*/ () => {
  console.log(`Server running on http://localhost:${port}`);
});

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const admin = require("firebase-admin");
// Load Firebase service account credentials
const serviceAccount = require("./serviceAccountKey.json"); // Download from Firebase Console
const { Http2ServerRequest } = require("http2");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const messaging = admin.messaging();
app.use(express.static(__dirname));

const webPush = require("web-push");
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
//mongoDB
// const mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://bus_app:ItnLzT0qNasUrO7T@cluster0.mxygvad.mongodb.net/',{
//   useNewUrlParser:true,
//   useUndifinedTopology:true
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// const sub = mongoose.model('Subscriptions', new mongoose.Schema({
//   subscription: Array,

// }))


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

//creats websocket server
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const privateKey = fs.readFileSync('./BusApp_947RQLGJMG.p8');
const keyID= process.env.IOS_KEY_ID;
const teamID = process.env.IOS_TEAM_ID;
//IOS NOTIFICATIONS
const apn = require("apn");
const options = {
    token: {
      key: privateKey, 
      keyId: keyID,
      teamId: teamID
    },
    production: false
}
const apnProvider = new apn.Provider(options);

function sendNotificationToiOS(title,body){
  const tokens = JSON.parse(fs.readFileSync("ios-push-tokens.json", "utf8") || "[]");

  tokens.forEach(deviceToken => {
    let notification = new apn.Notification();
    notification.alert = { title, body };
    notification.sound = "ping.aiff";
    notification.topic = "web.com.yourdomain.push";
    
    apnProvider.send(notification, deviceToken).then(result =>{
      console.log("Sent: ", result.sent.length);
      console.log("Failed:", result.failed.length, result.failed);
    });
  });
}

app.post("/register-ios-token", (req, res) => {
  const { token } = req.body;
  if (!token) {
      return res.status(400).json({ error: "Token is required" });
  }

  const tokens = JSON.parse(fs.readFileSync("ios-push-tokens.json", "utf8") || "[]");
  if (!tokens.includes(token)) {
      tokens.push(token);
      fs.writeFileSync("ios-push-tokens.json", JSON.stringify(tokens));
  }

  res.status(200).json({ message: "iOS Token Registered" });
});

// PUSH STUFF -----------------------------------


if (!vapidPublicKey || !vapidPrivateKey) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "environment variables. You can use the following ones:"
  );
  console.log(webPush.generateVAPIDKeys());
  return;
}
// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
  "https://bustest.redhawks.us/",
  vapidPublicKey,
  vapidPrivateKey
);

app.get('/vapidPublicKey', function (req, res) {
  res.send(vapidPublicKey);
});

app.post("/register", (req, res) => {
  const subscription = req.body.subscription;
  const userId = req.cookies.c_email;
  storeSubscription(subscription, userId);
  res.sendStatus(201);
});


function storeSubscription(subscription, userId) {
  if (!subscription || !subscription.endpoint) {
    console.error("Invalid subscription received:", subscription);
    return;
  }

  try {
    const subscriptions = fs.existsSync("subscriptions.json")
      ? JSON.parse(fs.readFileSync("subscriptions.json", "utf8"))
      : [];

    const existingSubscription = subscriptions.find((sub) => sub.subscription.endpoint === subscription.endpoint);

    if (!existingSubscription) {
      subscriptions.push({ subscription, userId });
      fs.writeFileSync("subscriptions.json", JSON.stringify(subscriptions, null, 2));
      console.log("New subscription added:", subscription.endpoint);
    } else {
      console.log("Subscription already exists for:", subscription.endpoint);
    }
  } catch (error) {
    console.error("Error storing subscription:", error);
  }
}


app.post("/send-notification", async (req, res) => {
  const { title, body } = req.body.notification;
  const subscriptions = req.body.subscription; // Get stored subscriptions

  const payload = JSON.stringify({ notification: { title, body } });

  webPush.sendNotification(subscriptions, payload)
      .then(() => console.log("Notification sent to:", subscriptions.endpoint))
      .catch(err => console.error("Error sending push notification:", err));
 

  res.status(200).json({ message: "Notifications sent" });
});



//Firebase stuff -------------------------------------------------------


app.get('/firebase-app.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/firebase/firebase-app.js');
});

app.get('/firebase-messaging.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/firebase/firebase-messaging.js');
});

app.get('/firebase-messaging-sw.js', (req,res)=>{
  res.sendFile(__dirname + '/firebase-messaging-sw.js');
});


// retrives buslist
app.get("/getbus", (req, res) => {
  let datajson = fs.readFileSync("buslist.json");
  let data = JSON.parse(datajson);
  res.send(data);
});

//updates the buslist.json file after being called in buslist.js
app.post("/updateStatus", (req, res) => {
  let bus = req.body;
  // Validate incoming request
  if (!bus || !bus.number || !bus.newStatus) {
    return res.status(400).json({ error: "Invalid bus data provided" });
  }
  //console.log()
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

      let broadcastData = {
        number: bus.number,
        newStatus: bus.newStatus,
        change: bus.change
      };
      // Brodcast updated data using the websockets
      broadcast(broadcastData);

      //sendNotification(broadcastData);

      res.status(200).json({ message: "Bus status updated successfully" });
    });
    
  });
});

app.post('/check-subscription', (req,res) =>{
  const subscription = req.body.subscription;
  const subscriptions = getSubscriptions();
  const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
  res.json({ exists });
})



function sendNotification(data) {
  if (isIOSUser(data)) {
    sendNotificationToiOS("Bus Update", `Bus #${data.number} has ${data.newStatus}`);
  } else {
    const subscriptions = getSubscriptions(); // Get all stored subscriptions
    let validSubscriptions = [];
    console.log(data.number);
    console.log(data.newStatus);
    console.log(data.change);
    if(data.number && data.newStatus && data.change == 0){//doesnt send noti for departed->not arrived
      subscriptions.forEach((sub) => {
        webPush
          .sendNotification(sub.subscription, JSON.stringify({
            notification: {
              title: "Bus Update",
              body: `Bus #${data.number} has ${data.newStatus}`,
            }
          }))
          .then(() => {
            console.log(`✅Notification sent to ${sub.subscription.endpoint}`);
            validSubscriptions.push(sub); // Keep valid subscriptions
          })
          .catch((err) => {
            console.error("Error sending push notification:", err);
            if (err.statusCode === 410) {
              console.log("Removing expired subscription:", sub.subscription.endpoint);
            } else {
              validSubscriptions.push(sub); // Keep non-expired subscriptions
            }
          })
          .finally(() => {
            fs.writeFileSync("subscriptions.json", JSON.stringify(validSubscriptions, null, 2));
          });
      });
    }
    else if(data.number && data.newStatus){
      subscriptions.forEach((sub) => {
        webPush
          .sendNotification(sub.subscription, JSON.stringify({
            notification: {
              title: "Bus Change",
              body: `Bus #${data.number} has been changed to #${data.change}`,
            }
          }))
          .then(() => {
            console.log(`✅Notification sent to ${sub.subscription.endpoint}`);
            validSubscriptions.push(sub); // Keep valid subscriptions
          })
          .catch((err) => {
            console.error("Error sending push notification:", err);
            if (err.statusCode === 410) {
              console.log("Removing expired subscription:", sub.subscription.endpoint);
            } else {
              validSubscriptions.push(sub); // Keep non-expired subscriptions
            }
          })
          .finally(() => {
            fs.writeFileSync("subscriptions.json", JSON.stringify(validSubscriptions, null, 2));
          });
      });
    }
}
}

function isIOSUser(data) {
  return data.device === "ios"; // Modify based on how you track users
}



function getSubscriptions() {
  // Read subscriptions from a file or database
  // For example, you can read from a file named 'subscriptions.json'
  const subscriptions = fs.readFileSync("subscriptions.json");
  return JSON.parse(subscriptions);
}

//broadcasts the
function broadcast(data) {
  console.log(data.newStatus)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        number: data.number,
        status: data.newStatus,
        change: data.change
      })); // Send updated data as stringified JSON!
    }
  });

  sendNotification(data);
}

// WebSocket handling




// resets the buslist.json file
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

// All of these gets are called only if an authorized user calls them
app.get("/reset", (req, res) => {
  //if (verifyToken(req, res)){
    reset(true);
    return res.render("pages/buslist");
  //}
  //else{
   // return res.redirect('/');
  //}
});

app.get("/buslist", function (req, res) {
 //if (verifyToken(req, res)) {
    return res.render("pages/buslist");
 // } else {
   //return res.redirect("/");
 //}
});


app.get("/buschanges", function (req, res) {
  //if (verifyToken(req, res)) 
  res.render("pages/buschanges");
  //else res.redirect('/');
});

app.get("/settings", function (req, res) {
  //if (verifyToken(req, res))
  res.render("pages/settings");
  //else res.redirect('/');
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
    let broadcastData = {
      number: bus.number,
      newStatus: bus.newStatus,
      change: bus.change
    };
    console.log("givenbus status:" + givenbus.newStatus);
    broadcast(broadcastData);
    } 
    catch (parseError) {
      console.error("Error parsing buslist.json:", parseError);
      return res.status(500).json({ message: "Invalid JSON in bus list" });
    }
    });

    //sendNotification(req.body);
  
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
    //console.log(payload.email);
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