const mongoose = require('mongoose');

const Trainerschema = new mongoose.Schema({
    trainer_id: { type: String, required: true, unique: true },
    trainer_name: { type: String, required: true },
    trainer_email: { type: String, required: true, unique: true },
    trainer_domains: { type: [String], required: true },
    batches:
        {
            type:[String],
        }
    

});

const Trainer = mongoose.model('trainers', Trainerschema);
module.exports = Trainer;
