var emojione = require('emojione');

emojione.generateEmojiTag = function(shortcode) {
    var html = '<span class="emoji" data-emoji data-emoji-image="{{image}}" title="{{title}}">{{unicode}}</span>';
    var unicode = this.unifyUnicode(shortcode);
    var image = this.imagePathPNG + this.emojioneList[shortcode].unicode[this.emojioneList[shortcode].unicode.length-1] + '.png' + this.cacheBustParam;
    return html
        .replace(/{{image}}/, image)
        .replace(/{{title}}/, shortcode)
        .replace(/{{unicode}}/, unicode);
};

module.exports = emojione;