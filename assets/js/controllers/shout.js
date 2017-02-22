define(
    [
        'utils/api', 
        'utils/template',
        'utils/message',
        'utils/emoji',
        'utils/modal',
        'utils/location',
        'utils/storage',
        'controllers/user',
        'controllers/timelines'
    ], 
    function(
        apiUtil, 
        templateUtil,
        messageUtil,
        emojiUtil,
        modalUtil,
        locationUtil,
        storageUtil,
        userCtrl,
        timelineCtrl
    ) {
        var shoutList = $('[data-shout-list]');
        var locationActive = false;
        var shoutModal;

        return {
            post: post,
            load: load,
            render: render,
            star: star,
            popup: popup,
            delete: deleteShout,
            getNewShoutText: _getNewShoutText,
            updateLengthDisplay: updateLengthDisplay,
            calculateDistance: calculateDistance
        };

        function render(shouts, preseveList) {
            var shoutsElements = shoutList.find('.shout');
            
            if (!preseveList) {
                shoutList.html('');
            }

            for (i in shouts) {
                addShoutToList(shouts[i], 'append');
            }

            emojiUtil.replace(shoutList);
            shoutList.find('[data-tooltip][title]').tooltip();
        }

        function addShoutToList(data, position) {
            if (!position) { position = 'prepend'; }

            var shoutElement = $(templateUtil.render('shout', { shout: data }));
            shoutElement.data('shout', data);

            if (position === 'prepend') {
                shoutList.prepend(shoutElement);
            } else if (position === 'append') {
                shoutList.append(shoutElement);
            }
        }

        function popup(id) {
            var oldUrl = window.location.href;

            _shoutModal(id, { hideButtons: true }, function(e, modal) {
                history.pushState({}, '', '/shout/' + id);
            }, function(e, modal) {
                history.pushState({}, '', oldUrl);
            })
        }

        function post(element) {
            var text = _getNewShoutText(element, true, true);
            var loc;
            var replyTo = element.parents('form').attr('data-shout-reply');
            
            if (storageUtil.has('location') && (Date.now() - storageUtil.get('location-timestamp')) < 30*60*1000 ) {        
                loc = storageUtil.get('location');
            }

            apiUtil.call('post', 'shout', { text: text, loc: loc, replyTo: replyTo }).done(function(resp) {
                if(resp.error === false) {
                    if (!replyTo) {
                        // TODO: add shout to correct timeline, not to the currently active
                        addShoutToList(
                            getMetaForShout(resp.shout)
                        );

                        shoutList.find('[data-tooltip][title]').tooltip();
                    } else {
                        apiUtil.call('get', 'shout/' + replyTo).done(function(resp) {
                            shoutModal.modal('hide');
                            update(replyTo, getMetaForShout(resp.shout));
                        });
                    }
                }
            });
        }
        
        function deleteShout(id) {
            modalUtil.init({
                displayHeader: false,
                displayFooter: true,
                body: 'Do you really want to delete this shout?',
                size: 'small',
                buttons: [{
                    text: 'Delete',
                    type: 'confirm',
                    class: 'btn-primary',
                    cb: function() {
                        apiUtil.call('post', 'shout/delete', { id: id }).done(function(data) {
                            if (!data.error) {
                                remove(id);
                            } else {
                                messageUtil.error('Error deleting shout!', data.error);
                            }
                        })
                    }
                }, {
                    text: 'Cancel',
                    type: 'close'
                }]
            });
        }
        
        function getMetaForShouts(shouts) {
            for (var i in shouts) {
                shouts[i] = getMetaForShout(shouts[i])
            }
            
            return shouts;
        }
        
        function getMetaForShout(shout) {
            shout.canDeleteShout = (shout._user ? userCtrl.isCurrent(shout._user._id) : false) || userCtrl.hasRight('canDeleteShouts');
            shout.isStaredByUser = $.inArray(userCtrl.getCurrentId(), shout.stars) > -1;
            
            return shout;
        }

        function load(timeline, page, cb) {
            var type = 'timeline';
            if (timeline) type+= '/' + timeline;

            _getLoadData(timeline, function(data) {
                apiUtil.call('get', type, _.extend(data, { page: page })).done(function(data) {
                    var shouts;

                    if (!data.error) {
                        render(getMetaForShouts(data.shouts), !!page);
                    } else {
                        messageUtil.error('Error loading shouts!', data.error);
                    }

                    if (cb) cb(data.shouts);
                });

            });
        
        }

        function update(id, data) {
            var shoutElement = shoutList.find('.shout[data-shout-id="' + id + '"]');
            var newShoutElement = $(templateUtil.render('shout', { shout: data }));
            newShoutElement.data('shout', data);
            shoutElement.replaceWith(newShoutElement);
            emojiUtil.replace(shoutList.find('.shout[data-shout-id="' + id + '"]'));
        }
        
        function remove(id) {
            var shoutElement = shoutList.find('.shout[data-shout-id="' + id + '"]');
            shoutElement.remove();
        }

        function updateLengthDisplay(ele, event) {
            var max = 200;
            var data = _checkShoutLength(ele, event, max);
            var lengthDisplay = ele.parents('form').find('[data-shout-length]')

            if (data.tooLong) {
                lengthDisplay.addClass('text-danger');
            } else {
                lengthDisplay.removeClass('text-danger');
            }

            lengthDisplay.text( data.shoutLength + '/' + max );
        }

        function star(id, isStar) {
            apiUtil.call('post', 'shout/star', { id: id, isStar: isStar }).done(function(data) {
                if (!data.error) {
                    update(id, getMetaForShout(data.shout));
                } else {
                    messageUtil.error('Error liking shout!', data.error);
                }
            })
        }

        function calculateDistance(element) {
            locationUtil.getData(30*60*1000, function(err, loc) {
                if (err) {
                    console.log('Error getting Location:', err);
                    messageUtil.error('Geolocation is not supported by your borwser :(');
                } else {
                    element.after(locationUtil.calculateDistance(element.attr('data-location').split(','), loc));
                }
            })
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // private methods /////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////////////////

        function _shoutModal(id, data, onShown, onHidden) {
            apiUtil.call('get', 'shout/' + id, { }).done(function(resp) {
                if (resp.replys) {
                    _.forEach(resp.replys, function(n) { return _.extend(n, data); });
                }
                
                shoutModal = modalUtil.init({
                    displayHeader: false,
                    displayFooter: true,
                    size: 'normal',
                    buttons: [],
                    body: templateUtil.render('shout', _.extend(resp, data)) + templateUtil.render('shout-reply', _.extend({ id: resp.shout._id }, data)),
                    onShown: function(e, newModal) {
                        require('controllers/shoutbox').init(newModal.find('[data-shout-reply]'));
                        onShown(e, newModal, resp);
                    },
                    onHidden: onHidden
                });
            })
        }

        function _getLoadData(timeline, cb) {
            if (timeline === 'nearby') {
                locationUtil.getData(30*60*1000, function(err, loc) {
                    if (err) {
                        console.log('Error getting Location:', err);
                        messageUtil.error('Geolocation is not supported by your borwser :(');
                    } else {
                        cb({ long: loc[0], lat: loc[1] });
                    }
                })
            } else {
                cb({});
            }
        }

        function _checkShoutLength(ele, event, max) {
            var shoutLength = _getNewShoutText(ele).length;
            var isTooLong = shoutLength > max;

            if(event.which != 8 && isTooLong) {
               // $('#'+content_id).text($('#'+content_id).text().substring(0, max));
               event.preventDefault();
            }

            return { tooLong: isTooLong, shoutLength: shoutLength };
        }

        function _getNewShoutText(element, emptyTextelement, preserveLinebreaks) {
            var textElement = element.parents('form').find('[data-shout]');
            
            var text = textElement
                .html()
                .replace(/<div>/g, "\n")
                .replace(/<\/div>/g, "")
                .replace(/<br>/g, "\n");

            if(emptyTextelement) {
                textElement.html('');
                require('controllers/shoutbox').placeholderUpdate();
            }

            if (!preserveLinebreaks) { 
                return textElement.text();
            }

            return text;
        }
    }
);

