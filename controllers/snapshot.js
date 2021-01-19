//nodeJS script to get snapshot from Foscam camera
//thanks to : https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
//thanks to: https://nodejs.org/en/knowledge/advanced/streams/how-to-use-fs-create-write-stream/
"use strict";

const Fs = require("fs");
const path = require("path");
const axios = require("axios");
const convert = require("xml-js");

const username = process.env.SNAP_USR;
const password = process.env.SNAP_PWD;
const IP = process.env.SNAP_IP;

module.exports.downloadImage = async () => {
  console.log("downloadImage function called");

  const url = `http://${IP}:88/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=${username}&pwd=${password}`;
  const snapPath = path.join(__dirname, "../public/snapshot.jpg");
  const writer = Fs.createWriteStream(snapPath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

module.exports.getStatus = async () => {
  const URL = `http://${IP}:88/cgi-bin/CGIProxy.fcgi?cmd=getMotionDetectConfig&usr=${username}&pwd=${password}`;
  try {
    const response = await axios.get(URL);
    const xml = response.data;
    const options = { ignoreComment: true, compact: false, alwaysChildren: true };
    const dataParsedToJs = convert.xml2js(xml, options);
    const isEnable = dataParsedToJs.elements[0].elements[1].elements[0].text;
    console.log(`Camera isEnable?: ${isEnable}`);
    return isEnable;
  } catch (error) {
    console.error(error);
  }
};

module.exports.activateAlarm = async () => {
  const URL = `http://${IP}:88/cgi-bin/CGIProxy.fcgi?cmd=setMotionDetectConfig&isEnable=1&linkage=15&snapInterval=1&sensitivity=2&triggerInterval=5&schedule0=281474976710655&schedule1=281474976710655&schedule2=281474976710655&schedule3=281474976710655&schedule4=281474976710655&schedule5=281474976710655&schedule6=281474976710655&area0=511&area1=511&area2=511&area3=511&area4=511&area5=511&area6=511&area7=511&area8=511&area9=511&usr=${username}&pwd=${password}`;
  try {
    await axios.get(URL);
  } catch (error) {
    console.error(error);
  }
};

module.exports.disableAlarm = async () => {
  const URL = `http://${IP}:88/cgi-bin/CGIProxy.fcgi?cmd=setMotionDetectConfig&isEnable=0&linkage=15&snapInterval=1&sensitivity=2&triggerInterval=5&schedule0=281474976710655&schedule1=281474976710655&schedule2=281474976710655&schedule3=281474976710655&schedule4=281474976710655&schedule5=281474976710655&schedule6=281474976710655&area0=511&area1=511&area2=511&area3=511&area4=511&area5=511&area6=511&area7=511&area8=511&area9=511&usr=${username}&pwd=${password}`;
  try {
    await axios.get(URL);
  } catch (error) {
    console.error(error);
  }
};
