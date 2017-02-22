define(
    [
        '$',
        '_',
        'utils/api'
    ], 
    function(
        $,
        _,
        api
    ) {
        return {
            load: load,
            get: get,
            parsedGet: parsedGet
        };
        
        function load() {
            api.call('get', 'language', {}).done(function(resp) {
                if (resp.error === true) {
                    console.log('error loading language')
                } else {
                    // localStorage.set('language_key', resp.language_key);
                    // localStorage.set('language_age', res.language_age);
                    localStorage.setItem('language', JSON.stringify(resp.language));
                }
            }) 
        }
        
        function get(path) {
            return _.get(JSON.parse(localStorage.getItem('language')), path);
        }
        
        function parsedGet(path, data) {
            return get(path).replace(/\{([\w\.]+)\}/, function(full, n) { return _.get(data, n); });
        }
    }
);
