define(['$', 'handlebars'], function($, Handlebars) {
    return {
        render: render,
        escapeHtml: escapeHtml,
        unescapeHtml: unescapeHtml
    };

    var templates = [];

    function render(name, data, template) {
        if (!templates) {
            templates = [];
        } 
        
        if (!templates[name]) {
            if (!!$('#' + name).length) {
                templates[name] = Handlebars.compile($('#' + name).html());
            } else {
                templates[name] = Handlebars.compile(template);
            }
        }

        return templates[name](data);
    }
    
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function unescapeHtml(str) {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    }
})