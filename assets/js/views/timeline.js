requirejs(
    [
        '$', 
        'controllers/shout', 
        'controllers/shoutbox',
        'controllers/timelines',
    ], 
    function(
        $, 
        shoutCtrl, 
        shoutboxCtrl,
        timelineCtrl
    ) {
        $(function() {
            var shouts = $('.shouts');
            var modal = $('.modal');
            var shoutForm = $('.shout-form');
            var timelineTabs = $('.timeline-tabs');
            var page = 1;

            shoutForm.add(modal).on('click', '[data-click="postShout"]', function(e) {
                e.preventDefault();
                shoutCtrl.post($(this));
            });

            shouts.on('click', '[data-shout-star]', function() {
                shoutCtrl.star(getShoutId($(this)), true);
            });

            shouts.on('click', '[data-shout-unstar]', function() {
                shoutCtrl.star(getShoutId($(this)), false);
            });
            
            shouts.on('click', '[data-shout-delete]', function() {
                shoutCtrl.delete(getShoutId($(this)));
            });

            shouts.on('click', '[data-shout-link]', function() {
                shoutCtrl.popup(getShoutId($(this)));
            });

            shouts.on('click', '[data-shout-reply]', function() {
                shoutCtrl.popup(getShoutId($(this)));
            });

            shouts.on('click', '[data-shout-location]', function() {
                shoutCtrl.calculateDistance($(this));
            });
            
            $('[data-shout-load-more]').on('click', function() {
                var el = $(this);

                shoutCtrl.load(timelineCtrl.currentType(), page, function(shouts) {
                    if (shouts.length > 0) {
                        page++;
                    } else {
                        el.attr('disabled', true);
                    }
                });
            })
                     
            timelineCtrl.initTabs(timelineTabs);   
            shoutboxCtrl.init(shoutForm);
            
            if (shouts.length > 0) shoutCtrl.load(timelineCtrl.currentType());
        });
    }
);

function getShoutId(element) {
    return element.closest('.shout').attr('data-shout-id');
}