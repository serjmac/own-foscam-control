const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FtpSchema = new Schema(
  {
    path: String,
    fileTime: Date,
    fileType: String,
  },
  { timestamps: { createdAt: "savedAt", updatedAt: "checkedAt" } }
);

module.exports = mongoose.model("Ftp", FtpSchema);
