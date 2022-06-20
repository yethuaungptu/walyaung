const mongoose = require("mongoose"); //mongodb module

var Schema = mongoose.Schema;

var AdsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  adsUrl: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  updated: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Ads", AdsSchema);
