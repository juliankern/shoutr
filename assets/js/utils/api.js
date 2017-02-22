define(['$'], function($) {
    return {
        call: apiCall
    };

    function apiCall(method, call, data) {
        return $.ajax({
            url: '/api/' + call,
            type: method,
            data: data,
            dataType: 'json'
        }).fail(function(a, b, c) {
            console.log('FAIL DETECTED', a, b, c);
            console.log(a.getAllResponseHeaders());
        }).done(function(data) {
            if (data.error) {
                for (var i in data.errors) {
                    if (data.errors[i].type === 'nologin') {
                        location.href = '/login';
                    }
                }
            }
        });
    }
})