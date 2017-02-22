define(
    [
        '$',
        'socket',
        'utils/template',
        'utils/api',
        'utils/language',
        'controllers/user',
        'controllers/shout'
    ], 
    function(
        $,
        io,
        template,
        api,
        language,
        userCtrl,
        shoutCtrl
    ) {
        var socket;
        var newsList = $('[data-news-list]');
        var notificationList = $('[data-notifications-list]');
        var newsAndNotificationList = newsList.add(notificationList);
        var notificationAvailable = true;
        var gotPermission = false;
        
        return {
            init: init,
            listen: listen
        };
        
        function init() {
            socket = io.connect('http://' + location.host + '/');
            
            newsAndNotificationList.on('click', '[data-notification-id][data-notification-unread]', function() {
                console.log('clicked, mark as read'); 
                _markAsRead($(this).attr('data-notification-id'));
            });
            
            newsAndNotificationList.on('click', '[data-shout-link]', function() {
                shoutCtrl.link($(this).attr('data-shout-link'));
            });
            
            socket.on('connect', function() {
                _subscribeNews();
                _subscribeNotifications();
            });

            socket.on('connect_error', function(err) {
                console.log('socket.io connection error', err);
            });

            socket.on('connect_timeout', function() {
                console.log('socket.io connection timeout!');
            });

            if (!("Notification" in window)) {
                notificationAvailable = false;
            } else {
                if (Notification.permission === "granted") {
                    gotPermission = true;
                } else {
                    Notification.requestPermission(function (permission) {
                        if (permission === 'granted') {
                            gotPermission = true;
                        }
                    });
                }
            }
        }
        
        function listen(type, cb) {
            socket.on(type, function(data) {
                cb(data)
            })
        }
        
        function _subscribeNotifications() {
            socket.emit('registerUser', { id: userCtrl.getCurrentId() });
            socket.on('notification', function(notification) {
                _addNotification(_parseNotification(notification));
            })
        }
        
        
        function _subscribeNews() {
            socket.on('news', function(news) {
                _addNews(_parseNotification(news));
            })
        }
        
        function _parseNotification(n) {
            if (n.type === 'mention') {
                n.headline = language.parsedGet('notification.mention.headline', n);
                n.text = language.parsedGet('notification.mention.text', n);
            }
            
            return n;
        }
        
        function _markAsRead(id) {
            api.call('post', 'notification/read', { id: id }).done(function(resp) {                
                if(resp.error === false) {
                    $('[data-notification-id="' + id + '"]').removeAttr('data-notification-unread');
                    if (resp.notification.type === 'news') {
                        _countNewsBadge(-1);
                    } else {
                        _countNotificationBadge(-1);
                    }
                }
            });
        }
        
        function _addNews(data) {
            if ($('[data-notification-id="' + data.id + '"]').length === 0) {
                console.log('NEW news found!', data);
                var newsElement = $(template.render('notification-item', data));
                newsElement.data('notification', data);
                newsList.prepend(newsElement);
                _countNewsBadge(+1);
            }
        }
        
        function _addNotification(data) {
            if ($('[data-notification-id="' + data.id + '"]').length === 0) {
                console.log('NEW notification found!', data._id, data.type);
                var notificationElement = $(template.render('notification-item', data));
                notificationElement.data('notification', data);
                notificationList.prepend(notificationElement);
                if (!data.isReadByUser) {
                    _countNotificationBadge(+1);
                    _desktopNotification(data.headline, { body: data.text });
                }
            }
        }

        function _desktopNotification(title, options) {
            if (notificationAvailable && gotPermission) {
                new Notification(title, options);
            }
        }
        
        function _countNewsBadge(num) {
            var badge = $('[data-news-badge]');
            var count = badge.text()*1;
            count = count + num;
            if (count === 0) count = '';
            
            badge.text(count);
        }
        
        function _countNotificationBadge(num) {
            var badge = $('[data-notifications-badge]');
            var count = badge.text()*1;
            count = count + num;
            if (count === 0) count = '';
            
            badge.text(count);
        }
    }
);
