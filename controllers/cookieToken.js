var Token = require('../models/cookieToken');
var utils = require('./utils');

exports.issueToken = function(user, done) {
    var tokenStr = utils.randomString(64);

    var token = new Token({
        token: tokenStr,
        _user: user._id
    });

    token.save(function(err, saved) {
        if (err) { return done(err); }
        return done(null, tokenStr);
    });
}

exports.consumeRememberMeToken = function(token, cb) {
    Token.findOne({ token: token })
        .exec(function(err, token) {
            if (err) { cb(err) }
            if (!token) { return cb(null, false); }

            cb(null, token._user);

            token.remove();
        });
}
