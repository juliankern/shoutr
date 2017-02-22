var mongoose = require('mongoose');
var moment = require('moment');

var config = require('../config/config.json');

var emojiCtrl = require('../controllers/emoji');

var User = require('./user');
var Notification = require('./notification');

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
};

var modelSchema = new mongoose.Schema({
    text: String,
    mentions: [ String ],
    hashtags: [ String ],
    deletedAt: Date,
    location: {
        type: [Number],
        index: '2dsphere'
    },
    stars: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique : true } ],
    _medias: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Media' } ], 
    _user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Shout' },
    replyCount: { type: Number, default: 0 }
}, schemaOptions);

modelSchema.pre('save', function(next) {
    var shout = this;
    
    if (shout.isNew) {
        User.findByIdAndUpdate(shout._user, { $inc: { shoutCount: 1 } }).exec();
    }
    
    if (!!shout.deletedAt) {
        User.findByIdAndUpdate(shout._user, { $inc: { shoutCount: -1 } }).exec();
    }
    
    next();
});

modelSchema.post('save', function(next) {
    var shout = this;
    
    if (shout.mentions && shout.mentions.length > 0) {
        var m = '';
        for (var i = 0; i < shout.mentions.length; i++) {
            m = shout.mentions[i];

            User.findOne({ active: 1, deletedAt: undefined, username: m.replace('@', '') })
                .exec((err, user) => {
                    var not = new Notification({
                        _user: user._id,
                        linkedUser: shout._user,
                        type: 'mention',
                        shout: shout._id
                    });
                    
                    not.save((err, saved) => {
                        if (err) {
                            console.log('error saving notification', err);
                        }
                    })
                })
        }
    }
});

modelSchema.virtual('fromNow').get(function() {
    return moment(this.createdAt).fromNow();
});

modelSchema.virtual('timestamp').get(function() {
    return moment(this.createdAt).unix();
});

modelSchema.virtual('textParsed').get(function() {
    var text = this.text;
    text = text.replace(/@[a-z0-9äöüß]{3,}/gi, (a) => { return '<a href="/profile/' + a.replace('@', '') + '">' + a + '</a>'; });
    text = text.replace(/#[a-z0-9äöüß]{3,}/gi, (a) => { return '<a href="/search/' + encodeURIComponent(a) + '">' + a + '</a>'; });
    text = text.replace(/(:[a-z0-9\-\+\_]+:)/gi, (a) => { return emojiCtrl.generateEmojiTag(a); });

    return text;
});

var Model = mongoose.model('Shout', modelSchema);

module.exports = Model;
