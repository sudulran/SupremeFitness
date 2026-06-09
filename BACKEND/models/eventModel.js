// models/eventModel.js
const mongoose = require("mongoose");

const participantProgressSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  note: { type: String, default: "" },
  type: { type: String, enum: ["add", "set"], default: "add" },
  createdAt: { type: Date, default: Date.now },
});

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  score: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
  progress: [participantProgressSchema],
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, default: "event" },
  image: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  participants: [participantSchema],
});

const EventModel = mongoose.model("Event", eventSchema);
module.exports = EventModel;