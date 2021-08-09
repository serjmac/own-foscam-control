const Ftp = require("../models/ftp");

module.exports.searchDBSnapshots = async (startSearchDate, endSearchDate) => {
    const response = await Ftp.find({ fileTime: { $gte: startSearchDate, $lt: endSearchDate } }).sort({ fileTime: -1 });
    let files = { jpgs: [], mkvs: [] };
    response.forEach((e) => {
        if (e.path.includes("jpg")) {
            files.jpgs.push(e);
        } else {
            files.mkvs.push(e);
        }
    });
    return files;
};
