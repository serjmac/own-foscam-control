if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const ejsMate = require("ejs-mate");
const catchAsync = require("./utils/catchAsync");
const path = require("path");
const snapshot = require("./controllers/snapshot");
const port = 3000;
const app = express();
let newImg = {
  status: true,
  url: "snapshot.jpg",
};

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get(
  "/enable",
  catchAsync(async (req, res) => {
    console.log("enable route");
    await snapshot.downloadImage();
    newImg.status = true;
    console.log(newImg);
    await snapshot.activateAlarm();
    const status = await snapshot.getStatus();
    console.log(`El estado es: ${status}`);
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.get(
  "/disable",
  catchAsync(async (req, res) => {
    console.log("disable routing");
    newImg.status = false;
    await snapshot.disableAlarm();
    const status = await snapshot.getStatus();
    console.log(`el estado es: ${status}`);
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.get(
  "/",
  catchAsync(async (req, res) => {
    newImg.status = false;
    console.log(newImg);
    const status = await snapshot.getStatus();
    console.log(`el estado es: ${status}`);
    newImg.alarmStatus = status;
    res.render("home", { newImg });
  })
);

app.listen(port, () => {
  console.log(`server is up and listening on port ${port} yaii`);
});
