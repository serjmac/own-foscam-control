if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  //you need to create a file called ".env" in this app root folder and set valid credentials to access your Foscam Camera
  //.env content keys needed:
  //SNAP_US=yourFoscamRemoteUser
  //SNAP_PWD=yourFoscamRemotePassword
  //SNAP_IP=yourFoscamIP
}

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

app.get(
  "/enable",
  catchAsync(async (req, res) => {
    await snapshot.downloadImage();
    newImg.status = true;
    await snapshot.activateAlarm();
    const status = await snapshot.getStatus();
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.get(
  "/disable",
  catchAsync(async (req, res) => {
    newImg.status = false;
    await snapshot.disableAlarm();
    const status = await snapshot.getStatus();
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.get(
  "/",
  catchAsync(async (req, res) => {
    //newImg.status = false;
    const status = await snapshot.getStatus();
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.listen(port, () => {
  console.log(`server is up and listening on port ${port}`);
});
