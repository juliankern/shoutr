// var shoutCtrl = require('./shout');
// var timelineCtrl = require('./timeline');
// var notificationCtrl = require('./notification');

// var User = require('../models/user');
// var Shout = require('../models/shout');

// var _ = require('lodash');

module.exports = (function() {
    return {
        language: language
    };

    function language(req, res) {
        res.json({ error: false, language: res.locals.lang });           
    }
   
})()