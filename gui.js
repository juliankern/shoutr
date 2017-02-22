var blessed = require('blessed');
var spawn = require('child_process').exec;
var chalk = require('chalk');
var _ = require('lodash');

var appLogo = require('./controllers/ascii');

var argv = require('minimist')(process.argv.slice(2));

var scripts = {
    server: 'nodemon ./server.js --port ' + (argv.port || 3000) + ' --noart'
};

var windows = {};

var screen = blessed.screen({
    fastCSR: true,
    forceUnicode: true,
    terminal: 'windows-ansi'
});

screen.title = 'ShoutR Backend';

var artWindow = blessed.box({
    top: '0%',
    left: '0%',
    width: '100%',
    height: '20%',
    align: 'center',
    content: appLogo.renderString() + '\n' + 'webserver'
});

var optionWindow = blessed.list({
    top: '0%',
    left: '0%',
    width: '20%',
    height: 8,
    label: 'Select Task',
    items: [
        'Restart server',
        'Shutdown'
    ],
    keys: true,
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'green'
        },
        selected: {
            fg: 'green'
        }
    },
    padding: 1
});

function startLog(options, processVar, name) {

    var defaultOpt = {
        scrollbar: true,
        border: {
            type: 'line'
        },
        style: {
            border: {
                fg: 'green'
            },
            scrollbar: {
                bg: 'black',
                fg: 'green'
            }
        },
        padding: 1
    }

    if (!windows[name]) {
        windows[name] = blessed.Log(_.extend(defaultOpt, options));
    }

    processVar.stdout.on('data', (data) => {
        windows[name].log(blessed.parseTags(data));
    });

    processVar.stderr.on('data', (data) => {
        windows[name].log(blessed.parseTags(data));
    });

    return processVar;
}

var serverLog = startLog({
    top: 8,
    left: '0%',
    width: '50%',
    height: '100%-9',
    label: 'Server log',
}, spawn(scripts.server), 'server')

var mongoLog = startLog({
    top: 8,
    left: '50%',
    width: '50%',
    height: argv.dev ? '50%-4' : '100%-8',
    label: 'MongoDB log',
}, spawn('npm run mongodb:'+argv.sys), 'mongo')

if (argv.dev) {
    var watcherLog = startLog({
        top: '50%+4',
        left: '50%',
        width: '50%',
        height: '50%-4',
        label: 'SCSS watcher',
    }, spawn('npm run watch'))  
}

screen.append(artWindow);
screen.append(optionWindow);

for (var i in windows) {
    screen.append(windows[i]);
}

optionWindow.focus();

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.key(['C-r'], function(ch, key) {
    serverLog.kill();
    windows['server'].setContent('');

    serverLog = startLog({}, spawn(scripts.server), 'server');
});

optionWindow.on('select', (a) => {
    var option = a._pcontent;
    if (option === 'Restart server') {
        serverLog.kill();
        windows['server'].setContent('');

        serverLog = startLog({}, spawn(scripts.server), 'server');
    } else if(option === 'Shutdown') {
        return process.exit(0);
    }
})

// Render the screen.
var lines = process.stdout.getWindowSize()[1];
for(var i = 0; i < lines; i++) {
    console.log('\r\n');
}
screen.render();