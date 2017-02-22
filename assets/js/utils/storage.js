define(
    [
        '$'
    ], 
    function(
        $
    ) {
        var varDb = {};

        return {
            set: set,
            get: get,
            remove: remove,
            has: has
        };
        
        function set(type, key, value) {
            if (type === 'session') {
                sessionStorage.setItem(key, value);
                varDb[key] = 'session';
            } else if (type === 'local') {
                localStorage.setItem(key, value);
                varDb[key] = 'local';
            }
        }

        function get(key) {
            if (varDb[key] === 'session') {
                return sessionStorage.getItem(key);
            } else if (varDb[key] === 'local') {
                return localStorage.getItem(key);
            }
        }

        function remove(key) {
            if (varDb[key] === 'session') {
                return sessionStorage.removeItem(key);
            } else if (varDb[key] === 'local') {
                return localStorage.removeItem(key);
            }
        }

        function has(key) {
            if (!varDb[key]) { return false; }

            if (varDb[key] === 'session') {
                return sessionStorage.getItem(key) && sessionStorage.getItem(key) != '';
            } else if (varDb[key] === 'local') {
                return localStorage.getItem(key) && localStorage.getItem(key) != '';
            }
        }
    }
);
