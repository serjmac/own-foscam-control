const axios = require("axios");
const username = process.env.SNAP_USR;
const password = process.env.SNAP_PWD;
const IP = process.env.SNAP_IP;
const port = process.env.SNAP_PORT || 88;
const axiosTimeout = process.env.SNAP_TIMEOUT || 2500;

const baseUrl = `http://${IP}:${port}/cgi-bin/CGIProxy.fcgi`;

module.exports.get = async(cmd, extraConfig = null, ) => {
    let config = {};
     config.params = {
        cmd: cmd,
        usr: username,
        pwd: password,
    };
    if (extraConfig && extraConfig.params) {
        config.params = { ...config.params, ...extraConfig.params };
    }

    if (extraConfig && extraConfig.responseType) {
        config.responseType = extraConfig.responseType;
    }

    return await axios.get(baseUrl, {
        ...config,
        timeout: axiosTimeout
    });
}



