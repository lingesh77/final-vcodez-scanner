const mongoose = require("mongoose");




const BatchSchema = new mongoose.Schema({
  batch_id: {
    type:String,
    required: true,
    unique: true,
  },
  session: {
    type: String,
    required: true,
    trim: true,
  },
  domain: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    required: true,
  },
    trainer_id: { 
    type: String,
    required: true,
      },
  students: [
      {
      type:String,
      required: true,
    }
  ], 
  batch_schedule: {
    type: String,
    required: true,},
  CreatedAt: {
    type:String,
    required: true,

  }

   // embed students as subdocuments
}, { timestamps: true });

const Batch = mongoose.model("batches", BatchSchema);
module.exports = Batch;