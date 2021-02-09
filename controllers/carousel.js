const Ftp = require("../models/ftp");

const searchDBSnapshots = async (startSearchDate, endSearchDate) => {
  const response = await Ftp.find({ fileTime: { $gte: startSearchDate, $lt: endSearchDate } });
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
//search latest 24 hours
module.exports.todaySnapshots = async (req, res) => {
  const now = new Date();
  const results = await searchDBSnapshots(new Date(now.getTime() - 1000 * 60 * 60 * 24), now);
  res.render("carousel", { results });
};

//search 24hrs, from 00:00:00 from given day to 00:00:00 from next day
module.exports.searchSnapshots = async (req, res) => {
  const customDate = new Date(req.body.dateSearchFromForm);
  const results = await searchDBSnapshots(customDate, new Date(customDate.getTime() + 1000 * 60 * 60 * 24));
  results.date = customDate.toDateString();
  res.render("carousel", { results });
};
