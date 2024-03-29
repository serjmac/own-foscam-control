const Activation = require("../models/activation");
const snapshot = require("./snapshot");
const utils = require("../utils/utils");
const mongoosePaginate = require("mongoose-paginate-v2");
const { getLogParams } = require("../middleware");
var xml2js = require("xml2js");

/**
 * Hello world API test response
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
module.exports.apiHelloWorld = async (req, res) => {
  res.status(200).send({ data: 'hello world!' });
}

/**
 * Remove empty values from object helper
 * @param val
 * @returns {string|*}
 */
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
  const foscamSwitch = {
    switch: "ON",
    time: new Date(),
    userIP: res.locals.userIP,
    userAgent: res.locals.userAgent,
  };
  const newSwitch = new Activation(foscamSwitch);
  await newSwitch.save();
  newImg.imageB64 = await snapshot.downloadImageToBuffer();
  res.render("home", { newImg });
};

module.exports.disableAlarm = async (req, res) => {
  let newImg = { showImage: false };
  await snapshot.setAlarm("0");
  newImg.alarmStatus = await snapshot.getStatus();
  const foscamSwitch = {
    switch: "OFF",
    time: new Date(),
    userIP: res.locals.userIP,
    userAgent: res.locals.userAgent,
  };
  const newSwitch = new Activation(foscamSwitch);
  await newSwitch.save();
  res.render("home", { newImg });
};

module.exports.getLogs = async (req, res) => {
  const paginateParams = getLogParams(req.query);
  await Activation.paginate(paginateParams.condition, paginateParams.paginateOptions)
      .then((logs) => {
        logs.path = paginateParams.path;
        const uptime = process.uptime();
        logs.serverUpTime = utils.formatTime(uptime);
        // if renderView = true, render view, else just return logs data
        res.locals.renderView ?
            res.render("logs", { logs })
            :
            res.status(200).send({  logs });
      })
      .catch((err) => {
        res.send(err);
      });
};

module.exports.getPTZList = async (req, res) => {
  console.log('res.locals.renderView: ', res.locals.renderView);
  const response = await snapshot.getPTZPresetPointList();
  await xml2js
      .parseStringPromise(response.data, { explicitArray: false })
      .then(function (result) {
        //delete empty presets
        const PTZPresetsRemoveEmpty = utils.deleteProps(result.CGI_Result, ["cnt", "result"]);
        const PTZPresets = removeEmptyValues(PTZPresetsRemoveEmpty);
        // if renderView = true, render view, else just return PTZPresets data
        res.locals.renderView ?
        res.render("settings", { PTZPresets })
        :
        res.status(200).send({ PTZPresets });
      })
      .catch(function (err) {
        console.log("error parsing: ", err);
      });
};

module.exports.gotoPreset = async (req, res) => {
  const { preset } = req.params;
  await snapshot.ptzGotoPresetPoint(preset);
  // if renderView = true, render view, else just return PTZPresets data
  res.locals.renderView ?
      res.render("ptzwait", { preset })
      :
      res.status(200).send({preset});
};

// todo refactor and move away foscamSwitch log registry saves

module.exports.apiEnableAlarm = async (req, res) => {
  // let newImg = { showImage: true };
  await snapshot.setAlarm("1");
  const foscamSwitch = {
    switch: "ON",
    time: new Date(),
    userIP: res.locals.userIP,
    userAgent: res.locals.userAgent,
  };
  const newSwitch = new Activation(foscamSwitch);
  await newSwitch.save();
  let response = {};
  response.cameraAction = 'Enable Alarm command sent';
  response.alarmStatus = await snapshot.getStatus() === "1" ? 'Enabled' : 'error enabling alarm !!';
  response.showImage = true;
  console.log(response);
  res.status(200).send({ response });
};

module.exports.apiDisableAlarm = async (req, res) => {
  // let newImg = { showImage: false };
  await snapshot.setAlarm("0");
  const foscamSwitch = {
    switch: "OFF",
    time: new Date(),
    userIP: res.locals.userIP,
    userAgent: res.locals.userAgent,
  };
  const newSwitch = new Activation(foscamSwitch);
  await newSwitch.save();
  let response = {};
  response.cameraAction = 'Disable Alarm command sent';
  response.alarmStatus = await snapshot.getStatus() === '0' ? 'Disabled' : 'error disabling alarm !!';
  response.showImage = false;
  res.status(200).send({ response });
};

module.exports.apiCheckStatus = async (req, res) => {
  let response = {};
  const alarmStatus = await snapshot.getStatus();
  if ( alarmStatus === '1') {
    response.alarmStatus = 'Enabled';
  } else if ( alarmStatus === '0') {
    response.alarmStatus = 'Disabled';
  } else {
    response.alarmStatus = 'error getting camera status !!';
  }
  response.showImage = true;
  res.status(200).send({ response });
};

module.exports.apiGetImg = async (req, res) => {
  let newImg = { showImage: true };
  newImg.imageB64 = await snapshot.downloadImageToBuffer();
  res.status(200).send({ newImg });
};
