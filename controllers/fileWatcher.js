const moment = require("moment");
const Ftp = require("../models/ftp");
const path = require("path");
const ftpPath = process.env.FTP_PATH;
const fs = require("fs");
const snapShotLifeCheck = process.env.SNAPSHOT_LIFE_CHECK || 30; //days

const addToDb = async (query, update) => {
  try {
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    return await Ftp.findOneAndUpdate(query, update, options);
  } catch (e) {
    console.log("error adding filePath to database: ", e);
  }
};

/**
 * Checks file modified attribute, then decide if it should be stored (continue) or deleted (discarded)
 * @param file {string}, relative path to file
 * @returns {string} discarded|continue
 */
function checkModified(file) {
  const stats = fs.statSync(file);
  const now = new Date();
  const fileCreatedAt = stats.mtime;
  console.log("now: ", now, ",  file stats.mtime: ", fileCreatedAt);
  const diffTime = now - fileCreatedAt;
  if (diffTime > snapShotLifeCheck * 86400000) {
    console.log(
      `${file} discarded because it is too dated (${
        Math.round((diffTime / 86400000 + Number.EPSILON) * 100) / 100
      } days, limit is set to ${snapShotLifeCheck})`
    );
    return "discarded";
  } else {
    console.log(
      `${file} is to be stored in DB because it is considered recent (${
        Math.round((diffTime / 86400000 + Number.EPSILON) * 100) / 100
      } days, limit is set to ${snapShotLifeCheck})`
    );
    return "continue";
  }
}

/**
 * Delete file for given path from filesystem and from database
 * @param path {string}
 * @returns {Promise<void>}
 */
module.exports.deleteFromFsAndDB = async (path) => {
  console.log("deleteFromFsAndDB path", path);
  const FsPath = ftpPath + path;
  console.log("deleting file from filesystem path: ", FsPath);
  fs.unlink(FsPath, (err) => {
    if (err) {
      console.error(err);
    }
    // delete file path from database
    this.deleteSnapFromDB(path);
  });
};

/**
 * Delete a given path from database
 * @param filePath
 * @returns {Promise<void>}
 */
module.exports.deleteSnapFromDB = async (filePath) => {
  console.log(filePath, "deleted event...");
  const normalizedPath = filePath.split(path.sep).join(path.posix.sep).replace(ftpPath, "");
  const query = { path: normalizedPath };
  const response = await Ftp.findOneAndDelete(query);
  if (response !== null) {
    normalizedPath.includes("jpg")
      ? console.log("Snapshot path deleted from Database:", response.path)
      : console.log("Record path deleted from Database:", response.path);
  }
};

/**
 * Save to database the file for given path, checking if is a image or a recording, and normalizing relative paths
 * @param filePath {string}
 * @returns {Promise<void>}
 */
module.exports.addSnapToDB = async (filePath) => {
  console.log(filePath, "added event");
  const checkAge = await checkModified(filePath);
  //preparing relative path string. Will be relative to ftpPath constant
  const normalizedPath = filePath.split(path.sep).join(path.posix.sep).replace(ftpPath, "");
  if (checkAge === "continue") {
    if (filePath.includes("jpg")) {
      //extracting timestamp from filename, convert to dateString with moment and parse to ISODate object with new Date()
      // const snapDate = new Date(moment(normalizedPath.replace(/\/snap\/MDAlarm_/, "").replace(/.jpg/, ""), "YYYYMMDD-hhmmss"));
      //alternative to extract timestamp from file attributes
      const snapDate = fs.statSync(filePath).mtime;
      console.log("snapDate from fs: ", snapDate);
      const query = { path: normalizedPath };
      const update = { fileTime: snapDate, fileType: "jpg" };
      const response = await addToDb(query, update);
      console.log("New snapshot path saved(if not already present) to Database:", response.path);
    }
    //if (normalizedPath.includes("mkv")) {
    if (filePath.includes("mkv")) {
      const mkvDate = fs.statSync(filePath).mtime;
      console.log("mkvDate from fs:", mkvDate);
      const query = { path: normalizedPath };
      const update = { fileTime: mkvDate, fileType: "mkv" };
      const response = await addToDb(query, update);
      console.log("New video path saved(if not already present) to Database:", response.path);
    }
    // if discarded because it is old, delete it
  } else {
    // const normalizedPath = filePath.split(path.sep).join(path.posix.sep).replace(/ftp\//, "");
    // this.deleteFromFsAndDB(normalizedPath);
    this.deleteFromFsAndDB(normalizedPath);
  }
};

/**
 * Flush database and restart method (for linux platform running app with 'forever' process)
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
module.exports.flushResyncDB = async (req, res) => {
  console.log("flushDB route hit");
  const response = await Ftp.deleteMany({});
  const exec = require("child_process").exec;
  //CMD restart node app. View will only render access to this code if process.platform === "linux"
  const cmdRestart = "forever restart app.js";
  await exec(cmdRestart, function (error, stdout, stderr) {
    if (stderr || error) {
      console.log({
        success: false,
        error: stderr || error,
        command: cmdRestart,
        result: null,
      });
    } else {
      console.log({
        success: true,
        error: null,
        command: cmdRestart,
        result: stdout,
      });
    }
  });
  res.render("restartwait");
};
