const { getQuerySchema, postFormSchema } = require("./validationSchemas");
const ExpressError = require("./utils/ExpressError");
const fakeDelay = 500;

module.exports.validateGet = (req, res, next) => {
  // const { error } = ipSchema.validate(req.query.ip);
  const { error } = getQuerySchema.validate(req.query);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    console.log(msg);
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.validatePost = (req, res, next) => {
  const { error } = postFormSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.getLogParams = (query) => {
  const limit = 20;
  const page = parseInt(query.page) || 1;
  let date;
  let condition = {}; //search conditions for pagination
  //path needs to be stored in order to track search query string when paginating
  let path = "/logs?";
  if (query.date) {
    date = query.date;
    path = path + `date=${query.date}`;
    const startSearchDate = new Date(date);
    const endSearchDate = new Date(startSearchDate.getTime() + 1000 * 60 * 60 * 24);
    condition.time = { $gte: startSearchDate, $lt: endSearchDate };
  }
  if (query.ip) {
    path = path + `&ip=${query.ip}`;
    condition.userIP = query.ip;
  }
  const paginateOptions = { page: page, limit: limit, sort: { _id: -1 } };
  return { path, condition, paginateOptions };
};

/**
 * Dummy response delay inserter middleware, for example to test spinners in frontend
 * @param req
 * @param res
 * @param next
 */
module.exports.delayer = (req, res, next) => {
  const delay = fakeDelay;
  setTimeout(() => {
    console.log(`this request had a dummy delay of ${delay} ms.`);
    next();
  }, delay);
};
