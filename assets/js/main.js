window.shoutr = {};

requirejs.config({
    baseUrl: '/js',
    paths: {
        utils: 'utils',
        views: 'views',
        controller: 'controllers',
        jquery: '//code.jquery.com/jquery-3.1.0.min',
        handlebars: '//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.5/handlebars.min',
        lodash: '//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.15.0/lodash.min',
        emojione: '//cdn.jsdelivr.net/emojione/2.2.6/lib/js/emojione.min',
        modernizr: 'lib/modernizr-custom',
        socket: '//cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.8/socket.io.min',
        // bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min'
        bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.4/js/bootstrap.min',
        // tether: '//cdnjs.cloudflare.com/ajax/libs/tether/1.3.7/js/tether.min'
    },
    map: {
        '*': {
            '$': 'jquery',
            '_': 'lodash',
            'emoji': 'emojione'
        }
    },
    shim: {
        'socketio': {
            exports: 'io'
        },
        'bootstrap': {
            deps: [
                'jquery',
                // 'tether'
            ]
        }
    },
    onNodeCreated: function(node, config, module, path) {
        // Here's  alist of differet integrities for different scripts
        // Append to this list for all scripts that you want SRI for
        var sri = {
            jquery: 'sha256-cCueBR6CsyA4/9szpPfrX3s49M9vUU5BgtiJj06wt/s=',
            handlebars: 'sha256-rMOSOM5HDzVEMoVZTv2189+RKSTSgY5ZKfTfap7q2zE=',
            lodash: 'sha256-3p+DEZPFKqDAX89d3l22ahOiLoe54iW8rGvi2NtRNjM=',
            emojione: 'sha256-r1QTE6OqyCP/xqQCml3O8jLnSm0/6DoIM473m+VnLPM=',
            socket: 'sha256-iItBu0k/grx4e1B97uNd+Kncoy2fWeXkQ0M0uwSqHhc=',
            // bootstrap: 'sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa'
            bootstrap: 'sha384-VjEeINv9OSwtWFLAtmc4JCtEJXXBub00gtSnszmspDLCtC0I4z4nqz7rEFbIZLLU',
            // tether: 'sha256-/5pHDZh2fv1eZImyfiThtB5Ag4LqDjyittT7fLjdT/8='
        };

        if (sri[module]) {
            node.setAttribute('integrity', sri[module]);
            node.setAttribute('crossorigin', 'anonymous');
        }
    }
});

requirejs.onError = function (err) {
    console.log('SHOUTR - requirejs', err.requireType);
    if (err.requireType === 'timeout') {
        console.log('modules: ' + err.requireModules);
    }

    throw err;
};

if (location.href.indexOf('/profile/') !== -1) {
    loadView('profile');
} else if (location.href.indexOf('/login') !== -1) {
    loadView('login');
} else {
    // home
    loadView('timeline');
}

define(
    [
        '$',
        'modernizr', 
        'bootstrap',
        'controllers/notification',
        'utils/language'
    ], 
    function(
        $,
        modernizr, 
        bootstrap,
        notificationCtrl,
        language
    ) {
        notificationCtrl.init();
        language.load();

        $(function() {
            $('[data-tooltip][title]').tooltip();
        })
    }
)

/////////////////////////////////////////

function loadView(view) {
    requirejs(['views/' + view]);
}