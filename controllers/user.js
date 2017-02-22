var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var mongoose = require('mongoose');

var User = require('../models/user');
var Shout = require('../models/shout');

var tokenCtrl = require('../controllers/cookieToken');
var timelineCtrl = require('../controllers/timeline.js');

module.exports = (function(){
    return {
        ensureAuthenticated: ensureAuthenticated,
        authenticated: authenticated,
        hasRight: hasRight,
        checkRight: checkRight,
        login: login,
        logout: logout,
        signup: signup,
        accountPut: accountPut,
        accountDelete: accountDelete,
        unlink: unlink,
        forgot: forgot,
        reset: reset,
        countShout: countShout,
        countStar: countStar,
        getUserId: getUserId,
        friendRequest: friendRequest,
        changeRequest: changeRequest,
        getFriendsForId: getFriendsForId,
        getNewUsers
    };
    
    function getNewUsers(cb) {
        User.find({ active: 1, deletedAt: undefined })
            .limit(10)
            .sort({ createdAt: -1 })
            .select('-password')
            .exec((err, users) => {
                cb(err, users);
            })
    }

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/login');
        }
    }

    function authenticated(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.json({ error: true, errors: [ { type: 'nologin', text: 'Not logged in!' } ] });
        }
    }

    function changeRequest(req, res) {
        if (!!req.body.accept) {
            User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: req.body.accept }, $pull: { friendRequests: req.body.accept } })
                .exec((err, user) => {
                    User.findByIdAndUpdate(req.body.accept, { $addToSet: { friends: req.user._id } })
                        .exec((err, savedUser) => {
                            req.flash('success', { msg: 'Friendship accepted!' });
                            res.redirect('/account/requests');        
                        })
                })
        } else if(!!req.body.reject)  {
            User.findByIdAndUpdate(req.user._id, { $pull: { friendRequests: req.body.reject } })
                .exec((err, user) => {
                    req.flash('success', { msg: 'Friendship rejected!' });        
                    res.redirect('/account/requests');        
                })
        } else if(!!req.body.cancel)  {
            User.findByIdAndUpdate(req.body.cancel, { $pull: { friendRequests: req.user._id } })
                .exec((err, user) => {
                    req.flash('success', { msg: 'Request canceled!' });        
                    res.redirect('/account/requests');        
                })
        }
    }
    
    function getFriendsForId(id, cb) {
        User.findById(id)
            .populate('friends')
            .exec((err, user) => {
                cb(err, user.friends);
            })
    }

    function friendRequest(req, res) {
        if (!!req.body.addFriend) {
            User.findByIdAndUpdate(req.body.addFriend, { $addToSet: { friendRequests: req.user._id } })
                .exec((err, user) => {
                    req.flash('success', { msg: 'Friend request sent!' });        
                    res.redirect('/profile/' + user.username);
                });
        } else if (!!req.body.endFriendship) {
            User.findByIdAndUpdate(req.body.endFriendship, { $pull: { friends: req.user._id } })
                .exec((err, user) => {
                    User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.body.endFriendship } })
                        .exec((err, currentUser) => {
                            req.flash('success', { msg: 'Friendship ended!' });        
                            res.redirect('/profile/' + user.username);
                        })
                });
        } else if (!!req.body.cancelRequest) {
            User.findByIdAndUpdate(req.body.cancelRequest, { $pull: { friendRequests: req.user._id } })
                .exec((err, user) => {
                    req.flash('success', { msg: 'Request canceled!' });        
                    res.redirect('/profile/' + user.username);
                });
        }
    }

    function hasRight(user, right) {
        return user.rankData && user.rankData.rights && user.rankData.rights.indexOf(right) > -1;
    }
    
    function checkRight(right) {        
        return function(req, res, next) {
            if (hasRight(req.user, right)) { req.hasRight = true; }
            else { req.hasRight = false; }
            
            next();
        }
    }

    function getUserId(query, cb) {
        User.findOne(query)
            .exec((err, user) => {
                cb(err, user._id);
            })
    }

    function login(req, res, next) {
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.assert('password', 'Password cannot be blank').notEmpty();
        req.sanitize('email').normalizeEmail({ remove_dots: false });

        var errors = req.validationErrors();

        if (errors) {
            res.json({ error: true, errors: errors });
        } else {
            passport.authenticate('local', function(err, user, info) {
                if (!user) {
                    res.json({ error: true, errors: info });
                } else {
                    req.logIn(user, function(err) {
                        if (req.body.remember_me && !!req.body.remember_me) {
                            tokenCtrl.issueToken(user, (err, token) => {
                                if (!!err) {       
                                    console.log('Error at login!', err);
                                } else {          
                                    res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
                                    
                                    _loginPostLogin(user, res); 
                                }
                            });
                        } else {
                            _loginPostLogin(user, res);
                        }
                    });
                }
            })(req, res, next);
        }
    }
    
    function _loginPostLogin(user, res) {
        user.password = undefined;
        timelineCtrl.getUserTimelines(user._id, (err, timelines) => {
            res.json({ error: false, user: user, timelines: timelines, redirect: '/' }); 
        });
    }
    
    function logout(req, res) {
        res.clearCookie('remember_me');
        req.logout();
        res.redirect('/');
    }
    
    function signup(req, res, next) {
        req.assert('name', 'Name cannot be blank').notEmpty();
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.assert('username', 'Username cannot be blank').notEmpty();
        req.assert('password', 'Password must be at least 4 characters long').len(8);
        req.sanitize('email').normalizeEmail({ remove_dots: false });

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('/signup');
        }

        User.findOne({ email: req.body.email }, function(err, user) {
            if (user) {
                req.flash('error', { msg: 'The email address you have entered is already associated with another account.' });
                return res.redirect('/signup');
            }
            user = new User({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: req.body.password
            });
            user.save(function(err) {
                req.logIn(user, function(err) {
                res.redirect('/');
            });
        });
      });
    }
    
    function accountPut(req, res, next) {
        if ('password' in req.body) {
            req.assert('password', 'Password must be at least 4 characters long').len(4);
            req.assert('confirm', 'Passwords must match').equals(req.body.password);
        } else {
            req.assert('email', 'Email is not valid').isEmail();
            req.assert('email', 'Email cannot be blank').notEmpty();
            req.assert('username', 'Username cannot be blank').notEmpty();
            req.sanitize('email').normalizeEmail({ remove_dots: false });
        }

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('/account');
        }

        User.findById(req.user.id, function(err, user) {
            if ('password' in req.body) {
                user.password = req.body.password;
            } else {
                user.email = req.body.email;
                user.name = req.body.name;
                user.username = req.body.username;
                user.gender = req.body.gender;
                user.location = req.body.location;
                user.website = req.body.website;
            }
            user.save(function(err) {
                if ('password' in req.body) {
                    req.flash('success', { msg: 'Your password has been changed.' });
                } else if (err && err.code === 11000) {
                    req.flash('error', { msg: 'The email address you have entered is already associated with another account.' });
                } else {
                    req.flash('success', { msg: 'Your profile information has been updated.' });
                }
                res.redirect('/account');
            });
        });
    }
    
    function accountDelete(req, res, next) {
        User.remove({ _id: req.user.id }, function(err) {
            req.logout();
            req.flash('info', { msg: 'Your account has been permanently deleted.' });
            res.redirect('/');
        });
    }
    
    function unlink(req, res, next) {
        User.findById(req.user.id, function(err, user) {
            switch (req.params.provider) {
                case 'facebook':
                    user.facebook = undefined;
                    break;
                case 'google':
                    user.google = undefined;
                    break;
                case 'twitter':
                    user.twitter = undefined;
                    break;
                case 'vk':
                    user.vk = undefined;
                    break;
                default:
                    req.flash('error', { msg: 'Invalid OAuth Provider' });
                    return res.redirect('/account');
            }
            user.save(function(err) {
                req.flash('success', { msg: 'Your account has been unlinked.' });
                res.redirect('/account');
            });
        });
    } 
    
    function forgot(req, res, next) {
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.sanitize('email').normalizeEmail({ remove_dots: false });

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('/forgot');
        }

        async.waterfall([
            function(done) {
                crypto.randomBytes(16, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                User.findOne({ email: req.body.email }, function(err, user) {
                    if (!user) {
                        req.flash('error', { msg: 'The email address ' + req.body.email + ' is not associated with any account.' });
                        return res.redirect('/forgot');
                    }
                    user.passwordResetToken = token;
                    user.passwordResetExpires = Date.now() + 3600000; // expire in 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var transporter = nodemailer.createTransport({
                    service: 'Mailgun',
                    auth: {
                        user: process.env.MAILGUN_USERNAME,
                        pass: process.env.MAILGUN_PASSWORD
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'support@yourdomain.com',
                    subject: '✔ Reset your password on Mega Boilerplate',
                    text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    req.flash('info', { msg: 'An email has been sent to ' + user.email + ' with further instructions.' });
                    res.redirect('/forgot');
                });
            }
        ]);
    }

    function reset(req, res, next) {
        req.assert('password', 'Password must be at least 4 characters long').len(4);
        req.assert('confirm', 'Passwords must match').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            req.flash('error', errors);
            return res.redirect('back');
        }

        async.waterfall([
            function(done) {
                User.findOne({ passwordResetToken: req.params.token })
                    .where('passwordResetExpires').gt(Date.now())
                    .exec(function(err, user) {
                        if (!user) {
                            req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
                            return res.redirect('back');
                        }
                        user.password = req.body.password;
                        user.passwordResetToken = undefined;
                        user.passwordResetExpires = undefined;
                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    });
            },
            function(user, done) {
                var transporter = nodemailer.createTransport({
                    service: 'Mailgun',
                    auth: {
                        user: process.env.MAILGUN_USERNAME,
                        pass: process.env.MAILGUN_PASSWORD
                    }
                });
                var mailOptions = {
                    from: 'support@yourdomain.com',
                    to: user.email,
                    subject: 'Your Mega Boilerplate password has been changed',
                    text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    req.flash('success', { msg: 'Your password has been changed successfully.' });
                    res.redirect('/account');
                });
            }
        ]);
    }

    function countShout(userId, count, cb) {
        User.findById(userId, function(err, user) {
            user.shoutCount = user.shoutCount + count;

            user.save(function(err) {
                cb();
            });
        });
    }

    function countStar(userId, count, cb) {
        User.findById(userId, function(err, user) {
            user.starCount = user.starCount + count;

            user.save(function(err) {
                cb();
            });
        });
    }
})();

