const Joi = require("joi");

// module.exports.ipSchema = Joi.string().ip({
//   version: ["ipv4"],
// });

module.exports.getQuerySchema = Joi.object({
  ip: Joi.string().ip({
    version: ["ipv4"],
  }),
  date: Joi.string().isoDate(),
  page: Joi.number().min(0).max(999),
});

module.exports.postFormSchema = Joi.object({
  dateSearchFromForm: Joi.string().isoDate(),
  currentPath: Joi.string(),
});
