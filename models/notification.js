var mongoose = require('mongoose');
var moment = require('moment');
var config = require('../config/config.json');

var notificationCtrl;

var schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true,
        getters: true
    },
    toObject: {
        virtuals: true,
        getters: true
    }
};

var modelSchema = new mongoose.Schema({
    type: String,
    headline: String,
    text: String,
    image: String,
    link: String,
    _user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shout: { type: mongoose.Schema.Types.ObjectId, ref: 'Shout' },
    read: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ]
}, schemaOptions);

modelSchema.virtual('fromNow').get(function() {
    return moment(this.createdAt).fromNow();
});

modelSchema.virtual('linkTarget').get(function() {
    return this.link && this.link.indexOf('http') !== -1 ? '_blank' : '_self';
});

modelSchema.virtual('isReadByUser').get(function() {
  return this._isReadByUser;
});

modelSchema.virtual('isMention').get(function() {
  return this.type === 'mention'
});

modelSchema.virtual('isReadByUser').set(function(isReadByUser) {
  return this._isReadByUser = isReadByUser;
});

modelSchema.methods.checkRead = function(id) {
    this.isReadByUser = this.read.indexOf(id) !== -1;
};

// modelSchema.pre('find', function(next) {
//     if (this.type === 'mention') {
        
//     }
// });

modelSchema.post('save', function(next) {
    var notification = this;
    notificationCtrl = require('../controllers/notification');
    
    if (notification.type === 'news') {
        notificationCtrl.triggerNewNews(notification);
    } else {
        notificationCtrl.triggerNewNotification(notification);
    }
        
    console.log('new notification!', notification)
});

var Model = mongoose.model('Notification', modelSchema);

module.exports = Model;
