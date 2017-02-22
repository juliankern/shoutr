define([], function() {
    return {
        replace: replaceEmojis
    }
    
    function replaceEmojis(element) {
        var unicode;
        var title;
        var image;
        var classes;

        if (!Modernizr.emoji) {
            element.find('[data-emoji]').each(function() {
                unicode = $(this).text();
                title = $(this).attr('title');
                image = $(this).attr('data-emoji-image');
                classes = $(this).attr('class');

                $(this).replaceWith('<img class="' + classes + '" src="' + image + '" title="' + title + '" data-emoji-unicode="' + unicode + '">');
            });
        }
    }
})