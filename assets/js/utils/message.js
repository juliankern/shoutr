define(
    [
        '$',
        'utils/template'
    ], 
    function(
        $,
        template
    ) {
        return {
            error: error,
            confirm: confirmPopup,
            default: message,
            dismiss: dismiss
        };

        function error(title, msg) {
            message('error', title, msg);
        }

        function confirmPopup(text) {
            return confirm(text);
        }
        
        function dismiss() {
            $('.messages').html('');
        }
        
        function message(type, title, msg, close) {
            var msgClass = type === 'error' ? 'danger' : type;
            
            var html = template.render('error', { class: msgClass, close: !!close, title: title, msg: msg });
            $('.messages').html(html);
        }
    }
)