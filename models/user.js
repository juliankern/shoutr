var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var moment = require('moment');
var config = require('../config/config.json');

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
};

function setLanguage(value) {
    if (config.languages.includes(value)) {
        return value;
    }

    return false;
}

function getLanguage(lang) {
    if (!lang || lang === '') {
        return config.defaults.language;
    }
}

var modelSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true},
    rank: { type: Number, default: config.defaults.user.rank },
    shoutCount: { type: Number, default: 0 },
    starCount: { type: Number, default: 0 },
    friends: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique : true } ],
    friendRequests: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique : true } ],
    timelines: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline', unique : true } ],
    active: { type: Boolean, default: 1 },
    language: { type: String, set: setLanguage, get: getLanguage },
    socket: String,
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    gender: String,
    location: String,
    website: String,
    picture: String,
    facebook: String,
    twitter: String,
    google: String,
    vk: String
}, schemaOptions);

modelSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            user.password = hash;
            next();
        });
    });
});

modelSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, (err, isMatch) => {
        cb(err, isMatch);
    });
};

modelSchema.virtual('rankData').get(function() {
    return config.ranks[this.rank];
});

modelSchema.virtual('memberSince').get(function() {
    return moment(this.createdAt).fromNow(true);
});

modelSchema.virtual('gravatar').get(function() {
    if (!this.get('email')) {
        return 'https://gravatar.com/avatar/?s=200&d=retro';
    }
    var md5 = crypto.createHash('md5').update(this.get('email')).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=200&d=retro';
});

var User = mongoose.model('User', modelSchema);

module.exports = User;
