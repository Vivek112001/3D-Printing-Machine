const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    technology: { type: String, required: true },
    colors: [String],
    pricePerGram: { type: Number, required: true },
    applicationTypes: [String],
    imageUrl: { type: String }
});

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
