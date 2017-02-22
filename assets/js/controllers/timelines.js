define(
    [
        '$',
        '_',
        'utils/modal',
        'utils/api',
        'utils/template',
        'utils/location',
        'controllers/user',
        'controllers/shout'
    ], 
    function(
        $, 
        _,
        modal,
        api,
        template,
        location,
        userCtrl,
        shoutCtrl
    ) {
        var timelineButton = $('[data-timeline-button]');
        var timelineTabs;
        var currentTimeline = 'latest';
        var timelineHelpers = [
            _nearbyTimelineHelper
        ];
        
        return {
            create: create,
            add: add,
            remove: remove,
            update: update,
            initTabs: tabs,
            currentType: currentType
        };
        
        function tabs(element) {
            timelineTabs = element;
            
            timelineTabs.on('click', '[data-timeline-type]', function() {
               currentTimeline = $(this).attr('data-timeline-type');
               shoutCtrl.load(currentTimeline);
               _selectTab($(this));
            });

            timelineTabs.on('click', '[data-timeline-id]', function() {
               currentTimeline = $(this).attr('data-timeline-id');
               shoutCtrl.load(currentTimeline);
               _selectTab($(this));
            });
        }
        
        function _selectTab(element) {
            timelineTabs.find('.nav-link.active').removeClass('active');
            element.addClass('active');
            var type = element.attr('data-timeline-type') || 'user';

            for (var i in timelineHelpers) {
                timelineHelpers[i](type, element.attr('data-timeline-id'));
            }
        }
        
        function currentType() {
            return currentTimeline;
        }
        
        function create(userId) {
            modal.init({
                displayFooter: true,
                title: 'Create new timeline',
                body: '<input class="form-control" data-timeline-name placeholder="Timeline name">',
                size: 'small',
                buttons: [{
                    text: 'Save',
                    type: 'confirm',
                    class: 'btn-primary',
                    cb: function(e) {
                        newTL(e.data.modal.find('[data-timeline-name]').val(), userId);
                    }
                }, {
                    text: 'Cancel',
                    type: 'close'
                }]
            });
        }
        
        function update(userId) {
            api.call('get', 'timelines').done(function(resp) {
                if(resp.error === false) {
                    var data = _.map(resp.timelines, function(n) {
                        n.hasUser = n.users.indexOf(userId) !== -1;
                        return n;
                    });
                    
                    timelineButton.html(template.render('timelines-button', { timelines: data }));
                }
            });
        }
        
        function newTL(name, userId) {
            api.call('post', 'timelines/new', { name: name, user: userId }).done(function(resp) {
                if(resp.error === false) {
                    update(userId);
                }
            });
        }
        
        function add(userId, timelineId) {
            api.call('post', 'timelines/add', { user: userId, timeline: timelineId }).done(function(resp) {
                if(resp.error === false) {
                    update(userId);
                }
            });
        }
        
        function remove(userId, timelineId) {
            api.call('post', 'timelines/remove', { user: userId, timeline: timelineId }).done(function(resp) {
                if(resp.error === false) {
                    update(userId);
                }
            });
        }

        //////////////////////////////////////////////////////////////////////////////////
        ///// private methods ////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
            
        function _nearbyTimelineHelper(type, id) {
            if (type === 'nearby') {
                
            }
        }
    }
);