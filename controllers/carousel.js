const Ftp = require("../models/ftp");

const searchDBSnapshots = async (startSearchDate, endSearchDate) => {
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

module.exports.searchSnapshots = async (req, res) => {
  let startSearchDate;
  let endSearchDate;
  if (req.body.dateSearchFromForm) {
    //will search full given day from post request date
    startSearchDate = new Date(req.body.dateSearchFromForm); //custom search
    endSearchDate = new Date(startSearchDate.getTime() + 1000 * 60 * 60 * 24);
  } else {
    //will search latest 24 hours
    endSearchDate = new Date(); //now
    startSearchDate = new Date(endSearchDate.getTime() - 1000 * 60 * 60 * 24);
  }
  const results = await searchDBSnapshots(startSearchDate, endSearchDate);
  if (req.body.dateSearchFromForm) {
    results.date = startSearchDate.toDateString();
  }
  res.render("carousel", { results });
};

module.exports.apiSearchSnapshots = async (req, res) => {
  let startSearchDate;
  let endSearchDate;
  if (req.body.dateSearchFromForm) {
    //will search full given day from post request date
    startSearchDate = new Date(req.body.dateSearchFromForm); //custom search
    endSearchDate = new Date(startSearchDate.getTime() + 1000 * 60 * 60 * 24);
  } else {
    //will search latest 24 hours
    endSearchDate = new Date(); //now
    startSearchDate = new Date(endSearchDate.getTime() - 1000 * 60 * 60 * 24);
  }
  const results = await searchDBSnapshots(startSearchDate, endSearchDate);
  if (req.body.dateSearchFromForm) {
    results.date = startSearchDate.toDateString();
  }
  res.status(200).send({ results });
};
