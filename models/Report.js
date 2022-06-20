const mongoose = require("mongoose"); //mongodb module

var Schema = mongoose.Schema;

var ReportSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  rtype: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: String,
    default: "0", // 0 is normal, 1 is deleted
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: String,
    default: "new",
  },
  updated: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Reports", ReportSchema);
