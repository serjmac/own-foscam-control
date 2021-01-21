if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  //you need to create a file called ".env" in this app root folder and set valid credentials to access your Foscam Camera
  //.env content keys needed:
  //SNAP_US=yourFoscamRemoteUser
  //SNAP_PWD=yourFoscamRemotePassword
  //SNAP_IP=yourFoscamIP
}
//etc/rc.local launch script:
//su - yourUser -c "NODE_ENV=development /usr/local/bin/forever start -w --watchDirectory=/home/yourUser/ownfoscam01 --watchIgnore --sourceDir /home/yourUser/ownfoscam01 --workingDir /home/yourUser/ownfoscam01 app.js"
//you need to place a .foreverignore file in the app folder with valid ignore pattern, example:
// node_modules
// public
// *ignore*
// **.log**
// **.ejs**

const express = require("express");
const ejsMate = require("ejs-mate");
const catchAsync = require("./utils/catchAsync"); //async wraper
const path = require("path");
const snapshot = require("./controllers/snapshot");
const port = 3000;
const app = express();
let newImg = {
  status: true,
  url: "snapshot.jpg", //snapshot will searched in static public folder
};

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

//middleware to send userIP and userAgent to views
app.use((req, res, next) => {
  //userIP and UserAgent will be available in all views
  res.locals.userIP = req.ip.replace("::ffff:", "");
  res.locals.userAgent = req.get("user-agent");
  next();
});

function formatTime(seconds) {
  function pad(s) {
    return (s < 10 ? "0" : "") + s;
  }
  var hours = Math.floor(seconds / (60 * 60));
  var minutes = Math.floor((seconds % (60 * 60)) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

app.get(
  "/enable",
  catchAsync(async (req, res) => {
    await snapshot.downloadImage();
    newImg.showImage = true;
    await snapshot.activateAlarm();
    newImg.alarmStatus = await snapshot.getStatus();
    const uptime = process.uptime();
    newImg.serverUpTime = formatTime(uptime);
    res.render("home", { newImg });
  })
);

app.get(
  "/disable",
  catchAsync(async (req, res) => {
    newImg.showImage = false;
    await snapshot.disableAlarm();
    newImg.alarmStatus = await snapshot.getStatus();
    const uptime = process.uptime();
    newImg.serverUpTime = formatTime(uptime);
    res.render("home", { newImg });
  })
);

app.get(
  "/",
  catchAsync(async (req, res) => {
    await snapshot.downloadImage(); //enable or disable snapshot on root route
    newImg.showImage = true; //enable or disable snapshot on root route
    newImg.alarmStatus = await snapshot.getStatus();
    const uptime = process.uptime();
    newImg.serverUpTime = formatTime(uptime);
    res.render("home", { newImg });
  })
);

app.listen(port, () => {
  console.log(`server is up and listening on port ${port}`);
});
