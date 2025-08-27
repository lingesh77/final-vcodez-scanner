const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Present", "Absent"], // restricts to only these values
    required: true,
  },
  attandance_date: {
    type: Date,
    required: true,
  },
  batch_id: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  trainer_id: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // adds createdAt & updatedAt

const Attendances  = mongoose.model("attendances", AttendanceSchema);
module.exports = Attendances ;
