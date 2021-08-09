const { searchDBSnapshots } = require("./traits");

const search = async (req,res) => {
  console.log('search');
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
  return results;
};

module.exports.searchSnapshots = async (req, res) => {
  const results = await search(req,res);
  res.render("carousel", { results });
};

module.exports.apiSearchSnapshots = async (req, res) => {
  const results = await search(req,res);
  res.status(200).send({ results });
};
