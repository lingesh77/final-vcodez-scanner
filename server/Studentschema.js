const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  student_name: {
    type: String,
    required: true,
    trim: true,
  },
  student_email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  student_phone_number: {
    type: Number,
    required: true,
  },
  student_domain: {
    type: String,
    required: true,
  },

 trainer_id: {   // renamed 'Staff ID' to Staff_ID (Mongo doesn’t like spaces in keys)
    type: String,
    required: true,
  },
  student_id: {   // like VCS6865, VCS8715
    type: String,
    required: true,
    unique: true,
  },
  batch_id: {
    type: String,
    required: true,
  },
}, { timestamps: true });


const Student = mongoose.model("students", StudentSchema);
module.exports = Student;
