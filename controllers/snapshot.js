"use strict";
const convert = require("xml-js");
const http = require("../services/http");

/**
 * Get snapshot image from camera and save to buffer, without creating file in disk
 * @returns {Promise<string>}
 */
module.exports.downloadImageToBuffer = async () => {
  const cmd = 'snapPicture2';
  const extraConfig = {
    responseType: 'arraybuffer'
  };
  return http
      .get(cmd, extraConfig)
      .then((response) => Buffer.from(
          response.data, "binary"
      ).toString("base64"));
};

/**
 * Get snapshot image from camera and save it to file (unused method)
 * @returns {Promise<string>}
 */
// module.exports.downloadImage = async () => {
//   console.log("downloadImage function called");
//   const url = `http://${IP}:88/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=${username}&pwd=${password}`;
//   const snapPath = path.join(__dirname, "../public/snapshot.jpg");
//   const writer = Fs.createWriteStream(snapPath);

//   const response = await axios({
//     url,
//     method: "GET",
//     responseType: "stream",
//   });
//   response.data.pipe(writer);
//   return new Promise((resolve, reject) => {
//     writer.on("finish", resolve);
//     writer.on("error", reject);
//   });
// };

/**
 * Get camera motion detection status
 * @returns {Promise<*>}
 */
module.exports.getStatus = async () => {
  const cmd = 'getMotionDetectConfig';
  try {
    const response = await http.get(cmd);
    const xml = response.data;
    const options = { ignoreComment: true, compact: false, alwaysChildren: true };
    const dataParsedToJs = convert.xml2js(xml, options);
    const isEnable = dataParsedToJs.elements[0].elements[1].elements[0].text;
    console.log(`${new Date().toString()}Camera isEnable?: ${isEnable}`);
    return isEnable;
  } catch (error) {
    // Handle axios error
    //console.error(error);
    return { error: true };
  }
};

/**
 * Sets to enabled|disabled camera motion detection
 * @param statusBit {string}, 1 will enable motion detection, 0 will disable
 * @returns {Promise<{ok: boolean}>}
 */
module.exports.setAlarm = async (statusBit) => {
  const cmd = 'setMotionDetectConfig';
  const extraConfig = {
    params: {
      isEnable: statusBit,
      linkage: 15,
      snapInterval: 1,
      sensitivity: 2,
      triggerInterval: 5,
      schedule0: 281474976710655,
      schedule1: 281474976710655,
      schedule2: 281474976710655,
      schedule3: 281474976710655,
      schedule4: 281474976710655,
      schedule5: 281474976710655,
      schedule6: 281474976710655,
      area0: 511,
      area1: 511,
      area2: 511,
      area3: 511,
      area4: 511,
      area5: 511,
      area6: 511,
      area7: 511,
      area8: 511,
      area9: 511
    }

  };
  try {
    await http.get(cmd, extraConfig);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
};

/**
 * Gets camera presets list
 * @returns {Promise<AxiosResponse<any>>}
 */
module.exports.getPTZPresetPointList = async () => {
  const cmd = 'getPTZPresetPointList'
  try {
    return await http.get(cmd);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Sends to camera a 'go to preset position' command
 * @param preset {string}
 * @returns {Promise<AxiosResponse<any>>}
 */
module.exports.ptzGotoPresetPoint = async (preset) => {
  const cmd = 'ptzGotoPresetPoint';
  const extraConfig = {
    params: {
      name: preset
    }

  };
  try {
    return await http.get(cmd, extraConfig);
  } catch (error) {
    console.error(error);
  }
};
