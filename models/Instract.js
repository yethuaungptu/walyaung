const mongoose = require("mongoose"); //mongodb module

var Schema = mongoose.Schema;

var InstractSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "new",
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: "Agents",
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Properties",
  },
  isDeleted: {
    type: String,
    default: "0", // 0 is normal, 1 is deleted
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

module.exports = mongoose.model("Instracts", InstractSchema);
