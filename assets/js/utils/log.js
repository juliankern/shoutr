define(
    [
        '$'
    ], 
    function(
        $
    ) {
        return {
            debug: debug,
            success: success,
            warn: warn,
            info: info,
            error: error,
            table: table
        };
        
        function debug() {
            console.log.apply(console, arguments);
        }

        function success(str) {
            console.log('%c> SUCCESS', 'background:rgba(0, 120, 0, 0.5);padding: 0 5px;', str);
        }

        function warn() {
            console.warn.apply(console, arguments);
        }

        function info() {
            console.info.apply(console, arguments);
        }

        function error() {
            console.error.apply(console, arguments);
        }

        function table() {
            console.table.apple(console. arguments);
        }
    }
);
