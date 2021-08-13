const Ftp = require("../models/ftp");

/**
 * Search results from given period
 * @param startSearchDate {Object} date object
 * @param endSearchDate {Object} date object
 * @returns {Promise<{jpgs: *[], mkvs: *[]}>}
 */
module.exports.searchDBSnapshots = async (startSearchDate, endSearchDate) => {
    console.log('startSearchDate: ', startSearchDate);
    console.log('typeof: ', typeof(startSearchDate));
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
