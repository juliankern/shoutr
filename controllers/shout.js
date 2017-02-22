var http = require('http');
var https = require('https');
var mime = require('mime');
var fileType = require('file-type');
var ObjectId = require('mongoose').Types.ObjectId; 

var Shout = require('../models/shout');
var Media = require('../models/media');
var User = require('../models/user');

var emojiCtrl = require('../controllers/emoji');
var timelineCtrl = require('../controllers/timeline');

var cfg = require('../config/config.json');

var _ = require('lodash');

module.exports = (function(){
    return {
        get,
        post,
        star,
        delete: deleteShout,
        getShouts,
        typeaheadData,
        getShoutsForTimeline,
        getTrends,
        getNearbyShouts,
        _queryShouts
    };
    
    function post(req, res) {
        req.assert('text', 'Please enter something you want to shout').notEmpty();

        var errors = req.validationErrors();

        if (errors) {
            res.json({ error: true, errors: errors });
        }

        var text = req.body.text
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/&nbsp;/g, ' ');

        var shout = new Shout({
            text: text,
            location: req.body.loc ? req.body.loc.split('-') : undefined,
            mentions: text.match(/@[a-z0-9]{3,}/gi),
            hashtags: text.match(/#[a-z0-9]{3,}/gi),
            _user: req.user._id,
            replyTo: req.body.replyTo
        });

        shout.save((err, saved) => {
            // shave shout, hihi ;)
            
            if (err) {
                res.json({ error: true, errors: err });
            } else {
                if (req.body.replyTo) {
                    Shout.findByIdAndUpdate(req.body.replyTo, { $inc: { replyCount: 1 } }).exec();
                }

                getMedias(saved.id, text, (err, shout) => {
                    if (err) { console.log('Shout not saved!', err); }
                    else {
                        res.json({ error: false, shout: shout, currentUserId: req.user ? req.user._id : null });   
                    }
                });
            }
        });
    };

    function getNearbyShouts(loc, page, cb) {
        _queryShouts({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [ loc.long, loc.lat ]
                    },
                    $maxDistance: 1000
                }
            }
        }, page, cb);
    }
    
    function getReplys(id, page, cb) {
        _queryShouts({
            replyTo: id
        }, cb);
    }

    function star(req, res) {
        var id = req.body.id;
        var update = req.body.isStar === 'true' ? { $addToSet: { stars: req.user._id } } : { $pull: { stars: req.user._id } };

        Shout
            .findByIdAndUpdate(id, update, { new: true })
            .populate('_user', 'name _id gravatar email username')
            .populate('_medias', 'url type isImage')
            .exec((err, shout) => {
                if (err) {
                    res.json({ error: true, errors: err });
                } else {
                    userCtrl.countStar(shout._user._id, req.body.isStar === 'true' ? 1 : -1, (err) => {
                        if (err) {
                        } else {
                            res.json({ error: false, shout: shout });
                        }
                    });
                }
            });
    }

    function deleteShout(req, res) {
        var id = req.body.id;
        var find = { _id: new ObjectId(id) };
        
        if (!req.hasRight) {
            // not allowed to delete all shouts, check if own shout
            find._user = req.user._id;
        }

        Shout.findOneAndUpdate(find, { $currentDate: { deletedAt: true }}, (err, shout) => {
            if (err) {
                res.json({ error: true, errors: err });
            } else {
                if (!shout) {
                    // no shout found => usually means that it's not his onw shout
                    res.json({ error: true, errors: [ { type: 'forbidden', text: "You're not allowed to do this" } ] });
                } else {
                    res.json({ error: false });   
                }
            }
        });
    }

    function get(req, res) {
        Shout.findById(req.params.id)
            .populate('_user', 'username email name')
            .exec((err, shout) => {
                if (err) {
                    console.log('error getting shout!', err);
                } else {
                    getReplys(shout._id, (err, replys) => {
                        res.json({ 
                            error: false, 
                            shout: shout, 
                            replys: _.reverse(replys),
                            redirect: '/profile/' + shout._user.username + '?shout=' + req.params.id 
                        });
                    }) 
                }
            })
    }

    function getShoutsForTimeline(id, page, cb) {
        require('../controllers/timeline').getTimelineUsers(id, (err, users) => {
            _queryShouts({ _user: { $in: users } }, page, (err, shouts) => {
                cb(err, shouts);
            })
        });
    }

    function _queryShouts(query, page, cb) {
        query = _.extend({ 
            deletedAt: undefined,
            replyTo: undefined
        }, query);

        Shout.find(query)
            .skip(page * cfg.defaults.shoutsPerPage)
            .limit(cfg.defaults.shoutsPerPage)
            .sort({ createdAt: -1 })
            .populate('_user', 'name _id gravatar email username')
            .populate('_medias', 'url type isImage')
            .exec(function(err, shouts) {            
                cb(err, shouts);
            });
    }

    function getShouts(id, page, cb) {
        var search = { };
        if (id && id !== null) { search.id = id; }
        
        _queryShouts(search, page, (err, shouts) => {
            cb(err, shouts);
        });
    }

    function typeaheadData(req, res) {
        var mentions = [];
        User.find({ active: 1 })
            .limit(20)
            .sort({ shoutCount: -1 })
            .select('username name shoutCount email')
            .exec((err, users) => {
                if (err) {
                    res.json({ error: true, errors: err });
                } else {
                    for (var i in users) {
                        mentions.push({
                            text: '@' + users[i].username,
                            name: users[i].name,
                            id: i*1,
                            gravatar: users[i].gravatar
                        });
                    }

                    getTrends(function(err, hashtags) {
                        getEmojiList((emojis) => {                    
                            res.json({ 
                                error: false, 
                                mention: mentions, 
                                hashtag: _idArray(_.map(hashtags, 'name')), 
                                emoji: emojis 
                            });                   
                        });
                    }, 10);
                }
            })
    }

    function getEmojiList(cb) {
        var list = _idArray(_.orderBy(_.keys(emojiCtrl.emojioneList)));
        _.forEach(list, (emoji) => {
           emoji.element =  emojiCtrl.generateEmojiTag(emoji.text);
        });
        
        cb(list);
    }

    function _idArray(array) {
        var returnArray= [];
        var id = 0;
        
        _.forEach(array, function(o) {
            returnArray.push({ id: id, text: o });
            id++;
        });
        
        return returnArray;
    }

    function getTrends(cb, limit, maxCount) {
        var hashtags = [];
        var found;

        if (!maxCount) { maxCount = 5000; }
        
        Shout.find({ 
                hashtags: { $gt: [] },
                deletedAt: undefined 
            })
            .limit(maxCount)
            .select('hashtags')
            .exec((err, shouts) => {
                _(shouts).forEach((shout) => {
                    _(shout.hashtags).forEach((hashtag) => {
                        found = _.find(hashtags, { name: hashtag });
                        
                        if (!found) {
                            hashtags.push({ name: hashtag, count: 1 });
                        } else {
                            found.count = found.count + 1;
                        }
                    });
                });

                hashtags = _.orderBy(hashtags, ['count', function(o){ return o.name.toLowerCase() }], ['desc', 'asc']);

                if (limit) {
                    hashtags = _.slice(hashtags, 0, limit);
                }
                
                cb(err, hashtags);
            });
    }

    function getMedias(id, text, cb) {
        var medias = text.match(/(http(s)?:\/\/[a-z0-9\.]+\/[a-z0-9\&\=\_\-\/]+[\.a-z0-9]+)/gi);
        var counted = 0;

        if (medias && medias.length > 0) {
            medias.forEach((url) => {
                getFileType(url, (data) => {
                    if (!data) {
                        data = {};
                        data.ext = url.split('.').slice(-1).pop();
                        data.mime = mime.lookup(url);
                    }

                    var media = new Media({
                        url: url,
                        ext: data.ext,
                        mime: data.mime,
                        type: data.mime.split('/')[0]
                    });

                    media.save((err1, savedMedia) => {                
                        if (err1) {
                            console.log('Media save failed!', err1)
                        } else {
                            console.log('Media saved!', savedMedia);

                            Shout.findById(id)
                                .populate('_user', 'name _id gravatar email username')
                                .populate('_medias', 'url type isImage')
                                .exec((err2, shout) => {
                                    if (err2) { console.log('update shout error', err2); }

                                    shout._medias.push(savedMedia.id);
                                    shout.save((err3, savedShout) => {
                                        counted++;
                                        if (err3) { console.log('update shout error2', err3); }
                                        
                                        if (counted >= medias.length) {
                                            savedShout.populate('_medias', (err) => {
                                                cb(err3, savedShout);
                                            });
                                        }
                                    });
                                });
                        }
                    });
                })
            })
        } else {
            Shout.findById(id)
                .populate('_user', 'name _id gravatar email username')
                .exec((err, shout) => {
                    cb(err, shout)
                });
        }
    }

    function getFileType(url, cb) {
        if (url.indexOf('https:') !== -1) {
            https.get(url, (res) => {
                res.once('data', (chunk) => {
                    res.destroy();
                    cb(fileType(chunk));
                });
            }).on('error', (e) => {
                cb(getFileTypeByName(url));
            });
        } else {
            http.get(url, (res) => {
                res.once('data', (chunk) => {
                    res.destroy();
                    cb(fileType(chunk));
                });
            }).on('error', (e) => {
                cb(getFileTypeByName(url));
            });
        }
        //=> {ext: 'gif', mime: 'image/gif'} 
    }

    function getFileTypeByName(url) {
        var ext = url.split('.').pop().toLowerCase();

        var extToMimes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'gif': 'image/gif',
            'txt': 'text/plain',
            'json': 'application/json'
        }

        if (extToMimes.hasOwnProperty(ext)) {
            return { ext: ext, mime: extToMimes[ext] };
        }

        return { ext: ext, mime: 'undefined' };
    }
})();


///// OLD METHODS

