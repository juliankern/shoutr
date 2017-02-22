var mongoose = require('mongoose');

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
};

var schema = new mongoose.Schema({
    token: String,
    _user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, schemaOptions);

var Token = mongoose.model('Token', schema);

module.exports = Token;
