var shoutCtrl = require('./shout');
var userCtrl = require('./user');
var timelineCtrl = require('./timeline');
var notificationCtrl = require('./notification');

var User = require('../models/user');
var Shout = require('../models/shout');

var _ = require('lodash');

module.exports = (function() {
    return {
        forgot: forgot,
        home: home,
        signup: signup,
        account: account,
        profile: profile,
        login: login,
        reset: reset,
        contact: contact,
        search: search,
        requests: requests,
        friends: friends
    };

    function forgot(req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        res.render('account/forgot', {
            title: 'Forgot Password'
        });
    }

    function home(req, res) {
        userCtrl.getNewUsers((err, newUsers) => {
            shoutCtrl.getTrends((err, hashtags) => {
                var userId = req.isAuthenticated() ? req.user._id : 0;
                timelineCtrl.getUserTimelines(userId, (err, timelines) => {
                    notificationCtrl.getNews(userId, (err, news) => {
                        var unreadNewsCount = 0;
                        _.forEach(news, (n) => {
                            if (!n.isReadByUser) unreadNewsCount++;
                        });
                        
                        res.render('home', {
                            title: 'Home',
                            trends: hashtags,
                            timelines: timelines,
                            news: news,
                            unreadNewsCount: unreadNewsCount === 0 ? '' : unreadNewsCount,
                            newUsers: newUsers,
                            breadcrumbs: [ { name: 'Home', link: '/' } ]
                        }); 
                    })
                })
            }); 
        })
    }

    function account(req, res) {
        res.render('account/account', {
            title: 'My Account'
        });
    }
    
    function requests(req, res) {
        User.find({ friendRequests: req.user._id })
            .exec((err, sentRequests) => {
                User.findById(req.user._id)
                    .populate('friendRequests')
                    .exec((err, user) => {
                        res.render('account/requests', {
                            title: 'Friend requests',
                            requests: user.friendRequests,
                            sentRequests: sentRequests
                        });
                    });
            })
    }
    
    function friends(req, res) {
        User.find({ friends: req.user._id })
            .exec((err, friends) => {
                User.findById(req.user._id)
                    .populate('friends')
                    .exec((err, user) => {
                        res.render('account/friends', {
                            title: 'Friends',
                            friends: user.friends,
                        });
                    });
            })
    }

    function signup(req, res) {
        if (req.user) {
            return res.redirect('/');
        }
        res.render('account/signup', {
            title: 'Sign up'
        });
    }

    function profile(req, res) {
        var userId = req.isAuthenticated() ? req.user._id : 0;
        
        User.findOne({ username: req.params.username })
            .select('-password')
            .exec(function(err, user) {
                timelineCtrl.getUserTimelines(userId, (err, timelines) => {
                    Shout.find({ _user: user._id })
                        .limit(10)
                        .sort({ createdAt: -1 })
                        .populate('_user', 'name _id gravatar email username')
                        .populate('_medias', 'url type')
                        .exec(function(err, shouts) {

                            console.log(user, shouts);
                            
                            res.render('account/profile', {
                                title: 'Profile of ' + user.username,
                                shouts: shouts,
                                user: user,
                                timelines: timelines,
                                breadcrumbs: [ 
                                    { name: 'Home', link: '/' },
                                    { name: 'Profile of '+ user.username, link: '' }
                                ]
                            });
                        });
                });
            });
    }

    function login(req, res) {
        if (req.user) {
            return res.redirect('/');
        }

        res.render('account/login', {
            title: 'Log in'
        });
    }

    function reset(req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        User.findOne({ passwordResetToken: req.params.token })
            .where('passwordResetExpires').gt(Date.now())
            .exec(function(err, user) {
                if (!user) {
                    req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
                    return res.redirect('/forgot');
                }
                res.render('account/reset', {
                    title: 'Password Reset'
                });
            });
    }

    function contact(req, res) {
        res.render('contact', {
            title: 'Contact'
        });
    }

    function search(req, res) {
        var query = decodeURIComponent(req.params.query)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        var search = {};
        
        if (query.indexOf('#') === 0) {
            search = { hashtags: query };
        } else {
            search = { text: new RegExp(query, 'i') };
        }
        
        Shout.find(search)
            .populate('_user', 'name _id gravatar email username')
            .populate('_medias', 'url type')
            .exec((err, shouts) => {
                console.log(shouts);
                
                res.render('home', {
                    title: 'Searchresult',
                    shouts: shouts,
                    searchterm: query
                });
            });
    }
})()