requirejs(
    [
        '$', 
        'utils/modal', 
        'utils/template', 
        'controllers/timelines'
    ], 
    function(
        $, 
        modal, 
        template,
        timelineCtrl
    ) {
        $(function() {
            var timelineButton = $('[data-timeline-button]');
            var userId = $('.shortprofile[data-user-id]').attr('data-user-id');
            
            timelineButton.on('click', '[data-create-timeline]', function () {
                timelineCtrl.create(userId);
            });
            
            timelineButton.on('click', '[data-timeline-id][data-add]', function () {
                timelineCtrl.add(userId, $(this).attr('data-timeline-id'));
            });
            
            timelineButton.on('click', '[data-timeline-id][data-remove]', function () {
                timelineCtrl.remove(userId, $(this).attr('data-timeline-id'));
            });

            var shoutQuery = location.search.match(/\?shout=([\w]+)/);
            var shoutData = JSON.parse(sessionStorage.shout);

            if (shoutData && shoutQuery && shoutData._id === shoutQuery[1]) {
                console.log('popup for', shoutQuery[1], shoutData._id === shoutQuery[1]);

                modal.init({
                    displayBodyClose: true,
                    displayHeader: false,
                    body: template.render('shout', { shout: shoutData })
                }).on('shown.bs.modal', function() {
                    $('.modal [data-shout-link]').hide();
                    delete sessionStorage.shout;
                }).on('hidden.bs.modal', function() {
                    window.history.replaceState({}, '', location.pathname);
                });
            }
        });
    }
);
