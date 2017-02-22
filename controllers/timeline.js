var _ = require('lodash');
var mongoose = require('mongoose');

var userCtrl = require('./user.js');
var shoutCtrl = require('./shout.js');

var Timeline = require('../models/timeline');
var User = require('../models/user');

module.exports = (function() {
    return {
        get: get,
        new: newTimeline,
        getUserTimelines: getUserTimelines,
        add: add,
        shouts: shouts,
        remove: remove,
        getTimelineUsers: getTimelineUsers
    };
    
    function get(req, res, next) {
        getUserTimelines(req.user.id, (err, timelines) => {
            res.json({ error: false, timelines: timelines });
        })
    }

    function shouts(req, res) {
        var id = req.query.id || null;
        var page = req.query.page || 0;

        if (req.params.type === 'latest') {
            shoutCtrl.getShouts(id, page, (err, shouts) => {            
                if (err) {
                    res.json({ error: true, errors: err });
                } else {
                    res.json({ error: false, shouts: shouts, currentUserId: req.user ? req.user._id : null });   
                }  
            });
        } else if (req.params.type === 'friends') {
            userCtrl.getFriendsForId(req.user._id, (err, friends) => {
                shoutCtrl._queryShouts({ deletedAt: undefined, _user: { $in: friends } }, page, (err, shouts) => {
                    res.json({ error: false, shouts: shouts, currentUserId: req.user ? req.user._id : null });  
                })
            });
        } else if (req.params.type === 'nearby') {
            shoutCtrl.getNearbyShouts({ long: req.query.long, lat: req.query.lat }, page, (err, shouts) => {
                if (err) {
                    res.json({ error: true, errors: err });
                } else {
                    res.json({ error: false, shouts: shouts, currentUserId: req.user ? req.user._id : null });   
                }  
            });
        } else if (!!req.params.type) {
            shoutCtrl.getShoutsForTimeline(req.params.type, page, (err, shouts) => {
                if (err) {
                    res.json({ error: true, errors: err });
                } else {
                    res.json({ error: false, shouts: shouts, currentUserId: req.user ? req.user._id : null });   
                }  
            });
        }

    }

    function getUserTimelines(id, cb) {
        User.findById(id)
            .select('timelines')
            .populate('timelines', 'name users')
            .exec((err, user) => {
                cb(err, user ? user.timelines : null);
            });
    }

    function getTimelineUsers(id, cb) {
        Timeline.findById(id)
            .exec((err, timeline) => {
               cb(err, timeline.users); 
            });
    }

    function newTimeline(req, res, next) {
        //req.user.id,
        console.log('newTimeline', req.body.user);
        
        var timeline = new Timeline({
            name: req.body.name,
            users: [ mongoose.Types.ObjectId(req.body.user) ]
        });

        timeline.save((err, saved) => {
            if (err) {
                console.log('Error saving timeline!', err);
            } else {
                User.findByIdAndUpdate(req.user.id, { $addToSet: { timelines: saved.id } })
                    .select('-password')
                    .exec((err, savedUser) => {
                        if (err) {
                            console.log('Error linking timeline to user', err);
                        } else {
                            res.json({ error: false, user: savedUser });
                        }
                    });
            }
        });
    }

    function add(req, res, next) {
        //req.user.id,
        console.log('add to', req.body.timeline, req.body.user);
        
        Timeline
            .findByIdAndUpdate(req.body.timeline, { $addToSet: { users: req.body.user } })
            .exec((err, savedTimeline) => {
                if (err) {
                    console.log('Error updating timeline', err);
                } else {
                    res.json({ error: false, timeline: savedTimeline });
                }
            });
    }

    function remove(req, res, next) {
        //req.user.id,
        console.log('remove from', req.body.timeline, req.body.user);
        
        Timeline
            .findByIdAndUpdate(req.body.timeline, { $pull: { users: req.body.user } })
            .exec((err, savedTimeline) => {
                if (err) {
                    console.log('Error updating timeline', err);
                } else {
                    res.json({ error: false, timeline: savedTimeline });
                }
            });

    }
    
})()