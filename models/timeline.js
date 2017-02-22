var mongoose = require('mongoose');

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
};

var schema = new mongoose.Schema({
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, schemaOptions);

var Model = mongoose.model('Timeline', schema);

module.exports = Model;
