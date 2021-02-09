const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const ActivationSchema = new Schema({
  switch: String,
  time: Object,
  userIP: String,
  userAgent: String,
});

ActivationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Activation", ActivationSchema);
