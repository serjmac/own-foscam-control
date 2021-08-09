const schedule = require("node-schedule");
const snapShotLifeCheck = process.env.SNAPSHOT_LIFE_CHECK || 30; //days
const { searchDBSnapshots } = require("./traits");
const { deleteFromFsAndDB } = require("./fileWatcher");

// run everyday at midnight, search for old files
module.exports.deleteOldSnapshots = schedule.scheduleJob('00 00 * * *', async () => {
    console.log(`deleting files older than ${snapShotLifeCheck} days snapshot and recording files from filesystem...`);
    const startSearchDate = new Date('1970-01-01');
    const endSearchDate = new Date(new Date() - 1000 * 60 * 60 * 24 * parseInt(snapShotLifeCheck));

    const results = await searchDBSnapshots(startSearchDate, endSearchDate);

    results.jpgs.forEach((e) => {
        deleteFromFsAndDB(e.path);
    });

    results.mkvs.forEach((e) => {
        deleteFromFsAndDB(e.path);
    });

});

