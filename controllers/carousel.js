const { searchDBSnapshots } = require("./traits");
const latest24hStr = "latest 24 hours";

/**
 * Search results in database from a given period.
 * If no period found request->body->dateSearchFromForm, will search latest 24 hours.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
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
  results.date = req.body.dateSearchFromForm ? req.body.dateSearchFromForm : latest24hStr;
  // if renderView = true, render view, else just return results data
  res.locals.renderView ? res.render("carousel", { results }) : res.status(200).send({ results });
};
