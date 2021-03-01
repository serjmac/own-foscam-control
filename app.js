if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const ejsMate = require("ejs-mate");
const chokidar = require("chokidar");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
const checkInitDB = require("./utils/checkInitDB.js");
const switching = require("./controllers/switching");
const carousel = require("./controllers/carousel");
const { validateGet, validatePost } = require("./middleware");
const fileWatcher = require("./controllers/fileWatcher");
const ftpPath = process.env.FTP_PATH || "./ftp";
const mysql = require("mysql2/promise");

const dbConfig = require("./config/dbPool");
const port = 3001;

//unique mysql connection pool to be shared via app.locals
app.locals.pool = mysql.createPool(dbConfig);
/*
initDB will create database and tables if they're not present
*/
console.log("launching checkInitDB()");
checkInitDB();

//parse requests of content-type - application/json
//app.use(bodyParser.json());

//parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, ftpPath)));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "/views"));

//middleware to send userIP and userAgent to any view template
app.use((req, res, next) => {
  res.locals.userIP = req.ip.replace("::ffff:", "");
  res.locals.userAgent = req.get("user-agent");
  next();
});

//watcher module to track addition or deletion of motion detetection snapshots
//if access to ftpPath is not reliable, watcher should be disabled
const watcher = chokidar.watch(ftpPath, { ignored: /(^|[\/\\])\../, persistent: true, usePolling: true });
//passing pool as in absence of request, req.app.locals will not be available in fileWatcher modules
watcher
  .on("add", (path, stats, pool = app.locals.pool) => {
    catchAsync(fileWatcher.addSnapToDB(path, pool));
  })
  .on("unlink", (path, pool = app.locals.pool) => {
    catchAsync(fileWatcher.deleteSnapFromDB(path, pool));
  });

//routes
app.post("/searchByDate", validatePost, async (req, res) => {
  res.redirect(`/logs?date=${req.body.dateSearchFromForm}`);
});

app.get("/logs", validateGet, catchAsync(switching.getLogs));

app.get("/enable", catchAsync(switching.enableAlarm));

app.get("/disable", catchAsync(switching.disableAlarm));

app.get("/getpresetlist", catchAsync(switching.getPTZList));

app.get("/gotopreset/:preset", catchAsync(switching.gotoPreset));

app.get("/carousel", catchAsync(carousel.searchSnapshots));

app.post("/carouselSearch", validatePost, catchAsync(carousel.searchSnapshots));

app.get("/flushDB", catchAsync(fileWatcher.flushResyncDB));

app.get("/close", (req, res) => {
  console.log("close route hit");
  res.send("<script>window.close();</script>");
});

app.get("/", catchAsync(switching.checkStatus));

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found. That is not a valid URL", 404));
});

app.use((err, req, res, next) => {
  console.log("error handler hit:", err);
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(port, () => {
  console.log(`server is up and listening on port ${port}`);
});
