var mongoose = require("mongoose"); //mongodb module

var Schema = mongoose.Schema;

var PropertySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subscription: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: "Agents",
  },
  min_rent: {
    type: Number,
    default: 1,
  },
  image: [
    {
      url: {
        type: String,
        default: null,
      },
    },
  ],
  area: {
    type: String,
    required: true,
  },
  bedRoom: {
    type: Number,
    default: 0,
  },
  bathRoom: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: String,
    default: "0", // 0 is normal, 1 is deleted
  },
  created: {
    type: Date,
    default: new Date.now(),
  },
  updated: {
    type: Date,
    default: new Date.now(),
  },
});

module.exports = mongoose.model("Properties", PropertySchema);
