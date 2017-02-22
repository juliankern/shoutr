var mongoose = require('mongoose');
var moment = require('moment');

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
};

var mediaSchema = new mongoose.Schema({
    url: String,
    ext: String,
    mime: String,
    type: String
}, schemaOptions);

mediaSchema.virtual('isImage').get(function() {
    return this.type === 'image';
});


var Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
