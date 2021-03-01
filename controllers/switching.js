const snapshot = require("./snapshot");
const utils = require("../utils/utils");
const { getLogParams } = require("../middleware");
var xml2js = require("xml2js");

module.exports.checkStatus = async (req, res) => {
  let newImg = { showImage: true };
  newImg.alarmStatus = await snapshot.getStatus();
  console.log("end of checkStatus, now rendering Home with fresh image");
  newImg.imageB64 = await snapshot.downloadImageToBuffer();
  res.render("home", { newImg });
};

module.exports.enableAlarm = async (req, res) => {
  let newImg = { showImage: true };
  await snapshot.setAlarm("1");
  newImg.alarmStatus = await snapshot.getStatus();
  const foscamSwitch = ["ON", new Date(), res.locals.userIP, res.locals.userAgent];
  const sql = "INSERT INTO activations (switch, created_at, user_ip, user_agent) VALUES (?, ?, ?, ?)";
  try {
    await req.app.locals.pool.query(sql, [...foscamSwitch]);
  } catch (error) {
    console.error(error);
  }
  newImg.imageB64 = await snapshot.downloadImageToBuffer();
  res.render("home", { newImg });
};

module.exports.disableAlarm = async (req, res) => {
  let newImg = { showImage: false };
  await snapshot.setAlarm("0");
  newImg.alarmStatus = await snapshot.getStatus();
  const foscamSwitch = ["OFF", new Date(), res.locals.userIP, res.locals.userAgent];
  const sql = "INSERT INTO activations (switch, created_at, user_ip, user_agent) VALUES (?, ?, ?, ?)";
  try {
    await req.app.locals.pool.query(sql, [...foscamSwitch]);
  } catch (error) {
    console.error(error);
  }
  res.render("home", { newImg });
};

module.exports.getLogs = async (req, res) => {
  console.log("getlogs route hit");
  const paginateParams = getLogParams(req.query);
  let logs = {};
  try {
    let sql = `SELECT * FROM activations ${paginateParams.condition} ORDER BY created_at DESC LIMIT ${paginateParams.offset},${paginateParams.limit}`;
    await req.app.locals.pool.query(sql).then((results) => {
      logs.docs = results[0];
      logs.path = paginateParams.path;
      logs.page = paginateParams.page + 1;
      logs.limit = paginateParams.limit;
    });
    sql = `SELECT COUNT(*) AS totalDocs FROM activations ${paginateParams.condition}`;
    await req.app.locals.pool.query(sql).then((results) => {
      logs.totalDocs = results[0][0].totalDocs;
      logs.totalPages = Math.ceil(logs.totalDocs / logs.limit);
      const uptime = process.uptime();
      logs.serverUpTime = utils.formatTime(uptime);
      res.render("logs", { logs });
    });
  } catch (error) {
    console.error(error);
  }
};

function removeEmptyValues(val) {
  if (Array.isArray(val)) {
    return val.reduce((res, cur) => {
      if (cur !== "") {
        return [...res, removeEmptyValues(cur)];
      }
      return res;
    }, []);
  } else if (Object.prototype.toString.call(val) === "[object Object]") {
    return Object.keys(val).reduce((res, key) => {
      if (val[key] !== "") {
        return Object.assign({}, res, { [key]: removeEmptyValues(val[key]) });
      }
      return res;
    }, undefined);
  }
  return val;
}

module.exports.getPTZList = async (req, res) => {
  const response = await snapshot.getPTZPresetPointList();
  await xml2js
    .parseStringPromise(response.data, { explicitArray: false })
    .then(function (result) {
      //delete empty presets
      const PTZPresetsRemoveEmpty = utils.deleteProps(result.CGI_Result, ["cnt", "result"]);
      const PTZPresets = removeEmptyValues(PTZPresetsRemoveEmpty);
      res.render("settings", { PTZPresets });
    })
    .catch(function (err) {
      console.log("error parsing: ", err);
    });
};

module.exports.gotoPreset = async (req, res) => {
  const { preset } = req.params;
  await snapshot.ptzGotoPresetPoint(preset);
  res.render("ptzwait", { preset });
};
