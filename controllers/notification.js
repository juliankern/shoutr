var User = require('../models/user');
var Notification = require('../models/notification');

var _ = require('lodash');

module.exports = (function() {
    var socket;
    var io;
    
    return {
        init: init,
        read: read,
        getNews: getNews,
        sendToUser: sendToUser,
        triggerNewNews: triggerNewNews,
        triggerNewNotification: triggerNewNotification
    };
    
    function init(i) {
        io = i;
        io.on('connection', function(sock){
            socket = sock;
            console.log('a user connected');
        
            socket.on('registerUser', function(data) {
               if (data.id && data.id !== 0) {
                   console.log('...and registered:', socket.id, data); 
                   _registerUser(data.id, socket.id);
               }
            });
            
            socket.on('disconnect', function () {
                _unregisterUser(socket.id);
            });
        });
    }
    
    function triggerNewNews(news) {
        console.log('news found!', news.headline);
        io.emit('news', news); 
    }
    
    function triggerNewNotification(notification) {
        sendToUser(notification._user, 'notification', notification);
    }
    
    function read(req, res) {
        Notification.findByIdAndUpdate(req.body.id, { $addToSet: { read: req.user._id } })
            .exec((err, notification) => {
                notification.checkRead(req.user._id);
                res.json({ error: false, notification: notification });   
            })
    }
    
    function sendToUser(userId, name, data) {
        User.findById(userId)
            .exec((err, user) => {
                console.log(name + ' for', user.username, user.socket);
                io.to(user.socket).emit(name, data);       
            })
    }
    
    function getNews(userId, cb) {
        _newsQuery()
            .exec((err, news) => {
                if (userId !== 0) {
                    _.forEach(news, (n) => {
                        n.checkRead(userId);
                    })   
                }
                cb(err, news);
            });
    }
    
    function _subscribeUser(user) {
        _notificationQuery(user._id)
            .cursor()
            .on('data', (n) => {
                n.checkRead(user._id);
                triggerNewNotification(n);
            })
    }
    
    function _getQuery(filter) {
        return Notification.find(filter)
            .limit(10)
            .populate('linkedUser shout')
            .sort({ createdAt: -1 });
    }
    
    function _notificationQuery(id) {
        return _getQuery({ type: { $ne: 'news' }, _user: id, deletedAt: undefined });
    }
    
    function _newsQuery() {
        return _getQuery({ type: 'news', deletedAt: undefined });
    }
    
    function _registerUser(userId, id) {
        User.findByIdAndUpdate(userId, { socket: id })
            .exec((err, user) => {  
                console.log('added socket to user');
                _subscribeUser(user);
            });
    }
    
    function _unregisterUser(id) {
        console.log('unregister user');
        User.findOneAndUpdate({ socket: id }, { socket: null })
            .exec((err, user) => {
                console.log('user unregistered', user); 
            })
    }
})();