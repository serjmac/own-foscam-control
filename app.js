if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
/**
 * PLEASE NOTE !!
 * you need to create a file called ".env" in this app root folder and set valid credentials to access your Foscam Camera
 * .env content keys needed:
 * SNAP_US=yourFoscamRemoteUser
 * SNAP_PWD=yourFoscamRemotePassword
 * SNAP_IP=yourFoscamIP
 * DB_URL=MongoDB URL path, example in Atlas Cloud: mongodb+srv://usr:<password>@cluster0.xxxx.mongodb.net/<dbname>?retryWrites=true&w=majority, example locally: mongodb://localhost:27017/foscam
 * SNAPSHOT_LIFE_CHECK=integer, number of days before snapshots and recording are discarded, not stored into DB and deleted from filesystem
 * FTP_PATH=./ftp, path where 'snap' and 'record' folders are contained, can be local or mounted). Default is './data/ftp_data' in project folder
 * LOCALHOST=localhostIP, optional, if you user docker_compose file to start the app, the ftp container needs the host IP to route the FTP client access

 * Ubuntu forever script launcher
 * su - ubuntu -c "NODE_ENV=development /usr/local/bin/forever start -w --watchDirectory=/home/ubuntu/ownfoscam --watchIgnore --sourceDir /home/ubuntu/ownfoscam --workingDir /home/ubuntu/ownfoscam -e /home/ubuntu/.forever/ownfoscam_error.log -l /home/ubuntu/.forever/ownfoscam.log --append app.js"
 * you should to place a .foreverignore file in the app folder with valid ignore pattern, to avoid unwanted app restarts on file changes on dynamic folders, for example:
 *  public
 *  ftp
 */

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const path = require("path");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync"); //async wraper
const { validateGet, validatePost, delayer } = require("./middleware");
const chokidar = require("chokidar");
const switching = require("./controllers/switching");
const fileWatcher = require("./controllers/fileWatcher");
const carousel = require("./controllers/carousel");
const port = 3000;
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/foscam";
const ftpPath = process.env.FTP_PATH;
const { deleteOldSnapshots } = require("./controllers/schedule");

console.log(process.platform);

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log(" database connected OK");
  // initialize file watcherss
  // todo move file tracking modules to separate app
  /**
   * file watcher module, to track addition or deletion of motion detection snapshots/videos
   * if access to ftpPath is not reliable, watcher should be disabled
   * @type {FSWatcher}
   */
  const watcher = chokidar.watch(ftpPath, { ignored: /(^|[\/\\])\../, persistent: true, usePolling: true });
  watcher.on("add", catchAsync(fileWatcher.addSnapToDB)).on("unlink", catchAsync(fileWatcher.deleteSnapFromDB));
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");

// only for REPL app execution
// const __dirname = path.resolve(path.dirname(""));
//
app.set("views", path.join(__dirname, "/views"));

app.use(express.urlencoded({ extended: true }));
// assets serve
app.use(express.static(path.join(__dirname, "public")));

// FTP path serve, if path contains ":", will serve absolute path, else will serve relative to app folder
// absolute paths ie network mapped drive Z:/ for FTP folder
// relative path ie local at appFolder/data/ftp_data for FTP folder
if (ftpPath.includes(":")) {
  console.log("serving absolute path: ", ftpPath);
  app.use(express.static(path.join(ftpPath)));
} else {
  console.log("serving relative path: ", ftpPath);
  app.use(express.static(path.join(__dirname, ftpPath)));
}

/**
 * CORS settings, needs cors available in node_modules.
 * Accept requests coming from different origin IP
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

/**
 * Global middleware variables
 * userIP
 * userAgent
 * renderView, checking if url contains 'api', allowing methods to know whether to render view as response or just return data as response
 */
app.use((req, res, next) => {
  res.locals.userIP = req.ip.replace("::ffff:", "");
  res.locals.userAgent = req.get("user-agent");
  res.locals.renderView = !req.url.includes("/api/");
  next();
});

// todo refactor and group endpoints
/**
 * Routes for API endpoints
 */
app.get("/api/helloworld/delayed", validateGet, delayer, catchAsync(switching.apiHelloWorld));
app.get("/api/helloworld", validateGet, catchAsync(switching.apiHelloWorld));
app.get("/api/enable", catchAsync(switching.apiEnableAlarm));
app.get("/api/disable", catchAsync(switching.apiDisableAlarm));
app.get("/api/getimg", catchAsync(switching.apiGetImg));
app.get("/api/checkstatus", catchAsync(switching.apiCheckStatus));
app.get("/api/getpresetlist", catchAsync(switching.getPTZList));
app.get("/api/gotopreset/:preset", catchAsync(switching.gotoPreset));
app.get("/api/logs", validateGet, catchAsync(switching.getLogs));
app.get("/api/carousel", catchAsync(carousel.searchSnapshots));
app.post("/api/carouselSearch", validatePost, catchAsync(carousel.searchSnapshots));
/**
 * Routes for integrated ejs engined rendered view endpoints
 */
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
